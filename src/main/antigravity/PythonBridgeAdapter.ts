import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { AgentStatus, AgentOutput, AntigravityAdapter } from './AntigravityAdapter';

export class PythonBridgeAdapter implements AntigravityAdapter {
  private bridgeProcess: ChildProcess | null = null;
  private messageIdCounter = 0;
  private pendingRequests = new Map<number, { resolve: (val: any) => void, reject: (err: any) => void }>();

  async initialize(config: any): Promise<void> {
    const pythonPath = process.env.DIMA_PYTHON_PATH || (process.platform === 'win32' ? 'python.exe' : 'python3');
    const scriptPath = path.join(__dirname, '../../../python-bridge/main.py');
    
    this.bridgeProcess = spawn(pythonPath, [scriptPath]);
    
    this.bridgeProcess.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.id !== undefined && this.pendingRequests.has(response.id)) {
            if (response.status === 'ok') {
              this.pendingRequests.get(response.id)!.resolve(response);
            } else {
              this.pendingRequests.get(response.id)!.reject(new Error(response.error));
            }
            this.pendingRequests.delete(response.id);
          }
        } catch (err) {
          console.error('Failed to parse bridge output', err);
        }
      }
    });

    await this.sendRequest('initialize', config);
  }

  private sendRequest(action: string, payload: any = {}): Promise<any> {
    if (!this.bridgeProcess) throw new Error('Bridge not initialized');
    return new Promise((resolve, reject) => {
      const id = ++this.messageIdCounter;
      this.pendingRequests.set(id, { resolve, reject });
      this.bridgeProcess!.stdin?.write(JSON.stringify({ id, action, ...payload }) + '\\n');
    });
  }

  async startTask(input: { workspacePath: string; prompt: string }): Promise<{ sessionId: string }> {
    const res = await this.sendRequest('startTask', input);
    return { sessionId: res.sessionId };
  }

  async getStatus(sessionId: string): Promise<AgentStatus> {
    const res = await this.sendRequest('getStatus', { sessionId });
    return { state: res.state, message: res.message };
  }

  async getOutput(sessionId: string): Promise<AgentOutput> {
    return { stdout: '', stderr: '', toolCalls: [] }; // Mock for now
  }

  async sendInstruction(sessionId: string, instruction: string): Promise<void> {
    await this.sendRequest('sendInstruction', { sessionId, instruction });
  }

  async interrupt(sessionId: string): Promise<void> {
    await this.sendRequest('interrupt', { sessionId });
  }

  async close(sessionId: string): Promise<void> {
    this.bridgeProcess?.kill();
  }
}
