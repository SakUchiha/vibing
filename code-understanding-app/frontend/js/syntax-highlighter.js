/**
 * Syntax Highlighter for KidLearner Code Editor
 * Provides basic syntax highlighting for HTML, CSS, and JavaScript
 */
class SyntaxHighlighter {
  constructor() {
    this.rules = {
      html: {
        // Tags
        tag: /(<\/?[\w\s="'-]+>)/g,
        // Attributes
        attribute: /\s([\w-]+)="([^"]*)"/g,
        // Comments
        comment: /(<!--[\s\S]*?-->)/g,
        // Doctype
        doctype: /(<!DOCTYPE[^>]*>)/g
      },
      css: {
        // Selectors
        selector: /^([^{]+)\{/gm,
        // Properties
        property: /([a-z-]+):/g,
        // Values
        value: /:\s*([^;]+);/g,
        // Comments
        comment: /(\/\*[\s\S]*?\*\/)/g,
        // At-rules
        atRule: /(@[a-z-]+[^;{]*)/g
      },
      javascript: {
        // Keywords
        keyword: /\b(const|let|var|function|if|else|for|while|return|class|extends|import|export|from|async|await|try|catch|finally|throw)\b/g,
        // Strings
        string: /(["'`])(.*?)\1/g,
        // Numbers
        number: /\b\d+(\.\d+)?\b/g,
        // Functions
        function: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        // Comments
        comment: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
        // Operators
        operator: /([+\-*/=<>!&|]+)/g
      }
    };

    this.colors = {
      html: {
        tag: '#e06c75',
        attribute: '#d19a66',
        comment: '#5c6370',
        doctype: '#c678dd'
      },
      css: {
        selector: '#e06c75',
        property: '#61afef',
        value: '#98c379',
        comment: '#5c6370',
        atRule: '#c678dd'
      },
      javascript: {
        keyword: '#c678dd',
        string: '#98c379',
        number: '#d19a66',
        function: '#61afef',
        comment: '#5c6370',
        operator: '#56b6c2'
      }
    };
  }

  highlight(code, language) {
    if (!code || !this.rules[language]) {
      return code;
    }

    let highlightedCode = code;

    // Escape HTML entities first
    highlightedCode = this.escapeHtml(highlightedCode);

    // Apply syntax highlighting rules
    const rules = this.rules[language];
    const colors = this.colors[language];

    Object.keys(rules).forEach(ruleName => {
      const regex = rules[ruleName];
      const color = colors[ruleName];

      highlightedCode = highlightedCode.replace(regex, (match, ...groups) => {
        // For complex matches with capture groups, use the appropriate group
        const highlightText = groups.length > 1 && groups[1] !== undefined ? groups[1] : match;
        return `<span style="color: ${color}">${this.escapeHtml(highlightText)}</span>`;
      });
    });

    return highlightedCode;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  applyHighlighting(textarea, language) {
    const code = textarea.value;
    const highlighted = this.highlight(code, language);

    // Create a pre element to show highlighted code
    const pre = document.createElement('pre');
    pre.className = 'syntax-highlighted';
    pre.innerHTML = highlighted;
    pre.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: ${textarea.style.padding || '1rem'};
      border: none;
      background: transparent;
      color: inherit;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      pointer-events: none;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      z-index: 1;
    `;

    // Position textarea over the pre element
    textarea.style.cssText += `
      position: relative;
      background: transparent;
      color: transparent;
      caret-color: #e2e8f0;
      z-index: 2;
    `;

    // Insert pre element before textarea
    textarea.parentNode.insertBefore(pre, textarea);

    // Sync scrolling
    const syncScroll = () => {
      pre.scrollTop = textarea.scrollTop;
      pre.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener('scroll', syncScroll);
    textarea.addEventListener('input', () => {
      syncScroll();
      this.updateHighlighting(textarea, pre, language);
    });

    // Initial highlighting
    this.updateHighlighting(textarea, pre, language);
  }

  updateHighlighting(textarea, preElement, language) {
    const code = textarea.value;
    const highlighted = this.highlight(code, language);
    preElement.innerHTML = highlighted;
  }

  removeHighlighting(textarea) {
    const pre = textarea.previousElementSibling;
    if (pre && pre.className === 'syntax-highlighted') {
      pre.remove();
    }

    // Reset textarea styles
    textarea.style.cssText = textarea.style.cssText.replace(/position: relative;|background: transparent;|color: transparent;|caret-color: [^;]+;|z-index: 2;/g, '');
  }
}

// Initialize syntax highlighter
const syntaxHighlighter = new SyntaxHighlighter();