import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { db } from './database/db'
import { DimaEngine } from './engine/DimaEngine'
import { exec } from 'child_process'
import util from 'util'
import { log, installGlobalErrorHandlers } from './utils/logger'

installGlobalErrorHandlers('main')

const execPromise = util.promisify(exec)
const dima = new DimaEngine()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
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
    return db.getMissions()
  })

  ipcMain.handle('get-mission', (_, id) => {
    return db.getMission(id)
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
