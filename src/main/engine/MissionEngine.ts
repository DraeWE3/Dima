import fs from 'fs';
import path from 'path';
import { db } from '../database/db';
import { NativeAgentAdapter } from '../antigravity/NativeAgentAdapter';
import { DevServerManager } from '../verifier/DevServerManager';
import { BrowserVerifier } from '../verifier/BrowserVerifier';
import { OpenAIBrain } from './OpenAIBrain';
import { log } from '../utils/logger';

// Figures out how to boot the target workspace's dev server. Looks for a "dev"
// script in package.json (the overwhelming convention for JS/TS projects);
// falls back to a generic guess if none is found.
function resolveDevCommand(workspacePath: string): string {
  try {
    const pkgPath = path.join(workspacePath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts?.dev) return 'npm run dev';
      if (pkg.scripts?.start) return 'npm run start';
    }
  } catch (e) {
    log.warn(`Failed to inspect package.json in ${workspacePath}`, e);
  }
  return 'npm run dev';
}

export class MissionEngine {
  private devServer: DevServerManager;
  private browserVerifier: BrowserVerifier;
  private openai: OpenAIBrain;
  public adapter: NativeAgentAdapter;

  constructor(openai: OpenAIBrain) {
    this.devServer = new DevServerManager();
    this.browserVerifier = new BrowserVerifier();
    this.openai = openai;
    this.adapter = new NativeAgentAdapter();
  }

  async runMissionLoop(
    missionId: string, 
    workspacePath: string, 
    initialPrompt: string, 
    criteria: string[],
    model: string,
    isResuming = false
  ) {
    let isComplete = false;
    let attempts = 0;
    let currentPrompt = initialPrompt;

    while (!isComplete) {
      db.addLog(missionId, { role: 'system', content: `[DIMA] Loop Attempt ${attempts + 1}`, timestamp: Date.now() });
      
      // Phase 1: Run Antigravity Agent
      if (attempts === 0 && !isResuming) {
        await this.adapter.startTask({ missionId, workspacePath, prompt: currentPrompt, model });
      } else {
        await this.adapter.sendInstruction(missionId, currentPrompt);
      }
      isResuming = false; // Reset this flag after first pass

      let agentStatus = await this.adapter.getStatus(missionId);
      while (agentStatus.state !== 'COMPLETED' && agentStatus.state !== 'FAILED' && agentStatus.state !== 'INTERRUPTED') {
        await new Promise(r => setTimeout(r, 2000));
        agentStatus = await this.adapter.getStatus(missionId);
      }

      if (agentStatus.state === 'INTERRUPTED') {
        db.addLog(missionId, { role: 'system', content: `[DIMA] Mission interrupted by user. Stopping loop.`, timestamp: Date.now() });
        return;
      }

      if (agentStatus.state === 'FAILED') {
        db.addLog(missionId, { role: 'system', content: `[DIMA] Agent encountered a fatal error. Aborting loop.`, timestamp: Date.now() });
        break;
      }

      // Phase 2: Build & Verify
      db.addLog(missionId, { role: 'system', content: `[DIMA] Starting Dev Server...`, timestamp: Date.now() });
      try {
        const devCommand = resolveDevCommand(workspacePath);
        await this.devServer.startAndWaitUntilReady(devCommand, workspacePath);
        db.addLog(missionId, { role: 'system', content: `[DIMA] Dev Server Ready! Brain is writing a dynamic QA Playwright test...`, timestamp: Date.now() });

        const qaScript = await this.openai.generateQAScript(initialPrompt, `http://localhost:${this.devServer.port}`, 'functional', model);

        db.addLog(missionId, { role: 'system', content: `[DIMA] Executing dynamic QA test...`, timestamp: Date.now() });
        const swarmResults = await this.browserVerifier.executeSwarmTest(qaScript, workspacePath);
        const testOutput = swarmResults.map(r => r.output).join('\n');

        db.addLog(missionId, { role: 'system', content: `[DIMA] Brain is evaluating QA test results...`, timestamp: Date.now() });
        const evaluation = await this.openai.evaluateQAResult(testOutput, [], workspacePath, model);

        await this.devServer.stop();

        if (evaluation.status === 'PASS') {
          db.addLog(missionId, { role: 'system', content: `[DIMA] QA test passed! Feature is verified.`, timestamp: Date.now() });
          isComplete = true;
        } else if (evaluation.status === 'USER_INPUT') {
          db.addLog(missionId, { role: 'system', content: `[DIMA] PAUSED FOR USER INPUT:\n${evaluation.feedback}`, timestamp: Date.now() });
          db.updateMissionStatus(missionId, 'IDLE');
          return; // Pause the loop indefinitely until user responds via continueMission
        } else {
          db.addLog(missionId, { role: 'system', content: `[DIMA] QA test failed! Sending feedback back to Antigravity...`, timestamp: Date.now() });
          currentPrompt = `The automated QA test failed with the following output:\n\n${testOutput}\n\nQA Engine Feedback:\n${evaluation.feedback}\n\nPlease investigate and fix the codebase.`;
          attempts++;
          continue;
        }
      } catch (buildError: any) {
        await this.devServer.stop();
        db.addLog(missionId, { role: 'system', content: `[DIMA] Build Failed! DIMA's Brain is analyzing terminal logs...`, timestamp: Date.now() });
        currentPrompt = await this.openai.analyzeFailure(buildError.message, 'build', criteria, model);
        attempts++;
        continue;
      }
    }

    if (isComplete) {
      db.addLog(missionId, { role: 'system', content: `[DIMA] Mission ${missionId} COMPLETED SUCCESSFULLY! All checks passed.`, timestamp: Date.now() });
      db.updateMissionStatus(missionId, 'COMPLETED');
    }
  }
}
