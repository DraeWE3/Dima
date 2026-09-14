import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getMissions: () => ipcRenderer.invoke('get-missions'),
  getMission: (id: string) => ipcRenderer.invoke('get-mission', id),
  getScreenshot: (filename: string) => ipcRenderer.invoke('get-screenshot', filename),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  startMission: (mission: any) => ipcRenderer.send('start-mission', mission),
  continueMission: (data: any) => ipcRenderer.send('continue-mission', data),
  interruptMission: (id: string) => ipcRenderer.send('interrupt-mission', id),
  undoMissionStep: (data: any) => ipcRenderer.invoke('undo-mission-step', data),
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
