const codeEl = document.getElementById('code');
const frame = document.getElementById('output');

document.getElementById('run').onclick = () => {
  frame.srcdoc = codeEl.value;
};

// Load lesson from backend
const lessonId = localStorage.getItem('lesson');
if (lessonId) {
  fetch(`/api/lessons/${lessonId}`)
    .then(r => r.json())
    .then(l => codeEl.value = l.exercise.starter);
}
