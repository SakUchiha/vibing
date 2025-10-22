const codeEl = document.getElementById('code');
const frame = document.getElementById('output');
const autoRunToggle = document.getElementById('autoRunToggle');
const autoRunStatus = document.getElementById('autoRunStatus');

// Auto-run state
let autoRunEnabled = false;
let debounceTimer = null;
let isRunning = false;

// Manual run function
function runCode() {
  if (isRunning) return;
  
  isRunning = true;
  autoRunStatus.textContent = 'Running...';
  autoRunStatus.className = 'status-indicator running';
  
  try {
    frame.srcdoc = codeEl.value;
    autoRunStatus.textContent = 'Success';
    autoRunStatus.className = 'status-indicator running';
  } catch (error) {
    autoRunStatus.textContent = 'Error';
    autoRunStatus.className = 'status-indicator error';
  }
  
  setTimeout(() => {
    isRunning = false;
    if (!autoRunEnabled) {
      autoRunStatus.textContent = '';
      autoRunStatus.className = 'status-indicator';
    }
  }, 500);
}

// Debounced auto-run function
function debouncedAutoRun() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (autoRunEnabled) {
      runCode();
    }
  }, 1000); // 1 second delay
}

// Event listeners
document.getElementById('run').onclick = runCode;

autoRunToggle.onclick = () => {
  autoRunEnabled = !autoRunEnabled;
  
  if (autoRunEnabled) {
    autoRunToggle.textContent = 'Auto Run: ON';
    autoRunToggle.classList.add('active');
    autoRunStatus.textContent = 'Auto-run enabled';
    autoRunStatus.className = 'status-indicator running';
    // Run immediately when enabled
    runCode();
  } else {
    autoRunToggle.textContent = 'Auto Run: OFF';
    autoRunToggle.classList.remove('active');
    autoRunStatus.textContent = '';
    autoRunStatus.className = 'status-indicator';
    clearTimeout(debounceTimer);
  }
};

// Listen for code changes
codeEl.addEventListener('input', () => {
  if (autoRunEnabled) {
    debouncedAutoRun();
  }
});

// Load lesson from backend
const lessonId = localStorage.getItem('lesson');
if (lessonId) {
  fetch(`/api/lessons/${lessonId}`)
    .then(r => r.json())
    .then(l => {
      codeEl.value = l.exercise.starter;
      // Auto-run initial content if enabled
      if (autoRunEnabled) {
        setTimeout(runCode, 100);
      }
    });
}
