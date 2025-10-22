function runCode() {
    const code = document.getElementById('code').value;
    try {
        const result = eval(code);
        document.getElementById('output').textContent = result ?? 'Code executed!';
    } catch (err) {
        document.getElementById('output').textContent = 'Error: ' + err.message;
    }
}

async function saveProgress() {
    const name = document.getElementById('name').value;
    const lesson = document.getElementById('lessonName').value;
    const score = document.getElementById('score').value;

    const response = await fetch('http://localhost:3000/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lesson, score })
    });

    const data = await response.json();
    document.getElementById('status').textContent = data.message;
}
