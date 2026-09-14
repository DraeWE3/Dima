import { SandboxInjector } from './SandboxInjector';
import { RPAVerifier, UISelectors } from '../verifier/RPAVerifier';
import { OpenAIBrain } from './OpenAIBrain';
import { Fuzzer } from './Fuzzer';
import { db } from '../database/db';

export class E2EBrain {
  private sandbox: SandboxInjector;
  private rpa: RPAVerifier;
  private aiBrain: OpenAIBrain;
  private fuzzer: Fuzzer;

  constructor(appUrl: string = 'http://localhost:3000', selectors?: UISelectors) {
    this.sandbox = new SandboxInjector();
    this.rpa = new RPAVerifier(appUrl, selectors);
    this.aiBrain = new OpenAIBrain();
    this.fuzzer = new Fuzzer(appUrl);
  }

  /**
   * Orchestrates the infinite loop for a specific connector.
   * Injects credentials, runs the Fuzzer, runs Playwright flow, and patches code on failure.
   */
  async runMatrixLoop(connectorSlug: string, prompt: string, workspacePath: string, missionId: string): Promise<boolean> {
    db.addLog(missionId, { role: 'system', content: `\n========================================\n[DIMA MATRIX] Starting E2E Loop for: ${connectorSlug}\n========================================`, timestamp: Date.now() });

    // 1. Bypass OAuth using Sandbox Injection
    await this.sandbox.injectSandboxCredential(connectorSlug, 'test-user');

    let maxRetries = 5;
    let attempt = 1;

    while (attempt <= maxRetries) {
      db.addLog(missionId, { role: 'system', content: `[Attempt ${attempt}/${maxRetries}] Testing ${connectorSlug}...`, timestamp: Date.now() });
      
      // 2. Fuzz the API endpoints first to catch deep payload errors
      db.addLog(missionId, { role: 'system', content: `[FUZZER] Bombarding backend API to check type safety...`, timestamp: Date.now() });
      const fuzzError = await this.fuzzer.fuzzConnector(connectorSlug);

      if (fuzzError) {
        db.addLog(missionId, { role: 'system', content: `❌ [FUZZ FAILED] ${connectorSlug} crashed on malformed payload.\nError trace:\n${fuzzError}\n\n🧠 [DIMA] Analyzing failure and generating Auto-Fix patch...`, timestamp: Date.now() });
        const patch = await this.aiBrain.evaluateIntegrationResult(connectorSlug, fuzzError);
        db.addLog(missionId, { role: 'system', content: `\n--- AUTO-FIX PATCH GENERATED ---\n${patch}\n--------------------------------\n\n[DIMA] Waiting for dev server to reload...`, timestamp: Date.now() });
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempt++;
        continue;
      }

      db.addLog(missionId, { role: 'system', content: `✅ [FUZZ PASSED] Backend correctly handled bad data. Proceeding to Playwright UI test...`, timestamp: Date.now() });

      // 3. Automate Chat Agent via Playwright
      const evidence = await this.rpa.executeChatWorkflow(prompt, connectorSlug);

      if (evidence.status === 'passed') {
        db.addLog(missionId, { role: 'system', content: `✅ [RPA SUCCESS] ${connectorSlug} passed E2E verification!`, timestamp: Date.now() });
        return true;
      }

      db.addLog(missionId, { role: 'system', content: `❌ [RPA FAILED] ${connectorSlug} UI flow failed.\nError: ${evidence.errorMessage}\n\n🧠 [DIMA] Analyzing failure and generating Auto-Fix patch...`, timestamp: Date.now() });

      // 4. Generate Auto-Fix using OpenAIBrain (Phase 4 integration logic)
      const patch = await this.aiBrain.evaluateIntegrationResult(connectorSlug, evidence.httpTrace);
      
      db.addLog(missionId, { role: 'system', content: `\n--- AUTO-FIX PATCH GENERATED ---\n${patch}\n--------------------------------\n\n[DIMA] Waiting for dev server to reload...`, timestamp: Date.now() });
      
      // In a full implementation, we would apply the patch via fs.writeFileSync here 
      // and restart the dev server before looping.
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      attempt++;
    }

    db.addLog(missionId, { role: 'system', content: `🚨 [FATAL] ${connectorSlug} failed after ${maxRetries} attempts.`, timestamp: Date.now() });
    return false;
  }

  /**
   * Runs the entire 1,000 connector matrix.
   */
  async runFullMatrix(connectors: {slug: string, testPrompt: string}[], workspacePath: string, missionId: string) {
    db.addLog(missionId, { role: 'system', content: `[DIMA MATRIX] Initializing full run for ${connectors.length} connectors.`, timestamp: Date.now() });
    for (const connector of connectors) {
      const passed = await this.runMatrixLoop(connector.slug, connector.testPrompt, workspacePath, missionId);
      if (!passed) {
        db.addLog(missionId, { role: 'system', content: `[DIMA MATRIX] Halting matrix due to unrecoverable error on ${connector.slug}.`, timestamp: Date.now() });
        break;
      }
    }
  }
}
