/**
 * AI Assistant - Ollama-based implementation for web development questions
 * Uses local Ollama AI for HTML, CSS, and JavaScript assistance
 */
class AIAssistant {
  constructor() {
    this.knowledgeBase = null;
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendButton');
    this.examplesContent = document.getElementById('examplesContent');
    this.codeEditor = document.getElementById('codeEditor');
    this.validateButton = document.getElementById('validateButton');
    this.validationResults = document.getElementById('validationResults');
    this.languageTabs = document.querySelectorAll('.language-tab');
    this.currentLanguage = 'html';
    this.syntaxChecker = new SyntaxChecker();

    this.init();
  }

  async init() {
    await this.loadKnowledgeBase();
    this.setupEventListeners();
    this.loadExamples();
    this.addWelcomeMessage();
  }

  async loadKnowledgeBase() {
    try {
      const response = await fetch('data/ai-knowledge.json');
      this.knowledgeBase = await response.json();
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      this.knowledgeBase = { questions: [], categories: {}, code_examples: {} };
    }
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

    // Code validation
    this.validateButton.addEventListener('click', () => this.validateCode());

    // Language tabs
    this.languageTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchLanguage(tab.dataset.language));
    });
  }

  addWelcomeMessage() {
    this.addMessage('ai', '🤖 Hello! I\'m your Ollama AI coding assistant. I can help you with HTML, CSS, and JavaScript questions, and I can validate your code. What would you like to learn today?');
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    this.addMessage('user', message);
    this.chatInput.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    // Process message with Ollama AI
    await this.processWithOllama(message);
  }

  // Removed client-side AI processing methods

  // Removed client-side validation and example request handlers

  async validateCode() {
    const code = this.codeEditor.value.trim();
    if (!code) {
      this.showValidationResult('Please enter some code to validate.', 'info');
      return;
    }

    uiManager.setButtonLoading('validateButton', true, 'Analyzing...');

    try {
      // First try AI-powered validation
      const aiValidation = await this.validateWithAI(code, this.currentLanguage);

      if (aiValidation) {
        this.displayAIAnalysis(aiValidation);
      } else {
        // Fallback to basic syntax checking
        this.fallbackValidation(code);
      }

      // Track validation for progress
      if (window.progressTracker) {
        window.progressTracker.incrementValidations();
      }

    } catch (error) {
      console.error('Validation error:', error);
      uiManager.showError('Code validation failed. Please try again.', () => this.validateCode());
      this.fallbackValidation(code);
    } finally {
      uiManager.setButtonLoading('validateButton', false);
    }
  }

  async validateWithAI(code, language) {
    try {
      const response = await apiService.post('/api/validate-code', {
        code: code,
        language: language
      });

      return response;
    } catch (error) {
      console.warn('AI validation failed, falling back to basic validation:', error);
      return null;
    }
  }

  displayAIAnalysis(analysis) {
    let html = '<div class="ai-validation-results">';

    // Errors section
    if (analysis.analysis.errors && analysis.analysis.errors.length > 0) {
      html += '<div class="validation-section errors">';
      html += '<h4>❌ Issues Found:</h4>';
      analysis.analysis.errors.forEach(error => {
        html += `<div class="validation-item error">${error}</div>`;
      });
      html += '</div>';
    }

    // Warnings section
    if (analysis.analysis.warnings && analysis.analysis.warnings.length > 0) {
      html += '<div class="validation-section warnings">';
      html += '<h4>⚠️ Warnings:</h4>';
      analysis.analysis.warnings.forEach(warning => {
        html += `<div class="validation-item warning">${warning}</div>`;
      });
      html += '</div>';
    }

    // Suggestions section
    if (analysis.analysis.suggestions && analysis.analysis.suggestions.length > 0) {
      html += '<div class="validation-section suggestions">';
      html += '<h4>💡 Suggestions:</h4>';
      analysis.analysis.suggestions.forEach(suggestion => {
        html += `<div class="validation-item suggestion">${suggestion}</div>`;
      });
      html += '</div>';
    }

    // Best practices section
    if (analysis.analysis.bestPractices && analysis.analysis.bestPractices.length > 0) {
      html += '<div class="validation-section best-practices">';
      html += '<h4>✨ Best Practices:</h4>';
      analysis.analysis.bestPractices.forEach(practice => {
        html += `<div class="validation-item best-practice">${practice}</div>`;
      });
      html += '</div>';
    }

    // If no issues found
    if ((!analysis.analysis.errors || analysis.analysis.errors.length === 0) &&
        (!analysis.analysis.warnings || analysis.analysis.warnings.length === 0) &&
        (!analysis.analysis.suggestions || analysis.analysis.suggestions.length === 0) &&
        (!analysis.analysis.bestPractices || analysis.analysis.bestPractices.length === 0)) {
      html += '<div class="validation-success">✅ Your code looks good! No major issues detected.</div>';
    }

    html += '</div>';
    this.validationResults.innerHTML = html;
  }

  fallbackValidation(code) {
    // Fallback to basic syntax checking
    let result;
    switch (this.currentLanguage) {
      case 'html':
        result = this.syntaxChecker.checkHTML(code);
        break;
      case 'css':
        result = this.syntaxChecker.checkCSS(code);
        break;
      case 'javascript':
        result = this.syntaxChecker.checkJavaScript(code);
        break;
    }

    this.displayValidationResults(result);
  }

  displayValidationResults(result) {
    let html = '';

    if (result.errors.length > 0) {
      html += '<div class="validation-errors">';
      html += '<h4>❌ Errors Found:</h4>';
      result.errors.forEach(error => {
        html += `<div class="validation-item error">
          <strong>Line ${error.line}:</strong> ${error.message}
          ${error.suggestion ? `<br><em>Suggestion: ${error.suggestion}</em>` : ''}
        </div>`;
      });
      html += '</div>';
    }

    if (result.warnings.length > 0) {
      html += '<div class="validation-warnings">';
      html += '<h4>⚠️ Warnings:</h4>';
      result.warnings.forEach(warning => {
        html += `<div class="validation-item warning">
          <strong>Line ${warning.line}:</strong> ${warning.message}
          ${warning.suggestion ? `<br><em>Suggestion: ${warning.suggestion}</em>` : ''}
        </div>`;
      });
      html += '</div>';
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      html = '<div class="validation-success">✅ Your code looks good! No errors or warnings found.</div>';
    }

    this.validationResults.innerHTML = html;
  }

  showValidationResult(message, type = 'info') {
    this.validationResults.innerHTML = `<div class="validation-${type}">${message}</div>`;
  }

  switchLanguage(language) {
    this.currentLanguage = language;

    // Update tabs
    this.languageTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.language === language);
    });

    // Remove existing syntax highlighting
    if (window.syntaxHighlighter) {
      window.syntaxHighlighter.removeHighlighting(this.codeEditor);
    }

    // Update placeholder
    const placeholders = {
      html: 'Enter your HTML code here...\n\nExample:\n<h1>Hello World</h1>\n<p>This is a paragraph.</p>',
      css: 'Enter your CSS code here...\n\nExample:\nbody {\n  font-family: Arial, sans-serif;\n  color: #333;\n}',
      javascript: 'Enter your JavaScript code here...\n\nExample:\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("World"));'
    };

    this.codeEditor.placeholder = placeholders[language];
    this.codeEditor.value = '';

    // Apply syntax highlighting if available
    if (window.syntaxHighlighter) {
      setTimeout(() => {
        window.syntaxHighlighter.applyHighlighting(this.codeEditor, language);
      }, 100);
    }

    this.validationResults.innerHTML = '';
  }

  loadExamples() {
    if (!this.knowledgeBase.code_examples) return;

    let html = '';

    Object.keys(this.knowledgeBase.code_examples).forEach(language => {
      const examples = this.knowledgeBase.code_examples[language];
      examples.forEach(example => {
        html += `
          <div class="example-item" onclick="aiAssistant.loadExample('${language}', '${example.title.replace(/'/g, "\\'")}')">
            <h4>${example.title}</h4>
            <p>${example.description}</p>
            <span class="example-language">${language.toUpperCase()}</span>
          </div>
        `;
      });
    });

    this.examplesContent.innerHTML = html;
  }

  loadExample(language, title) {
    const examples = this.knowledgeBase.code_examples[language];
    const example = examples.find(ex => ex.title === title);

    if (example) {
      this.switchLanguage(language);
      this.codeEditor.value = example.code;

      // Re-apply syntax highlighting after setting value
      if (window.syntaxHighlighter) {
        setTimeout(() => {
          window.syntaxHighlighter.applyHighlighting(this.codeEditor, language);
        }, 100);
      }

      this.addMessage('ai', `I've loaded the "${title}" example into the code editor. Try modifying it and then click "Validate Code" to check for any issues!`);
    }
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

  // Removed provider switching functionality

  async processWithOllama(message) {
    try {
      uiManager.setButtonLoading('sendButton', true, 'Thinking...');

      const response = await apiService.post('/api/ollama', {
        messages: [{role: 'user', content: message}],
        model: 'gemma3:1b' // Default model, can be configured
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
      console.error('Ollama API error:', error);

      // Enhanced error handling with fallback suggestions
      let userMessage = CONFIG.MESSAGES.AI_UNAVAILABLE;

      if (error.message.includes('Ollama') || error.message.includes('11434')) {
        userMessage = `❌ Ollama AI is not available. Please ensure Ollama is running locally on port 11434. You can download Ollama from https://ollama.ai`;
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        userMessage = `❌ Network error. ${CONFIG.MESSAGES.NETWORK_ERROR}`;
      }

      this.addMessage('ai', userMessage);
      uiManager.showError(userMessage, () => this.processWithOllama(message));
    }
  }
}

// Initialize when DOM is loaded
let aiAssistant;
document.addEventListener('DOMContentLoaded', () => {
  aiAssistant = new AIAssistant();
});
