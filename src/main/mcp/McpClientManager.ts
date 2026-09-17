import os from 'os';
import path from 'path';
import fs from 'fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { log } from '../utils/logger';

export interface McpServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
}

interface Connection {
  client: Client;
  tools: { name: string; description?: string; inputSchema: any }[];
  status: 'connected' | 'error';
  error?: string;
}

const configPath = path.join(os.homedir(), '.dima_data', 'mcp_servers.json');

function loadConfigs(): McpServerConfig[] {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {
    log.error('Failed to load MCP server configs', e);
  }
  return [];
}

function saveConfigs(configs: McpServerConfig[]) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
}

/**
 * Lets DIMA connect out to arbitrary user-configured MCP servers (the same
 * way Claude Desktop / Claude Code do) so the NativeAgentAdapter's own agent
 * loop can call their tools alongside its built-in file/shell tools.
 */
class McpClientManager {
  private connections = new Map<string, Connection>();

  async initialize() {
    const configs = loadConfigs();
    await Promise.all(configs.map(c => this.connect(c)));
  }

  listConfigs(): McpServerConfig[] {
    return loadConfigs();
  }

  getStatus(): Array<McpServerConfig & { status: string; toolCount: number; error?: string }> {
    return loadConfigs().map(c => {
      const conn = this.connections.get(c.id);
      return {
        ...c,
        status: conn?.status || 'disconnected',
        toolCount: conn?.tools.length || 0,
        error: conn?.error,
      };
    });
  }

  async addServer(name: string, command: string, args: string[]): Promise<McpServerConfig> {
    const configs = loadConfigs();
    const config: McpServerConfig = { id: Date.now().toString(), name, command, args };
    configs.push(config);
    saveConfigs(configs);
    await this.connect(config);
    return config;
  }

  async removeServer(id: string) {
    const configs = loadConfigs().filter(c => c.id !== id);
    saveConfigs(configs);
    const conn = this.connections.get(id);
    if (conn) {
      try { await conn.client.close(); } catch {}
      this.connections.delete(id);
    }
  }

  async reconnectServer(id: string): Promise<boolean> {
    const config = loadConfigs().find(c => c.id === id);
    if (!config) return false;
    const existing = this.connections.get(id);
    if (existing?.client) {
      try { await existing.client.close(); } catch {}
    }
    await this.connect(config);
    return this.connections.get(id)?.status === 'connected';
  }

  private async connect(config: McpServerConfig) {
    try {
      const transport = new StdioClientTransport({ command: config.command, args: config.args });
      const client = new Client({ name: 'dima-agent', version: '1.0.0' }, { capabilities: {} });
      await Promise.race([
        client.connect(transport),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out after 15s - is the command/args correct?')), 15000)),
      ]);
      const result = await client.listTools();
      this.connections.set(config.id, { client, tools: result.tools as any, status: 'connected' });
      log.info(`Connected to MCP server "${config.name}" (${result.tools.length} tools)`);
    } catch (e: any) {
      log.error(`Failed to connect to MCP server "${config.name}"`, e);
      this.connections.set(config.id, { client: null as any, tools: [], status: 'error', error: e.message });
    }
  }

  /** Tool defs across all connected servers, namespaced as mcp__<serverId>__<toolName>. */
  listToolsForAgent(): { name: string; description?: string; inputSchema: any }[] {
    const out: { name: string; description?: string; inputSchema: any }[] = [];
    for (const [serverId, conn] of this.connections) {
      if (conn.status !== 'connected') continue;
      for (const tool of conn.tools) {
        out.push({
          name: `mcp__${serverId}__${tool.name}`,
          description: tool.description,
          inputSchema: tool.inputSchema,
        });
      }
    }
    return out;
  }

  isMcpToolName(name: string): boolean {
    return name.startsWith('mcp__');
  }

  async callTool(namespacedName: string, args: any): Promise<unknown> {
    const [, serverId, ...rest] = namespacedName.split('__');
    const toolName = rest.join('__');
    const conn = this.connections.get(serverId);
    if (!conn || conn.status !== 'connected') {
      return { ok: false, error: `MCP server "${serverId}" is not connected` };
    }
    try {
      const result = await conn.client.callTool({ name: toolName, arguments: args });
      return { ok: true, result };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
}

export const mcpClientManager = new McpClientManager();
