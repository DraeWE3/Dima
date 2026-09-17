import os from 'os';
import path from 'path';
import fs from 'fs';

// Use a consistent directory across both Electron (UI) and Node (MCP) processes
const appDataPath = path.join(os.homedir(), '.dima_data');
const dbPath = path.join(appDataPath, 'missions.json');

export interface MissionLog {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  commitHash?: string;
  screenshot?: string; // Add optional screenshot path
}

export interface MissionRecord {
  id: string;
  projectId: string;
  userPrompt: string;
  workspacePath: string;
  status: string;
  date: string;
  logs: MissionLog[];
}

export class JsonDatabase {
  private data: { missions: MissionRecord[] } = { missions: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save(); // create initial file
      }
    } catch (e) {
      console.error("Failed to load db", e);
      this.data = { missions: [] };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(appDataPath)) {
        fs.mkdirSync(appDataPath, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error("Failed to save db", e);
    }
  }

  // Legacy mock method for DimaEngine if any exists
  exec(sql: string) {
    console.log('Mock exec:', sql.slice(0, 50));
  }

  createMission(mission: MissionRecord) {
    this.load();
    this.data.missions.unshift(mission);
    this.save();
  }

  updateMissionStatus(id: string, status: string) {
    this.load();
    const mission = this.data.missions.find(m => m.id === id);
    if (mission) {
      mission.status = status;
      this.save();
    }
  }

  addLog(id: string, log: MissionLog) {
    this.load();
    const mission = this.data.missions.find(m => m.id === id);
    if (mission) {
      mission.logs.push(log);
      this.save();
    }
  }

  truncateLogs(id: string, timestamp: number) {
    this.load();
    const mission = this.data.missions.find(m => m.id === id);
    if (mission) {
      mission.logs = mission.logs.filter(log => log.timestamp <= timestamp);
      this.save();
    }
  }

  /**
   * Missions run entirely in-memory (DimaEngine.activeMissions, the native
   * agent's session map) - if the app is killed or crashes mid-mission,
   * that state is gone but the DB is left saying RUNNING/IN_PROGRESS
   * forever, with nothing left alive to ever finish it. Call this once at
   * startup to mark anything left in that state from a previous process
   * lifetime as ERROR, so it shows up correctly instead of hanging in the
   * UI indefinitely.
   */
  reconcileOrphanedMissions() {
    this.load();
    const ACTIVE = ['RUNNING', 'IN_PROGRESS'];
    let changed = false;
    for (const mission of this.data.missions) {
      if (ACTIVE.includes(mission.status)) {
        mission.status = 'ERROR';
        mission.logs.push({
          role: 'system',
          content: '[DIMA] Mission was still active when the app last closed or restarted, so it could not continue. Send a follow-up message to try again.',
          timestamp: Date.now(),
        });
        changed = true;
      }
    }
    if (changed) this.save();
  }

  getMissions() {
    this.load();
    return this.data.missions;
  }

  /**
   * Lightweight mission list for polling UIs: strips each mission's `logs`
   * array (which can be huge across a long history) down to a `logCount`,
   * and caps how many missions are returned. Without this, every poll ships
   * the full logs of every mission ever run over IPC.
   */
  getMissionsSummary(limit = 200) {
    this.load();
    return this.data.missions.slice(0, limit).map(({ logs, ...rest }) => ({
      ...rest,
      logCount: logs.length,
    }));
  }

  getMission(id: string) {
    this.load();
    return this.data.missions.find(m => m.id === id);
  }

  /**
   * Aggregate counts + a 7-day run-volume chart, computed server-side over the
   * full mission history so totals are correct even though the list views cap
   * how many mission records they return.
   */
  getStats() {
    this.load();
    const missions = this.data.missions;

    const dayKeys: string[] = [];
    const chartByKey = new Map<string, { name: string; runs: number; errors: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      dayKeys.push(key);
      chartByKey.set(key, { name: d.toLocaleDateString('en-US', { weekday: 'short' }), runs: 0, errors: 0 });
    }

    let completed = 0;
    let errored = 0;
    let running = 0;
    let securityAudits = 0;

    for (const m of missions) {
      if (m.status === 'COMPLETED') completed++;
      else if (m.status === 'ERROR') errored++;
      else if (m.status === 'RUNNING') running++;
      if (m.userPrompt?.includes('Security')) securityAudits++;

      const d = new Date(m.date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const bucket = chartByKey.get(key);
      if (bucket) {
        bucket.runs++;
        if (m.status === 'ERROR') bucket.errors++;
      }
    }

    const finished = completed + errored;
    return {
      totalRuns: missions.length,
      successRate: finished > 0 ? Math.round((completed / finished) * 100) : 0,
      activeWorkflows: running,
      issuesDetected: errored,
      securityAudits,
      chartData: dayKeys.map(key => chartByKey.get(key)!),
    };
  }
}

export const db = new JsonDatabase();
