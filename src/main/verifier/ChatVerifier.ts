import { chromium, Browser, Page } from 'playwright';
import { loginToRyvon } from './ryvonAuth';

export interface ChatEvidence {
  status: 'passed' | 'failed';
  errorMessage?: string;
  uiTrace?: string;
}

export class ChatVerifier {
  private appUrl: string;

  constructor(appUrl: string = 'http://localhost:3000') {
    this.appUrl = appUrl.replace(/\/$/, '');
  }

  public async testChatAgent(): Promise<ChatEvidence> {
    let browser: Browser | null = null;
    let page: Page | null = null;
    const uiTrace: string[] = [];

    try {
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage();
      
      page.on('console', msg => uiTrace.push(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
      page.on('pageerror', error => uiTrace.push(`[BROWSER EXCEPTION] Unhandled exception: ${error.message}`));

      uiTrace.push(`Navigating to ${this.appUrl}/login to authenticate`);
      await page.goto(`${this.appUrl}/login`, { waitUntil: 'networkidle', timeout: 120000 });

      uiTrace.push(`Bypassing Coming Soon Overlay via localStorage...`);
      await page.evaluate(() => { localStorage.setItem('ryvon_unlocked', 'true'); });
      await page.reload({ waitUntil: 'networkidle' });

      // Selector-resilient shared login (see ryvonAuth.ts).
      await loginToRyvon(page, this.appUrl, (line) => uiTrace.push(line));

      uiTrace.push(`Navigating to ${this.appUrl}/`);
      await page.goto(`${this.appUrl}/`, { waitUntil: 'networkidle', timeout: 60000 });

      uiTrace.push(`Waiting for Chat UI to render...`);
      
      const chatInput = page.locator('textarea, input[type="text"]').first();
      await chatInput.waitFor({ state: 'visible', timeout: 30000 });
      
      uiTrace.push(`Sending a test message to the Chat Agent...`);
      await chatInput.fill('Hello, please respond with a short confirmation message.');
      
      await chatInput.press('Enter');
      
      uiTrace.push(`Waiting for AI response...`);
      await page.waitForTimeout(15000); 

      const hasGlitch = uiTrace.some(log => log.includes('Minified React error') || log.includes('Hydration failed') || log.includes('Application error'));
      if (hasGlitch) {
        throw new Error('React Hydration Error or fatal UI Glitch detected in Chat Canvas.');
      }

      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('An error occurred') || bodyText.includes('Application error')) {
         throw new Error('React Error Boundary was triggered or an application error occurred.');
      }

      await browser.close();
      return { status: 'passed', uiTrace: uiTrace.join('\n') };

    } catch (error: any) {
      if (browser) await browser.close();
      return {
        status: 'failed',
        errorMessage: error.message,
        uiTrace: uiTrace.join('\n') + `\n[FATAL ERROR] ${error.message}`
      };
    }
  }
}
