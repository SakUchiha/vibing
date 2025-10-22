const chat = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const typingIndicator = document.getElementById('typing');

// Add message to chat
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
  
  const headerDiv = document.createElement('div');
  headerDiv.className = 'message-header';
  headerDiv.textContent = isUser ? 'You' : 'AI Assistant';
  
  const contentDiv = document.createElement('div');
  contentDiv.textContent = content;
  
  messageDiv.appendChild(headerDiv);
  messageDiv.appendChild(contentDiv);
  chat.appendChild(messageDiv);
  
  // Scroll to bottom
  chat.scrollTop = chat.scrollHeight;
}

// Show typing indicator
function showTyping() {
  typingIndicator.classList.add('show');
  chat.scrollTop = chat.scrollHeight;
}

// Hide typing indicator
function hideTyping() {
  typingIndicator.classList.remove('show');
}

// Send message function
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  
  // Add user message
  addMessage(text, true);
  input.value = '';
  sendBtn.disabled = true;
  
  // Show typing indicator
  showTyping();
  
  try {
    const res = await fetch('http://localhost:4000/api/ai', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        messages: [{role: 'user', content: text}]
      })
    });
    
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.";
    
    // Hide typing indicator and add AI response
    hideTyping();
    addMessage(reply, false);
    
  } catch (error) {
    hideTyping();
    addMessage("I'm having trouble connecting to the server. Please check your internet connection and try again.", false);
  }
  
  sendBtn.disabled = false;
}

// Ask a predefined question
function askQuestion(question) {
  input.value = question;
  sendMessage();
}

// Event listeners
sendBtn.onclick = sendMessage;

// Send on Enter (but allow Shift+Enter for new lines)
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
});
