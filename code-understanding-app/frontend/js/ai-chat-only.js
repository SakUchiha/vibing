/**
 * AI Chat Only - Chat interface for Ask AI page
 * Handles only the chat functionality without code validation
 */
class AIChatOnly {
  constructor() {
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendButton');

    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Chat functionality
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    this.addMessage('user', message);
    this.chatInput.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    // Process message with OpenAI via OpenRouter
    await this.processWithOpenAI(message);
  }

  addMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = sender === 'ai' ? '🤖' : '👤';
    const senderName = sender === 'ai' ? 'AI Assistant' : 'You';

    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-sender">${senderName}</div>
        <div class="message-text">${this.formatResponse(content)}</div>
      </div>
    `;

    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message ai-message typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="message-sender">AI Assistant</div>
        <div class="message-text">
          <span class="typing-dots">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    `;
    this.chatMessages.appendChild(indicator);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  formatResponse(text) {
    // Convert markdown-style code blocks to HTML
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // Convert inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');

    return text;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async processWithOpenAI(message) {
    try {
      uiManager.setButtonLoading('sendButton', true, 'Thinking...');

      const response = await apiService.post('/api/openai', {
        messages: [{ role: 'user', content: message }],
        model: 'gpt-4o-mini'
      });

      uiManager.setButtonLoading('sendButton', false);
      this.hideTypingIndicator();

      const reply = response.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
      this.addMessage('ai', this.formatResponse(reply));

      // Track AI interaction for progress
      if (window.progressTracker) {
        window.progressTracker.incrementAIInteractions();
      }

    } catch (error) {
      uiManager.setButtonLoading('sendButton', false);
      this.hideTypingIndicator();
      console.error('OpenRouter API error:', error);

      // Enhanced error handling with fallback suggestions
      let userMessage = CONFIG.MESSAGES.AI_UNAVAILABLE;

      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        userMessage = `❌ OpenRouter API key is not configured. Please add OPENROUTER_API_KEY to the backend .env file.`;
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        userMessage = `❌ Network error. ${CONFIG.MESSAGES.NETWORK_ERROR}`;
      }

      this.addMessage('ai', userMessage);
      uiManager.showError(userMessage, () => this.processWithOpenAI(message));
    }
  }
}

// Initialize when DOM is loaded
let aiChatOnly;
document.addEventListener('DOMContentLoaded', () => {
  aiChatOnly = new AIChatOnly();
});