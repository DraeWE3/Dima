import { db } from '../database/db';
import { MissionEngine } from './MissionEngine';
import { OpenAIBrain } from './OpenAIBrain';

export class DimaEngine {
  private activeMissions: Map<string, MissionEngine> = new Map();
  private openai: OpenAIBrain;

  constructor() {
    this.openai = new OpenAIBrain();
  }

  async startMission(missionId: string, workspacePath: string, prompt: string, model: string) {
    db.updateMissionStatus(missionId, 'IN_PROGRESS');
    db.addLog(missionId, { role: 'system', content: `[DIMA] Analyzing objective with ${process.env.DIMA_MODEL || 'GPT-4o'}...`, timestamp: Date.now() });
    
    try {
      const criteria = await this.openai.generateAcceptanceCriteria(prompt);
      db.addLog(missionId, { role: 'system', content: `[DIMA] Acceptance Criteria established:\n- ${criteria.join('\n- ')}`, timestamp: Date.now() });

      const missionEngine = new MissionEngine(this.openai);
      this.activeMissions.set(missionId, missionEngine);

      missionEngine.runMissionLoop(missionId, workspacePath, prompt, criteria, model).catch(console.error);

    } catch (error: any) {
      db.addLog(missionId, { role: 'system', content: `[DIMA] Critical Error: ${error.message}`, timestamp: Date.now() });
      db.updateMissionStatus(missionId, 'ERROR');
    }
  }

  async continueMission(missionId: string, finalPrompt: string, model: string) {
    db.addLog(missionId, { role: 'user', content: finalPrompt, timestamp: Date.now() });
    db.updateMissionStatus(missionId, 'IN_PROGRESS');

    const mission = db.getMission(missionId);
    if (!mission) return;

    let missionEngine = this.activeMissions.get(missionId);
    if (!missionEngine) {
      missionEngine = new MissionEngine(this.openai);
      this.activeMissions.set(missionId, missionEngine);
    }
    
    // Restart loop since it was idle, flag as resuming
    const criteria = await this.openai.generateAcceptanceCriteria(finalPrompt);
    missionEngine.runMissionLoop(missionId, mission.workspacePath, finalPrompt, criteria, model, true).catch(console.error);
  }

  interruptMission(missionId: string) {
    db.updateMissionStatus(missionId, 'IDLE');
    db.addLog(missionId, { role: 'system', content: `[DIMA] Mission Interrupted by User.`, timestamp: Date.now() });
  }
}
