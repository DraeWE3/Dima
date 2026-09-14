import { chromium } from 'playwright';
import { randomUUID } from 'crypto';
import { loginToRyvon } from './ryvonAuth';

export interface FuzzEvidence {
  status: 'passed' | 'failed';
  totalPassed: number;
  totalFailed: number;
  errors: string[];
}

const CONNECTOR_PROMPTS = [
  "Check my latest emails for any project updates. Take the summary and draft it into a new Google Doc.",
  "Schedule a Google Calendar meeting for tomorrow at 3 PM to discuss the project, and create a Google Sheet to track the action items.",
  "Send a message to my Slack general channel saying 'Hello team', then create a Notion page with the same greeting.",
  "Scrape the front page of ycombinator.com, extract the top 3 headlines, and email them to me.",
  "Find the latest file in my Google Drive, read its contents, and summarize it in a new Discord message.",
  "Check my HubSpot CRM for the latest contact, then draft a welcome email for them.",
  "Create a new GitHub repository called 'ryvon-fuzz-test', add a README.md file, and push it.",
  "Read the weather for San Francisco, then schedule a calendar event called 'Sunny Walk' if it's clear.",
  "Find my next upcoming calendar event, and send a Slack DM to the participants reminding them.",
  "Create a Google Sheet, add headers 'Name' and 'Email', and populate it with two dummy rows."
];

export class IntegrationFuzzVerifier {
  private appUrl: string;

  constructor(appUrl: string = 'http://localhost:3000') {
    this.appUrl = appUrl.replace(/\/$/, '');
  }

  public async runFuzzTest(iterations: number = 1000): Promise<FuzzEvidence> {
    console.log(`Starting Fuzz Test with ${iterations} iterations...`);
    const errors: string[] = [];
    let totalPassed = 0;
    let totalFailed = 0;

    // 1. Login via Playwright to extract auth cookies
    console.log(`Launching headless browser to extract Auth Session...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${this.appUrl}/login`, { waitUntil: 'networkidle' });
    await page.evaluate(() => { localStorage.setItem('ryvon_unlocked', 'true'); });
    await page.reload({ waitUntil: 'networkidle' });

    // Selector-resilient shared login (see ryvonAuth.ts).
    await loginToRyvon(page, this.appUrl, (line) => console.log(line));
    console.log(`Login successful. Extracting cookies...`);

    const cookies = await context.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    await browser.close();

    if (!cookieString.includes('auth')) {
       throw new Error('Failed to extract authentication cookie.');
    }

    console.log(`Auth cookie extracted. Beginning API Fuzz Loop...`);

    // 2. Run the Fuzz Loop against the API directly
    for (let i = 1; i <= iterations; i++) {
      const promptText = CONNECTOR_PROMPTS[Math.floor(Math.random() * CONNECTOR_PROMPTS.length)];
      const chatId = randomUUID();
      const messageId = randomUUID();

      const payload = {
        id: chatId,
        message: {
          id: messageId,
          role: "user",
          content: promptText,
          parts: [{ type: "text", text: promptText }]
        },
        selectedChatModel: "chat-model",
        selectedVisibilityType: "private"
      };

      try {
        const response = await fetch(`${this.appUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieString
          },
          body: JSON.stringify(payload)
        });

        if (response.status === 429) {
          console.warn(`[Iteration ${i}] Rate limit hit (429). Sleeping for 10 seconds...`);
          await new Promise(r => setTimeout(r, 10000));
          i--; // Retry this iteration
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        // Read the SSE stream to ensure it doesn't crash mid-stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No stream in response body.');

        let fullStream = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          fullStream += chunk;
        }

        // Check for specific SDK error streams
        if (fullStream.includes('"type":"error"') || fullStream.includes('ChatSDKError')) {
           throw new Error(`Stream contained an error payload: ${fullStream}`);
        }

        totalPassed++;
        console.log(`Progress: ${i}/${iterations} | Passed: ${totalPassed} | Failed: ${totalFailed}`);

        // Throttle slightly to prevent completely overwhelming the local CPU / Node event loop
        await new Promise(r => setTimeout(r, 100));

      } catch (err: any) {
        totalFailed++;
        const errMsg = `[Iteration ${i}] Failed: ${err.message}`;
        console.error(errMsg);
        errors.push(errMsg);
        
        // If we get too many failures in a row, we might want to halt, but user said "Keep looping until you're done".
        // Wait briefly on error to prevent runaway error loops
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log(`\n=== Fuzz Testing Complete ===`);
    console.log(`Total Passed: ${totalPassed}`);
    console.log(`Total Failed: ${totalFailed}`);

    return {
      status: totalFailed > 0 ? 'failed' : 'passed',
      totalPassed,
      totalFailed,
      errors
    };
  }
}
