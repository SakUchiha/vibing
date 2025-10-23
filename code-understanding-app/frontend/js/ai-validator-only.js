/**
 * AI Validator Only - Code validation interface for Code Validator page
 * Handles only the code validation functionality without chat
 */
class AIValidatorOnly {
  constructor() {
    this.codeEditor = document.getElementById('codeEditor');
    this.validateButton = document.getElementById('validateButton');
    this.validationResults = document.getElementById('validationResults');
    this.examplesContent = document.getElementById('examplesContent');
    this.languageTabs = document.querySelectorAll('.language-tab');
    this.currentLanguage = 'html';
    this.syntaxChecker = new SyntaxChecker();

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadExamples();
  }

  setupEventListeners() {
    // Code validation
    this.validateButton.addEventListener('click', () => this.validateCode());

    // Language tabs
    this.languageTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchLanguage(tab.dataset.language));
    });
  }

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
    // Load knowledge base for examples
    fetch('data/ai-knowledge.json')
      .then(response => response.json())
      .then(data => {
        if (data.code_examples) {
          this.renderExamples(data.code_examples);
        }
      })
      .catch(error => {
        console.error('Failed to load examples:', error);
      });
  }

  renderExamples(codeExamples) {
    let html = '';

    Object.keys(codeExamples).forEach(language => {
      const examples = codeExamples[language];
      examples.forEach(example => {
        html += `
          <div class="example-item" onclick="aiValidator.loadExample('${language}', '${example.title.replace(/'/g, "\\'")}')">
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
    // Load knowledge base to find the example
    fetch('data/ai-knowledge.json')
      .then(response => response.json())
      .then(data => {
        const examples = data.code_examples[language];
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
        }
      })
      .catch(error => {
        console.error('Failed to load example:', error);
      });
  }
}

// Initialize when DOM is loaded
let aiValidator;
document.addEventListener('DOMContentLoaded', () => {
  aiValidator = new AIValidatorOnly();
});