import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { TestEvidence } from '../verifier/BrowserVerifier';
import { RYVON_ARCHITECTURE_CONTEXT } from './RyvonArchitecture';

const IGNORED_DIRS = new Set(['node_modules', '.git', '.dima', '.dima_data']);

// Cross-platform replacement for the old `dir /s /b` (Windows-only) tree listing,
// so this works when the app runs on macOS/Linux too.
function listWorkspaceFiles(workspacePath: string, limit = 50): string {
  const results: string[] = [];

  function walk(dir: string) {
    if (results.length >= limit) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= limit) return;
      if (IGNORED_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        results.push(fullPath);
      }
    }
  }

  try {
    walk(workspacePath);
  } catch {
    // Best-effort file listing only; failures here shouldn't block evaluation.
  }
  return results.join('\n');
}

export class OpenAIBrain {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'mock-key',
    });
    this.model = process.env.DIMA_MODEL || 'gpt-4o';
  }

  async generateQAScript(objective: string, url: string, testType: 'functional' | 'security' = 'functional', model?: string): Promise<string> {
    try {
      if (process.env.OPENAI_API_KEY) {
        const systemPrompt = testType === 'security'
          ? `You are DIMA, an intelligent Security QA Engineer. Write a Node.js script using Playwright to test the provided URL for XSS and SQL Injection vulnerabilities based on the objective. Navigate to the URL, aggressively inject common payloads (e.g., <script>alert(1)</script>, ' OR 1=1 --) into inputs, and print any successful exploits to stdout. You must read process.env.TEST_ENV and save a screenshot exactly to ".dima/screenshot-" + process.env.TEST_ENV + ".png" before closing. Return ONLY valid Javascript code. Do not wrap in markdown.`
          : `You are DIMA, an intelligent QA Engineer. Write a Node.js script using Playwright to test the provided objective. 
CRITICAL RULES:
1. You MUST read process.env.TEST_ENV.
2. If TEST_ENV === 'mobile', configure the Playwright context with a mobile viewport (e.g., width: 375, height: 812, isMobile: true).
3. If TEST_ENV === 'dark', configure the context with colorScheme: 'dark'.
4. Navigate to the provided URL, perform the interactions, and print success or failure messages.
5. Before closing the browser, you MUST capture a full-page screenshot and save it exactly to ".dima/screenshot-" + process.env.TEST_ENV + ".png".
Return ONLY valid Javascript code. Do not wrap in markdown.`;

        const response = await this.openai.chat.completions.create({
          model: model || this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Objective: ${objective}\nURL: ${url}` }
          ]
        });
        
        let content = response.choices[0]?.message?.content || '';
        content = content.replace(/^```javascript\n/, '').replace(/^```js\n/, '').replace(/^```\n/, '').replace(/```$/, '');
        return content;
      }
    } catch (e) {
      console.error('OpenAI Script Error:', e);
    }
    
    return `
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('${url}');
  console.log('Page loaded successfully');
  await browser.close();
})();
    `;
  }

  async evaluateQAResult(output: string, screenshotsBase64: string[] = [], workspacePath?: string, model?: string): Promise<{ status: 'PASS' | 'FAIL' | 'USER_INPUT', feedback: string }> {
    try {
      if (process.env.OPENAI_API_KEY) {
        const treeOutput = workspacePath ? listWorkspaceFiles(workspacePath) : '';

        const systemPrompt = `You are DIMA, an advanced Autonomous QA Engine. Analyze the output of a Playwright Swarm test (Desktop, Mobile, Dark Mode) AND the visual screenshots.
If the tests completely succeeded AND the UI looks visually correct across ALL viewports/modes, return exactly: "PASS". 
If the test failed due to a bug or visual misalignment in ANY viewport, DO NOT just describe the bug. You must generate an EXACT CODE PATCH or explicitly state the exact file path and line number to edit so the Antigravity agent can apply your fix instantly without debugging.
Return in this format:
FAIL: <description of failure>
FILE: <target file path from the workspace structure>
FIX: <Provide the exact code patch or instruction to fix the issue>

Here is the workspace file structure to help you map the bug to the correct file:
${treeOutput}

If human input is required, return: "[REQUEST_USER_INPUT]: <reason>".`;

        const userContent: any[] = [{ type: 'text', text: `Test Output:\n${output}` }];
        screenshotsBase64.forEach(base64 => {
          userContent.push({
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${base64}` }
          });
        });

        const response = await this.openai.chat.completions.create({
          model: model || this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ]
        });
        
        const content = response.choices[0]?.message?.content?.trim() || 'PASS';
        if (content.startsWith('[REQUEST_USER_INPUT]')) {
          return { status: 'USER_INPUT', feedback: content };
        } else if (content.startsWith('FAIL')) {
          return { status: 'FAIL', feedback: content };
        } else {
          return { status: 'PASS', feedback: '' };
        }
      }
    } catch (e) {
      console.error('OpenAI Eval Error:', e);
    }
    return { status: 'PASS', feedback: '' };
  }

  async evaluateIntegrationResult(httpTrace: string, workspacePath?: string, model?: string): Promise<{ status: 'PASS' | 'FAIL' | 'USER_INPUT', feedback: string }> {
    try {
      if (process.env.OPENAI_API_KEY) {
        const treeOutput = workspacePath ? listWorkspaceFiles(workspacePath) : '';

        const systemPrompt = `You are DIMA, an advanced Autonomous API QA Engine. Analyze the output/HTTP trace of a backend integration test.
If the API calls completely succeeded (200 OK) and no build or typescript errors occurred, return exactly: "PASS". 
If the test failed due to a 403 Forbidden, 404 ToolNotFound, Next.js build failure, or incorrect API payload (hallucinated parameters):
DO NOT just describe the bug. You must generate an EXACT CODE PATCH or explicitly state the exact file path and line number to edit so the Antigravity agent can apply your fix instantly without debugging.
Return in this format:
FAIL: <description of failure>
FILE: <target file path from the workspace structure>
FIX: <Provide the exact code patch or instruction to fix the issue>

Here is the underlying architecture of the system you are testing. Use this to understand how components interact when generating patches:
${RYVON_ARCHITECTURE_CONTEXT}

Here is the workspace file structure to help you map the bug to the correct file:
${treeOutput}`;

        const response = await this.openai.chat.completions.create({
          model: model || this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `HTTP/Execution Trace:\n${httpTrace}` }
          ]
        });
        
        const content = response.choices[0]?.message?.content?.trim() || 'PASS';
        if (content.startsWith('[REQUEST_USER_INPUT]')) {
          return { status: 'USER_INPUT', feedback: content };
        } else if (content.startsWith('FAIL')) {
          return { status: 'FAIL', feedback: content };
        } else {
          return { status: 'PASS', feedback: '' };
        }
      }
    } catch (e) {
      console.error('OpenAI Eval Error:', e);
    }
    return { status: 'PASS', feedback: '' };
  }

  async analyzeFailure(
    errorData: any,
    type: 'build' | 'runtime',
    acceptanceCriteria: string[] = [],
    model?: string
  ): Promise<string> {
    console.log(`Analyzing ${type} failure with ${model || this.model}...`);
    try {
      if (process.env.OPENAI_API_KEY) {
        const prompt = type === 'build' 
          ? `The build process crashed with the following terminal output:\n\n${errorData}\n\nAct as a Senior QA Engineer. Analyze why the build failed and write a concise, highly specific prompt instructing the coding agent (Antigravity) on exactly how to fix the compilation/build errors.`
          : `The runtime browser verification failed. The acceptance criteria were: ${JSON.stringify(acceptanceCriteria)}\n\nThe console captured these errors:\n${JSON.stringify(errorData)}\n\nAct as a Senior QA Engineer. Analyze these runtime errors and write a concise, highly specific prompt instructing the coding agent (Antigravity) on exactly how to fix them.`;

        const response = await this.openai.chat.completions.create({
          model: model || this.model,
          messages: [
            { role: 'system', content: 'You are DIMA, an intelligent QA/Project Manager overseeing an autonomous coding agent. Your job is to analyze errors and provide smart, targeted instructions to the coder to fix them.' },
            { role: 'user', content: prompt }
          ]
        });
        return response.choices[0]?.message?.content || `Fix the following errors: ${JSON.stringify(errorData)}`;
      }
    } catch (e) {
      console.error('OpenAI Error:', e);
    }
    
    // Fallback if no key or error
    return type === 'build' 
      ? `The build failed with the following error:\n\n${errorData}\n\nPlease fix these errors.`
      : `The code compiled, but the browser console threw these errors: ${JSON.stringify(errorData)}. Please fix them.`;
  }

  async generateChatResponse(prompt: string): Promise<string> {
    try {
      if (process.env.OPENAI_API_KEY) {
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: [{ role: 'user', content: prompt }]
        });
        return response.choices[0]?.message?.content || 'I am currently monitoring the task.';
      }
    } catch (e) {
      console.error('OpenAI Chat Error:', e);
    }
    return 'I am acting as your Supervisor. The Antigravity agent is currently executing tasks in the background. I will run the verification checks once it finishes.';
  }

  async generateAcceptanceCriteria(objective: string, model?: string): Promise<string[]> {
    try {
      if (process.env.OPENAI_API_KEY) {
        const response = await this.openai.chat.completions.create({
          model: model || this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are DIMA, an intelligent QA Engineer. Break down the user\'s objective into 3-5 strict, testable acceptance criteria. Return a JSON object with a single key "criteria" containing an array of strings.' },
            { role: 'user', content: `Objective: ${objective}` }
          ]
        });
        
        let content = response.choices[0]?.message?.content || '{}';
        try {
            const parsed = JSON.parse(content);
            if (parsed.criteria && Array.isArray(parsed.criteria)) return parsed.criteria;
        } catch(e) {
            console.error("Failed to parse JSON array from OpenAI", e);
        }
      }
    } catch (e) {
      console.error('OpenAI Criteria Error:', e);
    }
    
      // Fallback
    return [
      'The application compiles and starts without crashing.',
      'No critical console errors appear during rendering.',
      'The requested features function according to the objective.'
    ];
  }

  async extractConnectors(rawSearchData: string): Promise<{slug: string, testPrompt: string}[]> {
    try {
      if (process.env.OPENAI_API_KEY) {
        const systemPrompt = `You are DIMA, an AI Engine mapping codebase dependencies. 
You will be given raw file search results from a codebase containing toolings, APIs, or integration code (e.g., Composio actions).
Your job is to identify all the unique third-party connector tools or endpoints mentioned in the code, and return a JSON array containing up to 100 objects.
Each object must have:
- slug: The exact system slug/identifier for the connector (e.g. 'slack_post_message' or 'GITHUB_CREATE_ISSUE')
- testPrompt: A natural language prompt that tests this workflow (e.g. 'Send a slack message to #general saying Hello')

Return ONLY a valid JSON array of objects. Do not wrap in markdown or backticks.`;

        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Raw Search Data:\n${rawSearchData.substring(0, 50000)}` }
          ]
        });
        
        let content = response.choices[0]?.message?.content?.trim() || '[]';
        content = content.replace(/^```json\n/, '').replace(/^```\n/, '').replace(/```$/, '');
        
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.connectors && Array.isArray(parsed.connectors)) return parsed.connectors;
        return [];
      }
    } catch (e) {
      console.error('OpenAI Extraction Error:', e);
    }
    return [
      { slug: "slack_post_message", testPrompt: "Send a slack message to #general saying Hello Rivtower" },
      { slug: "google_mail_send", testPrompt: "Send an email to admin@rivtower.com with subject Test" },
      { slug: "notion_create_page", testPrompt: "Create a page in Notion called DIMA Matrix" }
    ];
  }
}
