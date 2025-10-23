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
    this.aiStatus = document.getElementById('aiStatus');
    this.statusRefreshBtn = document.getElementById('statusRefreshBtn');
    this.modelSelect = document.getElementById('modelSelect');
    this.modelInfo = document.getElementById('modelInfo');
    this.selectedModel = 'gemma3:1b';

    this.init();
  }

  async init() {
    await this.loadKnowledgeBase();
    this.setupEventListeners();
    this.loadExamples();
    this.addWelcomeMessage();
    this.checkAIStatus();
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

    // AI status refresh
    if (this.statusRefreshBtn) {
      this.statusRefreshBtn.addEventListener('click', () => this.checkAIStatus());
    }

    // Model selection
    if (this.modelSelect) {
      this.modelSelect.addEventListener('change', (e) => this.onModelChange(e.target.value));
      this.updateModelInfo();
    }
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

  // Model selection methods
  onModelChange(model) {
    this.selectedModel = model;
    this.updateModelInfo();
  }

  updateModelInfo() {
    const modelInfos = {
      'gemma3:1b': 'Fast, good quality responses',
      'llama3.2:1b': 'Fastest, good for quick answers',
      'llama3.2:3b': 'Better quality, moderate speed',
      'phi3:3.8b': 'Best quality, slower responses'
    };

    if (this.modelInfo) {
      const info = modelInfos[this.selectedModel] || 'Good balance of speed and quality';
      this.modelInfo.innerHTML = `<i class="fas fa-info-circle"></i><span>${info}</span>`;
    }
  }

  // Model and setup suggestions
  showModelSuggestion(suggestion) {
    const message = `💡 **Model Suggestion:** ${suggestion}

To get the best AI experience, run this command in your terminal:
\`\`\`bash
ollama pull gemma3:1b
\`\`\`

This will download a fast, high-quality AI model for coding assistance.`;

    this.addMessage('ai', message);
  }

  showSetupSuggestion(suggestions) {
    let message = `🚀 **Setup Required:** AI assistant needs Ollama to work.

**Quick Setup Steps:**
1. **Download Ollama:** https://ollama.ai/download
2. **Install and run:** \`ollama serve\`
3. **Download a model:** \`ollama pull gemma3:1b\`

**Why Ollama?**
• Runs locally on your computer
• No internet required for responses
• Privacy-focused (your code stays local)
• Works offline

**Alternative Models:**
• \`ollama pull llama3.2:1b\` (fastest)
• \`ollama pull llama3.2:3b\` (better quality)

Once setup is complete, refresh this page to start chatting with AI! 🤖`;

    this.addMessage('ai', message);
  }

  // AI Status checking
  async checkAIStatus() {
    if (!this.aiStatus) return;

    try {
      this.aiStatus.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Checking AI status...';
      this.aiStatus.className = 'ai-status checking';

      const response = await apiService.get('/api/ollama/health');

      if (response.status === 'healthy') {
        const modelCount = response.availableModels.length;
        const recommendedCount = response.installedRecommended.length;
        this.aiStatus.innerHTML = `<i class="fas fa-check-circle"></i> AI Ready (${modelCount} models)`;
        this.aiStatus.className = 'ai-status healthy';
        this.aiStatus.title = `Available models: ${response.availableModels.join(', ')}`;

        // Show model download suggestions if no recommended models
        if (recommendedCount === 0 && response.suggestions.length > 0) {
          setTimeout(() => {
            this.showModelSuggestion(response.suggestions[0]);
          }, 2000);
        }
      } else {
        this.aiStatus.innerHTML = '<i class="fas fa-times-circle"></i> AI Unavailable';
        this.aiStatus.className = 'ai-status unhealthy';
        this.aiStatus.title = response.suggestions.join('\n');

        // Show setup suggestions
        if (response.suggestions.length > 0) {
          setTimeout(() => {
            this.showSetupSuggestion(response.suggestions);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('AI status check failed:', error);
      this.aiStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Status Check Failed';
      this.aiStatus.className = 'ai-status error';
      this.aiStatus.title = 'Unable to check AI status. Backend may not be running.';
    }
  }

  // Fallback responses for common questions when Ollama is unavailable
  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase().trim();

    // HTML questions
    if (lowerMessage.includes('html') && (lowerMessage.includes('tag') || lowerMessage.includes('element'))) {
      return `📝 **HTML Elements & Tags**

Here are some common HTML elements:

**Structure Tags:**
• \`<html>\` - Root element
• \`<head>\` - Document head (metadata)
• \`<body>\` - Document body (visible content)
• \`<div>\` - Generic container
• \`<span>\` - Inline container

**Text Tags:**
• \`<h1>\` to \`<h6>\` - Headings (h1 is most important)
• \`<p>\` - Paragraph
• \`<strong>\` or \`<b>\` - Bold text
• \`<em>\` or \`<i>\` - Italic text

**Links & Media:**
• \`<a href="url">\` - Hyperlink
• \`<img src="image.jpg" alt="description">\` - Image

**Example:**
\`\`\`html
<h1>My First Website</h1>
<p>This is a <strong>bold</strong> paragraph with a <a href="https://example.com">link</a>.</p>
\`\`\`

Try creating some HTML in the code editor and click "Validate Code" to check for errors!`;
    }

    if (lowerMessage.includes('css') && (lowerMessage.includes('color') || lowerMessage.includes('style'))) {
      return `🎨 **CSS Styling Basics**

**Setting Colors:**
\`\`\`css
/* Color names */
h1 { color: red; }
p { color: blue; }

/* Hex codes */
.title { color: #ff0000; }
.text { color: #3366cc; }

/* RGB values */
.highlight { color: rgb(255, 0, 0); }
.accent { color: rgb(51, 102, 204); }
\`\`\`

**Background Colors:**
\`\`\`css
body { background-color: #f0f0f0; }
.button { background-color: #007bff; }
\`\`\`

**Text Styling:**
\`\`\`css
.title {
  color: #333;
  font-size: 24px;
  font-weight: bold;
}
\`\`\`

Try styling some HTML elements in the code editor!`;
    }

    if (lowerMessage.includes('javascript') && (lowerMessage.includes('variable') || lowerMessage.includes('var'))) {
      return `🔧 **JavaScript Variables**

**Variable Declaration:**
\`\`\`javascript
// Modern way (recommended)
let age = 25;
const name = "John";
var oldWay = "deprecated"; // Don't use this

// Variable types
let number = 42;           // Number
let text = "Hello";         // String
let isActive = true;        // Boolean
let items = [1, 2, 3];      // Array
let person = {name: "John"}; // Object
\`\`\`

**Variable Naming Rules:**
• Start with letter, underscore, or dollar sign
• Can contain letters, numbers, underscores, dollar signs
• Case sensitive (\`myVar\` ≠ \`myvar\`)
• Use camelCase for multi-word names

**Example:**
\`\`\`javascript
let userName = "Alice";
let userAge = 30;
let isLoggedIn = true;

console.log(userName + " is " + userAge + " years old");
\`\`\`

Try writing some JavaScript in the code editor!`;
    }

    if (lowerMessage.includes('function') || lowerMessage.includes('how to create')) {
      return `⚙️ **JavaScript Functions**

**Function Declaration:**
\`\`\`javascript
function greetUser(name) {
  return "Hello, " + name + "!";
}

// Function call
let message = greetUser("Alice");
console.log(message); // "Hello, Alice!"
\`\`\`

**Arrow Functions (Modern):**
\`\`\`javascript
const add = (a, b) => a + b;
const square = x => x * x;

// Usage
console.log(add(5, 3));    // 8
console.log(square(4));     // 16
\`\`\`

**Function with Multiple Parameters:**
\`\`\`javascript
function calculateArea(width, height) {
  return width * height;
}

let area = calculateArea(10, 5);
console.log("Area: " + area); // "Area: 50"
\`\`\`

Functions help organize your code into reusable blocks!`;
    }

    if (lowerMessage.includes('error') || lowerMessage.includes('debug') || lowerMessage.includes('fix')) {
      return `🐛 **Debugging Tips**

**Common JavaScript Errors:**
1. **ReferenceError**: Variable not defined
   - Check variable spelling
   - Make sure variable is declared before use

2. **TypeError**: Wrong data type
   - Check if you're calling methods on the right type
   - Example: \`undefined\` doesn't have methods

3. **SyntaxError**: Invalid syntax
   - Missing semicolons, brackets, quotes
   - Use the code validator to check

**Debugging Steps:**
1. Check browser console (F12 → Console)
2. Use \`console.log()\` to inspect values
3. Test small pieces of code separately
4. Use the "Validate Code" button

**Example Debugging:**
\`\`\`javascript
// Wrong - will cause error
console.log(myVariable); // ReferenceError

// Right - declare first
let myVariable = "Hello";
console.log(myVariable); // "Hello"
\`\`\`

Try the code validator to catch errors before running!`;
    }

    // Generic fallback for other questions
    if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why')) {
      return `🤔 **Learning Web Development**

I'm currently offline, but I can still help you learn!

**Getting Started:**
• **HTML**: Structure your web pages with elements like \`<h1>\`, \`<p>\`, \`<div>\`
• **CSS**: Style your pages with colors, fonts, layouts
• **JavaScript**: Add interactivity and dynamic behavior

**Try These:**
1. Look at the **Lessons** section for step-by-step tutorials
2. Use the **Code Editor** to practice writing code
3. Click **"Validate Code"** to check for syntax errors
4. Explore **Code Examples** for inspiration

**Quick Example:**
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <style>
    h1 { color: blue; }
  </style>
</head>
<body>
  <h1>Hello World!</h1>
  <p>This is my first webpage.</p>
  
  <script>
    console.log("JavaScript works!");
  </script>
</body>
</html>
\`\`\`

Keep practicing - you'll get the hang of it! 🚀`;
    }

    return null; // No fallback available
  }

  // Removed provider switching functionality

  async processWithOllama(message) {
    try {
      uiManager.setButtonLoading('sendButton', true, 'Thinking...');

      const response = await apiService.post('/api/ollama', {
        messages: [{role: 'user', content: message}],
        model: this.selectedModel
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

      // Enhanced error handling with detailed guidance
      let userMessage = CONFIG.MESSAGES.AI_UNAVAILABLE;
      let suggestions = [];

      if (error.message.includes('Ollama service is not running') || error.message.includes('11434')) {
        userMessage = `❌ Ollama AI is not available. Here's how to fix it:

**Quick Setup:**
1. Download Ollama: https://ollama.ai/download
2. Install and run: \`ollama serve\`
3. Pull a model: \`ollama pull gemma3:1b\`
4. Refresh this page

**Alternative Models:**
• \`ollama pull llama3.2:1b\` (fast)
• \`ollama pull llama3.2:3b\` (better quality)

**Need Help?** Check the README.md for detailed setup instructions.`;
        suggestions = [
          'Download Ollama from https://ollama.ai',
          'Run: ollama serve',
          'Run: ollama pull gemma3:1b',
          'Refresh this page'
        ];
      } else if (error.message.includes('Model') && error.message.includes('not available')) {
        const availableModels = error.message.match(/Available models: (.+)/)?.[1] || '';
        userMessage = `❌ The requested AI model is not available.

**Available models:** ${availableModels || 'none found'}

**Recommended actions:**
• Pull gemma3:1b: \`ollama pull gemma3:1b\`
• Pull llama3.2:1b: \`ollama pull llama3.2:1b\`
• Check installed models: \`ollama list\`

**Why this matters:** Different models offer different speeds and capabilities.`;
        suggestions = [
          'Run: ollama pull gemma3:1b',
          'Run: ollama pull llama3.2:1b',
          'Check: ollama list'
        ];
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        userMessage = `❌ Network error connecting to Ollama.

**Troubleshooting:**
• Ensure Ollama is running: \`ollama serve\`
• Check port 11434 is not blocked
• Try restarting Ollama service
• Check firewall settings

**Status check:** Visit http://localhost:11434/api/tags in your browser.`;
        suggestions = [
          'Check if Ollama is running',
          'Verify port 11434 is accessible',
          'Restart Ollama service'
        ];
      } else {
        userMessage = `❌ AI Assistant Error: ${error.message}

**General troubleshooting:**
• Restart the KidLearner server
• Check Ollama is running on port 11434
• Try refreshing the page
• Check browser console for details`;
        suggestions = [
          'Restart KidLearner server',
          'Check Ollama status',
          'Refresh the page'
        ];
      }

      // Try fallback responses for common questions when Ollama is unavailable
      const fallbackResponse = this.getFallbackResponse(message);
      if (fallbackResponse) {
        this.addMessage('ai', fallbackResponse);
        return;
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
