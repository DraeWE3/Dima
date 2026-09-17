import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { AgentStatus, AgentOutput, AntigravityAdapter } from './AntigravityAdapter';
import { db } from '../database/db';
import { log } from '../utils/logger';
import { mcpClientManager } from '../mcp/McpClientManager';

const execPromise = util.promisify(exec);

const MAX_ITERATIONS = 25;
const COMMAND_TIMEOUT_MS = 120_000;
const OUTPUT_LIMIT = 10_000;

const SYSTEM_PROMPT = `You are DIMA, an autonomous coding agent operating directly on the user's project folder.
You have tools to read files, write files, list directories, and run shell commands in the workspace.
Use them to accomplish the user's objective end-to-end: make the necessary code changes, install
dependencies if needed, and verify your work (e.g. by running a build or tests) before finishing.
Call the "finish" tool with a short summary once the objective is fully satisfied. Be autonomous -
do not ask the user questions; make reasonable decisions and proceed.`;

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: "Read the contents of a file in the workspace.",
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Path relative to the workspace root' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file in the workspace with the given content.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to the workspace root' },
          content: { type: 'string', description: 'Full file content to write' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_dir',
      description: 'List files and subdirectories at a path in the workspace.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Path relative to the workspace root (default: ".")' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Run a shell command in the workspace root and return its output. Use for installing deps, running builds/tests, etc.',
      parameters: {
        type: 'object',
        properties: { command: { type: 'string', description: 'The shell command to execute' } },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'finish',
      description: 'Call this when the objective is complete, with a short summary of what was done.',
      parameters: {
        type: 'object',
        properties: { summary: { type: 'string' } },
        required: ['summary'],
      },
    },
  },
];

interface Session {
  workspacePath: string;
  model: string;
  status: AgentStatus['state'];
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  interrupted: boolean;
  // Some reasoning models (e.g. gpt-6-astra) reject function tools on
  // /v1/chat/completions unless a specific reasoning_effort is set - and
  // which value is even valid varies by model and contradicts the API's own
  // error hints in practice. Discovered lazily by parsing each 400's message
  // rather than hardcoding a model list or a single "correct" value.
  reasoningEffort?: string;
}

/**
 * Drives an autonomous coding loop directly from DIMA itself, for users who
 * don't have a separate AI coding tool (Claude Code, Antigravity, etc.)
 * already editing their project. Uses plain OpenAI function-calling with a
 * small filesystem/shell tool set, scoped to the mission's workspace.
 */
