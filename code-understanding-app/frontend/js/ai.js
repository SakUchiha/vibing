const chat = document.getElementById('chat');
const input = document.getElementById('input');
document.getElementById('send').onclick = async () => {
  const text = input.value.trim();
  if (!text) return;
  chat.innerHTML += `<p><b>You:</b> ${text}</p>`;
  input.value = '';
  const res = await fetch('http://localhost:4000/api/ai', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      messages: [{role: 'user', content: text}]
    })
  });
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "Error.";
  chat.innerHTML += `<p><b>AI:</b> ${reply}</p>`;
};
