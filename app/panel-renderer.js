// Panel renderer script - Task Manager
const { electronApi } = window

let tasks = []
let logs = []
let logExpanded = false

// Initialize
async function init () {
  updateDateHeader()
  await loadTasks()
  await loadLogs()
  setupEventListeners()
  updateStatus()
}

function updateDateHeader () {
  const now = new Date()
  const options = { weekday: 'long', month: 'long', day: 'numeric' }
  const dateStr = now.toLocaleDateString('zh-CN', options)
  document.getElementById('today-date').textContent = dateStr
}

async function updateStatus () {
  try {
    const status = await electronApi.getStatus()
    const badge = document.getElementById('status-badge')
    if (status && status.statusText) {
      badge.textContent = status.statusText
      badge.style.display = 'inline-block'
    } else {
      badge.style.display = 'none'
    }
  } catch (e) {
    console.error('Failed to get status:', e)
  }
}

// Task Management
async function loadTasks () {
  try {
    tasks = await electronApi.getTasks()
    renderTasks()
  } catch (e) {
    console.error('Failed to load tasks:', e)
    tasks = []
    renderTasks()
  }
}

function renderTasks () {
  const tasksList = document.getElementById('tasks-list')
  const taskCount = document.getElementById('task-count')

  const incompleteTasks = tasks.filter(t => !t.completed)
  taskCount.textContent = incompleteTasks.length

  if (tasks.length === 0) {
    tasksList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">添加今天要完成的任务</div>
      </div>
    `
    return
  }

  // Sort: incomplete first, then by creation time
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  tasksList.innerHTML = sortedTasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="task-delete" data-id="${task.id}">✕</button>
    </div>
  `).join('')
}

async function addTask (text) {
  if (!text.trim()) return

  try {
    await electronApi.addTask({
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    })
    await loadTasks()
  } catch (e) {
    console.error('Failed to add task:', e)
  }
}

async function toggleTask (taskId) {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return

  try {
    await electronApi.updateTask(taskId, { completed: !task.completed })
    await loadTasks()
  } catch (e) {
    console.error('Failed to update task:', e)
  }
}

async function deleteTask (taskId) {
  try {
    await electronApi.deleteTask(taskId)
    await loadTasks()
  } catch (e) {
    console.error('Failed to delete task:', e)
  }
}

async function clearCompletedTasks () {
  try {
    await electronApi.clearCompletedTasks()
    await loadTasks()
  } catch (e) {
    console.error('Failed to clear completed tasks:', e)
  }
}

// Hourly Logs
async function loadLogs () {
  try {
    logs = await electronApi.getLogs()
    renderLogs()
  } catch (e) {
    console.error('Failed to load logs:', e)
    logs = []
    renderLogs()
  }
}

function renderLogs () {
  const logList = document.getElementById('log-list')

  // Filter to today's logs only
  const today = new Date().toDateString()
  const todayLogs = logs.filter(log => {
    return new Date(log.timestamp).toDateString() === today
  })

  if (todayLogs.length === 0) {
    logList.innerHTML = `
      <div class="log-empty">今天还没有工作记录</div>
    `
    return
  }

  // Sort by time, newest first
  const sortedLogs = [...todayLogs].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  logList.innerHTML = sortedLogs.map(log => {
    const time = new Date(log.timestamp)
    const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    return `
      <div class="log-item">
        <div class="log-time">${timeStr}</div>
        <div class="log-content">${escapeHtml(log.content)}</div>
      </div>
    `
  }).join('')
}

function toggleLogSection () {
  const logList = document.getElementById('log-list')
  const toggleBtn = document.getElementById('btn-toggle-log')

  logExpanded = !logExpanded

  if (logExpanded) {
    logList.classList.remove('hidden')
    toggleBtn.textContent = '收起'
  } else {
    logList.classList.add('hidden')
    toggleBtn.textContent = '展开'
  }
}

// Event Listeners
function setupEventListeners () {
  // Window controls
  document.getElementById('btn-minimize').addEventListener('click', () => {
    electronApi.minimizeWindow()
  })

  document.getElementById('btn-close').addEventListener('click', () => {
    electronApi.closeWindow()
  })

  // Add task
  const taskInput = document.getElementById('task-input')
  const addBtn = document.getElementById('btn-add-task')

  addBtn.addEventListener('click', () => {
    addTask(taskInput.value)
    taskInput.value = ''
    taskInput.focus()
  })

  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTask(taskInput.value)
      taskInput.value = ''
    }
  })

  // Task list events (delegation)
  document.getElementById('tasks-list').addEventListener('click', (e) => {
    const checkbox = e.target.closest('.task-checkbox')
    const deleteBtn = e.target.closest('.task-delete')

    if (checkbox) {
      toggleTask(checkbox.dataset.id)
    } else if (deleteBtn) {
      deleteTask(deleteBtn.dataset.id)
    }
  })

  // Toggle log section
  document.getElementById('btn-toggle-log').addEventListener('click', toggleLogSection)

  // Bottom actions
  document.getElementById('btn-preferences').addEventListener('click', () => {
    electronApi.openPreferences()
  })

  document.getElementById('btn-clear-completed').addEventListener('click', clearCompletedTasks)

  // Listen for updates from main process
  electronApi.onTasksUpdated(() => loadTasks())
  electronApi.onLogsUpdated(() => loadLogs())
}

// Utility
function escapeHtml (text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Start
document.addEventListener('DOMContentLoaded', init)
