import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getMissions: () => ipcRenderer.invoke('get-missions'),
  getMission: (id: string) => ipcRenderer.invoke('get-mission', id),
  getMissionStats: () => ipcRenderer.invoke('get-mission-stats'),
  getScreenshot: (filename: string) => ipcRenderer.invoke('get-screenshot', filename),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  startMission: (mission: any) => ipcRenderer.send('start-mission', mission),
  continueMission: (data: any) => ipcRenderer.send('continue-mission', data),
  interruptMission: (id: string) => ipcRenderer.send('interrupt-mission', id),
  undoMissionStep: (data: any) => ipcRenderer.invoke('undo-mission-step', data),
  getMcpServers: () => ipcRenderer.invoke('get-mcp-servers'),
  addMcpServer: (data: { name: string; command: string; args: string[] }) => ipcRenderer.invoke('add-mcp-server', data),
  removeMcpServer: (id: string) => ipcRenderer.invoke('remove-mcp-server', id),
  reconnectMcpServer: (id: string) => ipcRenderer.invoke('reconnect-mcp-server', id),
  getAntigravityStatus: () => ipcRenderer.invoke('get-antigravity-status'),
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  setApiKey: (apiKey: string) => ipcRenderer.invoke('set-api-key', apiKey),
  setModelConfig: (data: { defaultModel: string; models: string[] }) => ipcRenderer.invoke('set-model-config', data),
  getAgentConnectInfo: () => ipcRenderer.invoke('get-agent-connect-info'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
