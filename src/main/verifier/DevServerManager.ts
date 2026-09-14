import { ChildProcess, spawn } from 'child_process';
import fetch from 'node-fetch';
import { EventEmitter } from 'events';

export class DevServerManager extends EventEmitter {
  private serverProcess: ChildProcess | null = null;
  public port: number;
  public isReady: boolean = false;

  constructor(port: number = 3000) {
    super();
    this.port = port;
  }

  async start(command: string, cwd: string): Promise<void> {
    if (this.serverProcess) {
      return; // Already running
    }
    
    // Naive split, robust version would use cross-spawn or parsed args
    const [cmd, ...args] = command.split(' ');
    
    this.serverProcess = spawn(cmd, args, {
      cwd,
      shell: true,
      env: { ...process.env, PORT: this.port.toString() }
    });

    this.serverProcess.stdout?.on('data', (data) => {
      const msg = data.toString();
      this.emit('stdout', msg);
      if (msg.includes('ready') || msg.includes('Local:') || msg.includes('started')) {
        this.isReady = true;
        this.emit('ready');
      }
    });

    this.serverProcess.stderr?.on('data', (data) => {
      this.emit('stderr', data.toString());
    });

    this.serverProcess.on('close', (code) => {
      this.isReady = false;
      this.emit('close', code);
      this.serverProcess = null;
    });

    // Fallback readiness check
    this.startReadinessCheck();
  }

  private async startReadinessCheck() {
    let attempts = 0;
    while (attempts < 30 && !this.isReady) {
      try {
        const res = await fetch(`http://localhost:${this.port}`);
        if (res.ok) {
          this.isReady = true;
          this.emit('ready');
          break;
        }
      } catch {
        // Ignore
      }
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }
  }

  /**
   * Starts the dev server and resolves once it reports ready (via stdout match
   * or an HTTP poll), or rejects if it doesn't come up within `timeoutMs`.
   */
  async startAndWaitUntilReady(command: string, cwd: string, timeoutMs = 45000): Promise<void> {
    await this.start(command, cwd);
    if (this.isReady) return;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Dev server did not become ready within ${timeoutMs}ms (command: "${command}")`));
      }, timeoutMs);

      const onReady = () => {
        cleanup();
        resolve();
      };
      const onClose = (code: number | null) => {
        cleanup();
        reject(new Error(`Dev server process exited before becoming ready (code ${code})`));
      };
      const cleanup = () => {
        clearTimeout(timer);
        this.off('ready', onReady);
        this.off('close', onClose);
      };

      this.once('ready', onReady);
      this.once('close', onClose);
    });
  }

  async stop(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
      this.isReady = false;
    }
  }
}
