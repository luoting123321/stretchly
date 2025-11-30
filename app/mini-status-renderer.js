const timerElement = document.getElementById('timer')
const bubbleElement = document.getElementById('bubble')
const labelElement = document.getElementById('label')

let targetTime = null
let status = 'running' // running, paused, break

function updateTimer () {
  if (status !== 'running') return

  if (!targetTime) {
    timerElement.innerText = '--:--'
    return
  }

  const now = Date.now()
  const diff = targetTime - now

  if (diff <= 0) {
    timerElement.innerText = '00:00'
    return
  }

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  timerElement.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

window.electronApi.onUpdateStatus((event, data) => {
  // data: { status: 'running' | 'paused' | 'break', targetTime: number, text: string, color: string }
  status = data.status
  targetTime = data.targetTime

  if (data.color) {
    if (status === 'break') {
      bubbleElement.style.backgroundColor = data.color
    } else {
      bubbleElement.style.backgroundColor = '' // Reset to CSS default
    }
  }

  if (status === 'paused') {
    bubbleElement.classList.add('paused')
    bubbleElement.classList.remove('break')
    timerElement.innerText = data.text || 'PAUSED'
    labelElement.style.display = 'none'
  } else if (status === 'break') {
    bubbleElement.classList.remove('paused')
    bubbleElement.classList.add('break')
    timerElement.innerText = 'BREAK'
    labelElement.style.display = 'none'
  } else {
    bubbleElement.classList.remove('paused')
    bubbleElement.classList.remove('break')
    labelElement.style.display = 'block'
    updateTimer()
  }
})

// Start timer loop
setInterval(updateTimer, 1000)
updateTimer()
