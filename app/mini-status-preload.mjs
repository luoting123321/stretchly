import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronApi', {
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback)
})
