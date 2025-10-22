fetch('/api/lessons')
  .then(res => res.json())
  .then(lessons => {
    const list = document.getElementById('lessonList');
    lessons.forEach(l => {
      const li = document.createElement('li');
      li.innerHTML = `<b>${l.title}</b> — ${l.summary} <button onclick="view('${l.id}')">View</button>`;
      list.appendChild(li);
    });
  });

function view(id) {
  localStorage.setItem('lesson', id);
  location.href = 'editor.html';
}
