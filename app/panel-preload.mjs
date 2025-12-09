import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronApi', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('panel-minimize'),
  closeWindow: () => ipcRenderer.send('panel-close'),
  openPreferences: () => ipcRenderer.send('open-preferences'),

  // Task management
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  addTask: (task) => ipcRenderer.invoke('add-task', task),
  updateTask: (taskId, updates) => ipcRenderer.invoke('update-task', taskId, updates),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
  clearCompletedTasks: () => ipcRenderer.invoke('clear-completed-tasks'),

  // Hourly logs
  getLogs: () => ipcRenderer.invoke('get-logs'),
  addLog: (log) => ipcRenderer.invoke('add-log', log),

  // Status
  getStatus: () => ipcRenderer.invoke('get-panel-status'),

  // Events
  onTasksUpdated: (callback) => ipcRenderer.on('tasks-updated', callback),
  onLogsUpdated: (callback) => ipcRenderer.on('logs-updated', callback)
})
