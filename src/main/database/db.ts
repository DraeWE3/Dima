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

  getMissions() {
    this.load();
    return this.data.missions;
  }

  getMission(id: string) {
    this.load();
    return this.data.missions.find(m => m.id === id);
  }
}

export const db = new JsonDatabase();
