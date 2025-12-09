import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronApi', {
  // Get today's tasks for reference
  getTasks: () => ipcRenderer.invoke('get-tasks'),

  // Save work log
  addLog: (log) => ipcRenderer.invoke('add-log', log),

  // Close window
  closeWindow: () => ipcRenderer.send('work-log-close'),
  skipLog: () => ipcRenderer.send('work-log-skip')
})
