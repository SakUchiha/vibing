const codeEl = document.getElementById('code');
const frame = document.getElementById('output');
const autoRunToggle = document.getElementById('autoRunToggle');
const autoRunStatus = document.getElementById('autoRunStatus');

// Auto-run state
let autoRunEnabled = false;
let debounceTimer = null;
let isRunning = false;

// Default starter code
const defaultCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
        }
        .button {
            background: #ff6b35;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            transition: all 0.3s ease;
        }
        .button:hover {
            background: #e55a2b;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to KidLearner!</h1>
        <p>This is your code editor. Try editing this code and see the changes in real-time!</p>
        <button class="button" onclick="showMessage()">Click Me!</button>
        <div id="message"></div>
    </div>

    <script>
        function showMessage() {
            const messages = [
                "Great job! You're learning to code!",
                "Keep practicing and you'll become a great developer!",
                "HTML, CSS, and JavaScript are powerful tools!",
                "Try changing the colors or text above!"
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            document.getElementById('message').innerHTML = '<p style="margin-top: 20px; font-size: 18px;">' + randomMessage + '</p>';
        }
    </script>
</body>
</html>`;

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

// Clear function
function clearCode() {
  if (confirm('Are you sure you want to clear all code?')) {
    codeEl.value = '';
    frame.srcdoc = '';
  }
}

// Save function
function saveCode() {
  const code = codeEl.value;
  const blob = new Blob([code], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-code.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Track file save for progress
  if (window.progressTracker) {
    window.progressTracker.incrementFilesSaved();
  }
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
document.getElementById('clear').onclick = clearCode;
document.getElementById('save').onclick = saveCode;

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

// Load lesson from URL parameters or localStorage
const urlParams = new URLSearchParams(window.location.search);
const lessonId = urlParams.get('lesson') || localStorage.getItem('lesson');

if (lessonId) {
  uiManager.showLoading('code', 'Loading lesson...');
  apiService.get(`/api/lessons/${lessonId}`)
    .then(lesson => {
      uiManager.hideLoading('code');
      codeEl.value = lesson.exercise.starter;
      uiManager.showSuccess('Lesson loaded successfully!');
      // Auto-run initial content if enabled
      if (autoRunEnabled) {
        setTimeout(runCode, 100);
      }
    })
    .catch(error => {
      uiManager.hideLoading('code');
      console.error('Error loading lesson:', error);
      uiManager.showError(CONFIG.MESSAGES.LESSON_LOAD_ERROR);
      // Load default code if lesson fails to load
      codeEl.value = defaultCode;
    });
} else {
  // Load default code if no lesson
  codeEl.value = defaultCode;
}

// Run initial code
setTimeout(runCode, 100);
