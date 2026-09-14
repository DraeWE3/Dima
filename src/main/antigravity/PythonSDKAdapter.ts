import { spawn, ChildProcess } from 'child_process';
import { AgentStatus, AgentOutput, AntigravityAdapter } from './AntigravityAdapter';
import path from 'path';
import fs from 'fs';
import { db } from '../database/db';
import { log } from '../utils/logger';

export class PythonSDKAdapter implements AntigravityAdapter {
  private sessions = new Map<string, ChildProcess>();
  private statuses = new Map<string, string>();

  async initialize(config: any): Promise<void> {
    console.log("Python SDK Adapter initialized.");
  }

  async startTask(input: { workspacePath: string; prompt: string; missionId?: string; model?: string }): Promise<{ sessionId: string }> {
    const sessionId = input.missionId || Date.now().toString();
    
    // Prefer a bundled python runtime if one was set up (see scripts/setup-python.*),
    // otherwise fall back to whatever python is on the user's PATH.
    const bundledPython = path.join(
      process.cwd(),
      'python_bin',
      'tools',
      process.platform === 'win32' ? 'python.exe' : 'python3'
    );
    const pythonExecutable = process.env.DIMA_PYTHON_PATH
      || (fs.existsSync(bundledPython) ? bundledPython : (process.platform === 'win32' ? 'python.exe' : 'python3'));
    const bridgeScript = path.join(process.cwd(), 'python-bridge', 'main.py');

    if (!fs.existsSync(bridgeScript)) {
      const message = `python-bridge/main.py not found at ${bridgeScript}. The Antigravity agent bridge is not set up on this machine.`;
      log.error(message);
      this.statuses.set(sessionId, 'FAILED');
      db.updateMissionStatus(sessionId, 'ERROR');
      db.addLog(sessionId, { role: 'system', content: `[DIMA] ${message}`, timestamp: Date.now() });
      return { sessionId };
    }

    // Spawn the long-running python bridge inside the target workspace to satisfy Antigravity sandbox
    const child = spawn(pythonExecutable, [bridgeScript], { cwd: input.workspacePath });
    
    this.sessions.set(sessionId, child);
    this.statuses.set(sessionId, 'RUNNING');

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter((l: string) => l.trim() !== '');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          console.log(`[Antigravity Agent]`, parsed);
          if (parsed.type === 'output') {
            db.addLog(sessionId, { role: 'agent', content: parsed.content, timestamp: Date.now() });
          } else if (parsed.type === 'status' && parsed.status === 'completed') {
            this.statuses.set(sessionId, 'COMPLETED');
            db.updateMissionStatus(sessionId, 'COMPLETED');
          } else if (parsed.type === 'status' && parsed.status === 'error') {
            this.statuses.set(sessionId, 'FAILED');
            db.updateMissionStatus(sessionId, 'ERROR');
          }
          // In a full implementation, we'd emit these events back to the React UI via IPC
        } catch (e) {
          console.log(`[Antigravity Log]`, line);
        }
      }
    });

    child.stderr.on('data', (data) => {
      log.error('[Antigravity Error]', data.toString());
    });

    child.on('error', (err) => {
      log.error('Failed to spawn python bridge process', err);
      this.statuses.set(sessionId, 'FAILED');
      db.updateMissionStatus(sessionId, 'ERROR');
    });

    // Send the initialization and start task commands
    const initCmd = JSON.stringify({ action: 'initialize', id: sessionId });
    const startCmd = JSON.stringify({ action: 'startTask', id: sessionId, workspacePath: input.workspacePath, prompt: input.prompt, model: input.model });
    
    child.stdin.write(initCmd + '\n');
    child.stdin.write(startCmd + '\n');

    return { sessionId };
  }

  async getStatus(sessionId: string): Promise<AgentStatus> {
    return { state: (this.statuses.get(sessionId) || 'IDLE') as AgentStatus['state'] };
  }

  async getOutput(sessionId: string): Promise<AgentOutput> {
    return { stdout: '', stderr: '', toolCalls: [] };
  }

  async sendInstruction(sessionId: string, instruction: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && session.stdin) {
      this.statuses.set(sessionId, 'RUNNING');
      db.updateMissionStatus(sessionId, 'RUNNING');
      session.stdin.write(JSON.stringify({ action: 'sendInstruction', id: sessionId, instruction }) + '\n');
    }
  }

  async interrupt(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.kill('SIGINT');
    }
  }

  async close(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.kill();
      this.sessions.delete(sessionId);
    }
  }
}
