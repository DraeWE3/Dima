import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { db } from './database/db'
import { DimaEngine } from './engine/DimaEngine'
import { exec } from 'child_process'
import util from 'util'
import { log, installGlobalErrorHandlers } from './utils/logger'
import { mcpClientManager } from './mcp/McpClientManager'
import { initAppConfig, getAppConfigForUI, setApiKey, setModelConfig } from './config/AppConfig'

installGlobalErrorHandlers('main')
initAppConfig()
db.reconcileOrphanedMissions()

const execPromise = util.promisify(exec)
const dima = new DimaEngine()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('get-missions', () => {
    // Summary only (no per-mission logs) - the full history is 7500+ missions
    // and several MB on disk; shipping that whole to the renderer every poll
    // is what was making the UI feel slow/stale.
    return db.getMissionsSummary()
  })

  ipcMain.handle('get-mission', (_, id) => {
    return db.getMission(id)
  })

  ipcMain.handle('get-mission-stats', () => {
    return db.getStats()
  })

  ipcMain.handle('select-files', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (!canceled) {
      return filePaths[0];
    }
    return null;
  });

  ipcMain.handle('get-screenshot', (_, filename) => {
    try {
      const os = require('os');
      const fs = require('fs');
      const path = require('path');
      if (typeof filename !== 'string' || !filename) return null;
      // Reject path separators / traversal so this can only ever read from the screenshots dir
      const safeName = path.basename(filename);
      if (safeName !== filename) return null;
      const screenshotsDir = join(os.homedir(), '.dima_data', 'screenshots');
      const filepath = path.join(screenshotsDir, safeName);
      if (fs.existsSync(filepath)) {
        const buffer = fs.readFileSync(filepath);
        return `data:image/png;base64,${buffer.toString('base64')}`;
      }
      return null;
    } catch (e) {
      log.error('get-screenshot failed', e);
      return null;
    }
  });

  ipcMain.on('start-mission', (_, mission) => {
    db.createMission(mission)
    dima.startMission(mission.id, mission.workspacePath, mission.prompt, mission.model)
  })

  ipcMain.on('continue-mission', (_, data) => {
    dima.continueMission(data.id, data.prompt, data.model)
  })
  
  ipcMain.on('interrupt-mission', (_, id) => {
    dima.interruptMission(id)
  })

  ipcMain.handle('undo-mission-step', async (_, data) => {
    try {
      const mission = db.getMission(data.id);
      if (!mission) throw new Error("Mission not found");
      
      db.addLog(data.id, { role: 'system', content: `[DIMA] Undoing to checkpoint...`, timestamp: Date.now() });
      await execPromise(`git reset --hard HEAD`, { cwd: mission.workspacePath }); // Simplified for safety
      
      db.truncateLogs(data.id, data.timestamp);
      return true;
    } catch (e: any) {
      log.error('undo-mission-step failed', e);
      db.addLog(data.id, { role: 'system', content: `[DIMA] Undo failed: ${e.message}`, timestamp: Date.now() });
      return false;
    }
  })

  ipcMain.handle('get-mcp-servers', () => {
    return mcpClientManager.getStatus()
  })

  ipcMain.handle('add-mcp-server', async (_, data) => {
    try {
      const config = await mcpClientManager.addServer(data.name, data.command, data.args)
      return { ok: true, config }
    } catch (e: any) {
      log.error('add-mcp-server failed', e)
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('remove-mcp-server', async (_, id) => {
    await mcpClientManager.removeServer(id)
    return true
  })

  ipcMain.handle('reconnect-mcp-server', async (_, id) => {
    const ok = await mcpClientManager.reconnectServer(id)
    return { ok }
  })

  ipcMain.handle('get-antigravity-status', () => {
    try {
      const fs = require('fs')
      const os = require('os')
      const path = require('path')
      const p = path.join(os.homedir(), '.dima_data', 'mcp_connection.json')
      if (!fs.existsSync(p)) return { connected: false }
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
      const isFresh = Date.now() - data.updatedAt < 25000
      return { connected: isFresh }
    } catch (e) {
      log.error('get-antigravity-status failed', e)
      return { connected: false }
    }
  })

  ipcMain.handle('get-app-config', () => {
    return getAppConfigForUI()
  })

  ipcMain.handle('set-api-key', (_, apiKey: string) => {
    return setApiKey(apiKey)
  })

  ipcMain.handle('set-model-config', (_, data: { defaultModel: string; models: string[] }) => {
    return setModelConfig(data.defaultModel, data.models)
  })

  ipcMain.handle('get-agent-connect-info', () => {
    const dimaMcpPath = join(__dirname, 'dima-mcp.js')
    // Published as the "dima-mcp" npm package: works on any machine with no
    // path to configure. Falls back to this exact install's local path for
    // anyone testing before the package is published, or running from source.
    const npxConfig = { mcpServers: { dima: { command: 'npx', args: ['-y', 'dima-mcp'] } } }
    const localConfig = { mcpServers: { dima: { command: 'node', args: [dimaMcpPath] } } }
    return {
      configSnippet: JSON.stringify(npxConfig, null, 2),
      localConfigSnippet: JSON.stringify(localConfig, null, 2),
    }
  })

  mcpClientManager.initialize().catch(err => log.error('Failed to initialize MCP client manager', err))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
