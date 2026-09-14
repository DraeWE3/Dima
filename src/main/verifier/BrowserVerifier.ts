import { chromium, Browser, Page, BrowserContext } from 'playwright';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export interface TestEvidence {
  status: 'passed' | 'failed';
  consoleLogs: string[];
  networkErrors: string[];
  screenshots: string[];
}

export class BrowserVerifier {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch();
      this.context = await this.browser.newContext();
    }
  }

  async verifyPage(url: string, assertions: string[]): Promise<TestEvidence> {
    await this.initialize();
    const page = await this.context!.newPage();
    
    const evidence: TestEvidence = {
      status: 'passed',
      consoleLogs: [],
      networkErrors: [],
      screenshots: []
    };

    page.on('console', msg => {
      const text = msg.text();
      // Look for standard console errors or React Hydration warnings
      if (msg.type() === 'error' || text.includes('Hydration') || text.includes('Minified React error')) {
        evidence.consoleLogs.push(`[UI GLITCH DETECTED] ${text}`);
        evidence.status = 'failed';
      }
    });

    page.on('pageerror', error => {
      evidence.consoleLogs.push(`[UNHANDLED EXCEPTION] ${error.message}`);
      evidence.status = 'failed';
    });

    page.on('response', res => {
      if (res.status() >= 400) {
        evidence.networkErrors.push(`${res.status()} - ${res.url()}`);
      }
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      // Example visual capture
      const screenshotPath = `screenshot-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath });
      evidence.screenshots.push(screenshotPath);
    } catch (e: any) {
      evidence.status = 'failed';
      evidence.consoleLogs.push(`Navigation failed: ${e.message}`);
    } finally {
      await page.close();
    }

    return evidence;
  }

  async executeSwarmTest(scriptContent: string, workspacePath: string): Promise<Array<{ env: string, output: string, screenshotBase64?: string }>> {
    const dimaDir = path.join(workspacePath, '.dima');
    if (!fs.existsSync(dimaDir)) fs.mkdirSync(dimaDir, { recursive: true });
    
    const testFile = path.join(dimaDir, 'qa-test.js');
    fs.writeFileSync(testFile, scriptContent);
    
    const envs = ['desktop', 'mobile', 'dark'];
    
    const runEnv = async (env: string) => {
      const screenshotFile = path.join(dimaDir, `screenshot-${env}.png`);
      if (fs.existsSync(screenshotFile)) fs.unlinkSync(screenshotFile);
      
      let output = `[${env.toUpperCase()} ENVIRONMENT]\n`;
      try {
        const { stdout, stderr } = await execPromise(`node qa-test.js`, { 
          cwd: dimaDir, 
          timeout: 45000,
          env: { ...process.env, TEST_ENV: env } 
        });
        output += stdout + '\n' + stderr;
      } catch (e: any) {
        output += (e.stdout || '') + '\n' + (e.stderr || '') + '\n' + e.message;
      }

      let screenshotBase64;
      if (fs.existsSync(screenshotFile)) {
         const buffer = fs.readFileSync(screenshotFile);
         screenshotBase64 = buffer.toString('base64');
      }
      return { env, output, screenshotBase64 };
    };

    const results = await Promise.all(envs.map(runEnv));
    return results;
  }

  async close() {
    await this.browser?.close();
    this.browser = null;
  }
}