export class NativeAgentAdapter implements AntigravityAdapter {
  private openai: OpenAI;
  private sessions = new Map<string, Session>();

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'mock-key' });
  }

  async initialize(): Promise<void> {}

  async startTask(input: { workspacePath: string; prompt: string; missionId?: string; model?: string }): Promise<{ sessionId: string }> {
    const sessionId = input.missionId || Date.now().toString();

    if (!process.env.OPENAI_API_KEY) {
      const message = 'OPENAI_API_KEY is not set - DIMA has no LLM to drive the agent loop.';
      log.error(message);
      db.addLog(sessionId, { role: 'system', content: `[DIMA] ${message}`, timestamp: Date.now() });
      db.updateMissionStatus(sessionId, 'ERROR');
      this.sessions.set(sessionId, this.makeSession(input, 'FAILED'));
      return { sessionId };
    }

    const session = this.makeSession(input, 'RUNNING');
    this.sessions.set(sessionId, session);
    this.runLoop(sessionId).catch(err => this.failSession(sessionId, err));
    return { sessionId };
  }

  private makeSession(input: { workspacePath: string; prompt: string; model?: string }, status: AgentStatus['state']): Session {
    return {
      workspacePath: input.workspacePath,
      model: input.model || process.env.DIMA_MODEL || 'gpt-4o',
      status,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input.prompt },
      ],
      interrupted: false,
    };
  }

  async getStatus(sessionId: string): Promise<AgentStatus> {
    return { state: this.sessions.get(sessionId)?.status || 'IDLE' };
  }

  async getOutput(): Promise<AgentOutput> {
    return { stdout: '', stderr: '', toolCalls: [] };
  }

  async sendInstruction(sessionId: string, instruction: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.messages.push({ role: 'user', content: instruction });
    session.status = 'RUNNING';
    session.interrupted = false;
    this.runLoop(sessionId).catch(err => this.failSession(sessionId, err));
  }

  async interrupt(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.interrupted = true;
      session.status = 'INTERRUPTED';
    }
  }

  async close(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  private failSession(sessionId: string, err: unknown) {
    log.error(`Native agent loop crashed for mission ${sessionId}`, err);
    const session = this.sessions.get(sessionId);
    if (session) session.status = 'FAILED';
    db.addLog(sessionId, { role: 'system', content: `[DIMA] Agent loop crashed: ${err instanceof Error ? err.message : String(err)}`, timestamp: Date.now() });
    db.updateMissionStatus(sessionId, 'ERROR');
  }

  /**
   * Some reasoning models (gpt-6-astra and friends) reject function tools on
   * /v1/chat/completions with a 400 unless a specific reasoning_effort is
   * set - and which value actually works varies by model, sometimes
   * contradicting the API's own first error message (e.g. it suggested
   * 'none', then rejected 'none' and listed 'low'/'medium'/'high'/'xhigh'
   * as the real options). Rather than hardcode a value, each 400 is parsed
   * for the value(s) OpenAI says are valid and retried with that, caching
   * the result on the session once one works. Values here can be newer than
   * this project's installed SDK types, hence the casts.
   */
  private async createCompletion(session: Session, mcpTools: OpenAI.Chat.Completions.ChatCompletionTool[]) {
    const baseParams = {
      model: session.model,
      messages: session.messages,
      tools: [...TOOLS, ...mcpTools],
    };

    let params: any = session.reasoningEffort ? { ...baseParams, reasoning_effort: session.reasoningEffort } : baseParams;

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await this.openai.chat.completions.create(params);
      } catch (e: any) {
        const message: string = e?.message || '';
        const nextEffort = this.parseReasoningEffortHint(message);
        if (!nextEffort || nextEffort === session.reasoningEffort) throw e;

        log.info(`Model ${session.model}: retrying with reasoning_effort '${nextEffort}' (from: ${message})`);
        session.reasoningEffort = nextEffort;
        params = { ...baseParams, reasoning_effort: nextEffort };
      }
    }
    throw new Error(`Could not find a working reasoning_effort for model ${session.model} after several attempts.`);
  }

  /** Pulls a reasoning_effort value to try next out of one of OpenAI's own error messages. */
  private parseReasoningEffortHint(message: string): string | null {
    if (!message.includes('reasoning_effort')) return null;

    // "Supported values are: 'low', 'medium', 'high', and 'xhigh'." - take the first listed.
    const supported = /supported values are:?\s*((?:'[^']+'[,\s]*(?:and\s*)?)+)/i.exec(message);
    if (supported) {
      const values = [...supported[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
      if (values.length) return values[0];
    }

    // "...set reasoning_effort to 'none'."
    const setTo = /set reasoning_effort to '([^']+)'/i.exec(message);
    if (setTo) return setTo[1];

    return null;
  }

  private async runLoop(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      if (session.interrupted) return;

      const mcpTools: OpenAI.Chat.Completions.ChatCompletionTool[] = mcpClientManager.listToolsForAgent().map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description || t.name,
          parameters: t.inputSchema || { type: 'object', properties: {} },
        },
      }));

      const response = await this.createCompletion(session, mcpTools);

      const message = response.choices[0]?.message;
      if (!message) break;
      session.messages.push(message);

      if (!message.tool_calls || message.tool_calls.length === 0) {
        db.addLog(sessionId, { role: 'agent', content: message.content || '(no response)', timestamp: Date.now() });
        session.status = 'COMPLETED';
        return;
      }

      let finished = false;
      let finishSummary = '';

      for (const call of message.tool_calls) {
        if (session.interrupted) return;
        const result = await this.executeTool(sessionId, session, call);
        session.messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
        if (call.function.name === 'finish') {
          finished = true;
          finishSummary = (result as any).summary || '';
        }
      }

      if (finished) {
        db.addLog(sessionId, { role: 'agent', content: `[DIMA] Objective complete.\n${finishSummary}`, timestamp: Date.now() });
        session.status = 'COMPLETED';
        return;
      }
    }

    db.addLog(sessionId, { role: 'system', content: `[DIMA] Agent stopped after ${MAX_ITERATIONS} steps without calling finish.`, timestamp: Date.now() });
    session.status = 'FAILED';
  }

  private resolveSafePath(workspacePath: string, relPath: string): string {
    const root = path.resolve(workspacePath);
    const resolved = path.resolve(root, relPath || '.');
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new Error(`Path "${relPath}" escapes the workspace root`);
    }
    return resolved;
  }

  private async executeTool(sessionId: string, session: Session, call: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): Promise<unknown> {
    const name = call.function.name;
    let args: any = {};
    try {
      args = JSON.parse(call.function.arguments || '{}');
    } catch {
      // leave args empty; the tool implementation below will surface a clear error
    }

    const summary = name === 'run_command' ? `run_command: ${args.command}`
      : name === 'write_file' ? `write_file: ${args.path}`
      : name === 'read_file' ? `read_file: ${args.path}`
      : name === 'list_dir' ? `list_dir: ${args.path || '.'}`
      : name;
    db.addLog(sessionId, { role: 'agent', content: `[TOOL] ${summary}`, timestamp: Date.now() });

    if (mcpClientManager.isMcpToolName(name)) {
      return mcpClientManager.callTool(name, args);
    }

    try {
      switch (name) {
        case 'read_file': {
          const p = this.resolveSafePath(session.workspacePath, args.path);
          const content = fs.readFileSync(p, 'utf-8');
          return { ok: true, content: content.slice(0, OUTPUT_LIMIT * 2) };
        }
        case 'write_file': {
          const p = this.resolveSafePath(session.workspacePath, args.path);
          fs.mkdirSync(path.dirname(p), { recursive: true });
          fs.writeFileSync(p, args.content ?? '');
          return { ok: true };
        }
        case 'list_dir': {
          const p = this.resolveSafePath(session.workspacePath, args.path || '.');
          const entries = fs.readdirSync(p, { withFileTypes: true })
            .map(e => e.name + (e.isDirectory() ? '/' : ''));
          return { ok: true, entries };
        }
        case 'run_command': {
          const { stdout, stderr } = await execPromise(args.command, {
            cwd: session.workspacePath,
            timeout: COMMAND_TIMEOUT_MS,
            maxBuffer: 5 * 1024 * 1024,
          });
          return { ok: true, stdout: stdout.slice(0, OUTPUT_LIMIT), stderr: stderr.slice(0, OUTPUT_LIMIT) };
        }
        case 'finish': {
          return { ok: true, summary: args.summary || '' };
        }
        default:
          return { ok: false, error: `Unknown tool "${name}"` };
      }
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
}
