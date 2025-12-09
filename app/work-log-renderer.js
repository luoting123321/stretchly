// Work Log Renderer
const { electronApi } = window

let tasks = []

async function init () {
  await loadTasks()
  setupEventListeners()
}

async function loadTasks () {
  try {
    tasks = await electronApi.getTasks()
    renderTasksPreview()
    renderQuickButtons()
  } catch (e) {
    console.error('Failed to load tasks:', e)
    tasks = []
    renderTasksPreview()
  }
}

function renderTasksPreview () {
  const preview = document.getElementById('tasks-preview')

  if (tasks.length === 0) {
    preview.innerHTML = '<div class="no-tasks">今天还没有设定任务</div>'
    return
  }

  // Show incomplete tasks first
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return 0
  })

  preview.innerHTML = sortedTasks.map(task => `
    <div class="task-preview-item ${task.completed ? 'completed' : ''}" data-task="${escapeHtml(task.text)}">
      <div class="task-check ${task.completed ? 'checked' : ''}"></div>
      <span>${escapeHtml(task.text)}</span>
    </div>
  `).join('')
}

function renderQuickButtons () {
  const container = document.getElementById('quick-buttons')

  // Get incomplete tasks for quick select
  const incompleteTasks = tasks.filter(t => !t.completed).slice(0, 4)

  // Default quick options
  const defaultOptions = ['开会', '写代码', '处理邮件', '休息']

  // Combine task names and default options
  const options = [
    ...incompleteTasks.map(t => t.text.substring(0, 15)),
    ...defaultOptions
  ].slice(0, 6)

  container.innerHTML = options.map(option => `
    <button class="quick-btn" data-text="${escapeHtml(option)}">${escapeHtml(option)}</button>
  `).join('')
}

function setupEventListeners () {
  const textarea = document.getElementById('work-log-input')
  const saveBtn = document.getElementById('btn-save')
  const skipBtn = document.getElementById('btn-skip')

  // Click on task to add to log
  document.getElementById('tasks-preview').addEventListener('click', (e) => {
    const taskItem = e.target.closest('.task-preview-item')
    if (taskItem) {
      const taskText = taskItem.dataset.task
      const currentText = textarea.value.trim()
      if (currentText) {
        textarea.value = currentText + '\n' + taskText
      } else {
        textarea.value = taskText
      }
      textarea.focus()
    }
  })

  // Quick buttons
  document.getElementById('quick-buttons').addEventListener('click', (e) => {
    const quickBtn = e.target.closest('.quick-btn')
    if (quickBtn) {
      const text = quickBtn.dataset.text
      const currentText = textarea.value.trim()
      if (currentText) {
        textarea.value = currentText + '、' + text
      } else {
        textarea.value = text
      }
      textarea.focus()
    }
  })

  // Save button
  saveBtn.addEventListener('click', async () => {
    const content = textarea.value.trim()
    if (content) {
      try {
        await electronApi.addLog({ content })
      } catch (e) {
        console.error('Failed to save log:', e)
      }
    }
    electronApi.closeWindow()
  })

  // Skip button
  skipBtn.addEventListener('click', () => {
    electronApi.skipLog()
  })

  // Enter key to save (Ctrl/Cmd + Enter)
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      saveBtn.click()
    }
  })

  // Auto focus textarea
  setTimeout(() => textarea.focus(), 100)
}

function escapeHtml (text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

document.addEventListener('DOMContentLoaded', init)
