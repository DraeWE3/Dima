import { spawn, ChildProcess } from 'child_process';
import { AgentStatus, AgentOutput, AntigravityAdapter } from './AntigravityAdapter';

export class CliAdapter implements AntigravityAdapter {
  private sessions = new Map<string, ChildProcess>();

  async initialize(config: any): Promise<void> {
    // Check if agy is available
  }

  async startTask(input: { workspacePath: string; prompt: string }): Promise<{ sessionId: string }> {
    const sessionId = Date.now().toString();
    const child = spawn('agy', ['--workspace', input.workspacePath, '--prompt', input.prompt]);
    this.sessions.set(sessionId, child);
    return { sessionId };
  }

  async getStatus(sessionId: string): Promise<AgentStatus> {
    return { state: 'IDLE' }; // TODO: Parse CLI output or use IPC if possible
  }

  async getOutput(sessionId: string): Promise<AgentOutput> {
    return { stdout: '', stderr: '', toolCalls: [] };
  }

  async sendInstruction(sessionId: string, instruction: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && session.stdin) {
      session.stdin.write(instruction + '\\n');
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
