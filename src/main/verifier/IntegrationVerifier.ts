import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export interface APIEvidence {
  status: 'passed' | 'failed';
  httpTrace: string;
  errorMessage?: string;
}

export class IntegrationVerifier {
  /**
   * Executes a generated Node.js script that tests an API integration or connector.
   * Captures stdout/stderr (which should contain HTTP request/response traces).
   */
  async executeIntegrationTest(scriptContent: string, workspacePath: string, env: Record<string, string> = {}): Promise<APIEvidence> {
    const dimaDir = path.join(workspacePath, '.dima');
    if (!fs.existsSync(dimaDir)) fs.mkdirSync(dimaDir, { recursive: true });
    
    const testFile = path.join(dimaDir, 'api-test.js');
    fs.writeFileSync(testFile, scriptContent);
    
    let output = '';
    let status: 'passed' | 'failed' = 'passed';
    
    try {
      const { stdout, stderr } = await execPromise(`node api-test.js`, { 
        cwd: dimaDir, 
        timeout: 45000,
        env: { ...process.env, ...env }
      });
      output = stdout + '\n' + stderr;
      
      // If the script throws an error manually (e.g. status code 403) but didn't crash Node, we can parse it here
      // But typically, a test script will throw an unhandled exception or process.exit(1) on failure.
    } catch (e: any) {
      status = 'failed';
      output = (e.stdout || '') + '\n' + (e.stderr || '') + '\n' + e.message;
    }

    return { status, httpTrace: output };
  }
}
