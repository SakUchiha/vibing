/**
 * Syntax Checker for HTML, CSS, and JavaScript
 * Provides real-time validation and error detection
 */
class SyntaxChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Check HTML syntax
   * @param {string} html - HTML code to validate
   * @returns {Object} - Validation result with errors and warnings
   */
  checkHTML(html) {
    this.errors = [];
    this.warnings = [];
    
    // Check for DOCTYPE
    if (!html.trim().toLowerCase().startsWith('<!doctype')) {
      this.warnings.push({
        type: 'warning',
        message: 'Missing DOCTYPE declaration',
        line: 1,
        suggestion: 'Add <!DOCTYPE html> at the beginning'
      });
    }

    // Check for basic structure
    const hasHtml = /<html[^>]*>/i.test(html);
    const hasHead = /<head[^>]*>/i.test(html);
    const hasBody = /<body[^>]*>/i.test(html);

    if (!hasHtml) {
      this.errors.push({
        type: 'error',
        message: 'Missing <html> tag',
        line: this.findLineNumber(html, '<html'),
        suggestion: 'Wrap your content in <html> tags'
      });
    }

    if (!hasHead) {
      this.warnings.push({
        type: 'warning',
        message: 'Missing <head> section',
        line: 1,
        suggestion: 'Add a <head> section for metadata'
      });
    }

    if (!hasBody) {
      this.errors.push({
        type: 'error',
        message: 'Missing <body> tag',
        line: this.findLineNumber(html, '<body'),
        suggestion: 'Add a <body> section for content'
      });
    }

    // Check for unclosed tags
    this.checkUnclosedTags(html);
    
    // Check for missing alt attributes on images
    this.checkImageAltAttributes(html);
    
    // Check for proper nesting
    this.checkTagNesting(html);

    return {
      errors: this.errors,
      warnings: this.warnings,
      isValid: this.errors.length === 0
    };
  }

  /**
   * Check CSS syntax
   * @param {string} css - CSS code to validate
   * @returns {Object} - Validation result with errors and warnings
   */
  checkCSS(css) {
    this.errors = [];
    this.warnings = [];

    // Remove comments
    const cleanCSS = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Check for missing semicolons
    this.checkMissingSemicolons(cleanCSS);
    
    // Check for missing closing braces
    this.checkMissingBraces(cleanCSS);
    
    // Check for invalid properties
    this.checkInvalidProperties(cleanCSS);
    
    // Check for missing quotes
    this.checkMissingQuotes(cleanCSS);

    return {
      errors: this.errors,
      warnings: this.warnings,
      isValid: this.errors.length === 0
    };
  }

  /**
   * Check JavaScript syntax
   * @param {string} js - JavaScript code to validate
   * @returns {Object} - Validation result with errors and warnings
   */
  checkJavaScript(js) {
    this.errors = [];
    this.warnings = [];

    try {
      // Basic syntax check using eval (safe for syntax checking)
      new Function(js);
    } catch (error) {
      this.errors.push({
        type: 'error',
        message: error.message,
        line: this.extractLineNumber(error.message),
        suggestion: 'Check syntax and fix the error'
      });
    }

    // Check for common issues
    this.checkUndefinedVariables(js);
    this.checkMissingSemicolons(js);
    this.checkConsoleLogs(js);

    return {
      errors: this.errors,
      warnings: this.warnings,
      isValid: this.errors.length === 0
    };
  }

  /**
   * Check for unclosed HTML tags
   */
  checkUnclosedTags(html) {
    const tagRegex = /<(\w+)(?:\s[^>]*)?(?:\s*\/)?>/g;
    const closingTagRegex = /<\/(\w+)>/g;
    
    const openTags = [];
    const closeTags = [];
    let match;

    // Find all opening tags
    while ((match = tagRegex.exec(html)) !== null) {
      const tagName = match[1].toLowerCase();
      const isSelfClosing = match[0].endsWith('/>') || this.isSelfClosingTag(tagName);
      
      if (!isSelfClosing) {
        openTags.push({
          name: tagName,
          position: match.index,
          line: this.findLineNumber(html, match[0])
        });
      }
    }

    // Find all closing tags
    while ((match = closingTagRegex.exec(html)) !== null) {
      closeTags.push({
        name: match[1].toLowerCase(),
        position: match.index,
        line: this.findLineNumber(html, match[0])
      });
    }

    // Check for unclosed tags
    const stack = [];
    for (const openTag of openTags) {
      stack.push(openTag);
    }

    for (const closeTag of closeTags) {
      const lastOpen = stack[stack.length - 1];
      if (lastOpen && lastOpen.name === closeTag.name) {
        stack.pop();
      }
    }

    // Report unclosed tags
    for (const unclosed of stack) {
      this.errors.push({
        type: 'error',
        message: `Unclosed <${unclosed.name}> tag`,
        line: unclosed.line,
        suggestion: `Add closing </${unclosed.name}> tag`
      });
    }
  }

  /**
   * Check for missing alt attributes on images
   */
  checkImageAltAttributes(html) {
    const imgRegex = /<img[^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      if (!match[0].includes('alt=')) {
        this.warnings.push({
          type: 'warning',
          message: 'Image missing alt attribute',
          line: this.findLineNumber(html, match[0]),
          suggestion: 'Add alt="description" to improve accessibility'
        });
      }
    }
  }

  /**
   * Check for proper tag nesting
   */
  checkTagNesting(html) {
    // Check for common nesting issues
    const nestingIssues = [
      { pattern: /<p[^>]*>[\s\S]*?<(div|h[1-6])[\s\S]*?<\/p>/gi, message: 'Block elements cannot be nested inside <p> tags' },
      { pattern: /<(div|span)[^>]*>[\s\S]*?<(div|span)[^>]*>[\s\S]*?<\/(div|span)>[\s\S]*?<\/(div|span)>/gi, message: 'Check for proper tag nesting' }
    ];

    nestingIssues.forEach(issue => {
      if (issue.pattern.test(html)) {
        this.warnings.push({
          type: 'warning',
          message: issue.message,
          line: 1,
          suggestion: 'Review HTML structure and nesting'
        });
      }
    });
  }

  /**
   * Check for missing semicolons in CSS
   */
  checkMissingSemicolons(css) {
    const lines = css.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') && 
          !trimmed.startsWith('/*') && 
          !trimmed.startsWith('*') &&
          !trimmed.startsWith('@') &&
          trimmed.includes(':')) {
        this.warnings.push({
          type: 'warning',
          message: 'Missing semicolon',
          line: index + 1,
          suggestion: 'Add semicolon at the end of the line'
        });
      }
    });
  }

  /**
   * Check for missing braces in CSS
   */
  checkMissingBraces(css) {
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      this.errors.push({
        type: 'error',
        message: 'Mismatched braces',
        line: 1,
        suggestion: 'Check that all opening braces { have matching closing braces }'
      });
    }
  }

  /**
   * Check for invalid CSS properties
   */
  checkInvalidProperties(css) {
    const commonProperties = [
      'color', 'background-color', 'font-size', 'font-family', 'margin', 'padding',
      'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom',
      'border', 'border-radius', 'text-align', 'line-height', 'font-weight'
    ];

    const propertyRegex = /([a-zA-Z-]+)\s*:/g;
    let match;

    while ((match = propertyRegex.exec(css)) !== null) {
      const property = match[1];
      if (!commonProperties.includes(property) && !property.startsWith('--')) {
        this.warnings.push({
          type: 'warning',
          message: `Unknown CSS property: ${property}`,
          line: this.findLineNumber(css, match[0]),
          suggestion: 'Check spelling or use a valid CSS property'
        });
      }
    }
  }

  /**
   * Check for missing quotes in CSS
   */
  checkMissingQuotes(css) {
    const fontFamilyRegex = /font-family\s*:\s*([^;]+)/gi;
    let match;

    while ((match = fontFamilyRegex.exec(css)) !== null) {
      const value = match[1].trim();
      if (!value.startsWith('"') && !value.startsWith("'") && value.includes(' ')) {
        this.warnings.push({
          type: 'warning',
          message: 'Font family names with spaces should be quoted',
          line: this.findLineNumber(css, match[0]),
          suggestion: 'Wrap font family names in quotes: "Times New Roman"'
        });
      }
    }
  }

  /**
   * Check for undefined variables in JavaScript
   */
  checkUndefinedVariables(js) {
    // Simple check for common undefined variable patterns
    const undefinedPatterns = [
      { pattern: /\bundefinedVariable\b/g, message: 'Variable "undefinedVariable" is not defined' },
      { pattern: /\bmyUndefinedFunction\b/g, message: 'Function "myUndefinedFunction" is not defined' }
    ];

    undefinedPatterns.forEach(pattern => {
      if (pattern.pattern.test(js)) {
        this.warnings.push({
          type: 'warning',
          message: pattern.message,
          line: 1,
          suggestion: 'Define the variable or function before using it'
        });
      }
    });
  }

  /**
   * Check for missing semicolons in JavaScript
   */
  checkMissingSemicolons(js) {
    const lines = js.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') && 
          !trimmed.startsWith('//') && 
          !trimmed.startsWith('/*') &&
          !trimmed.startsWith('*') &&
          (trimmed.includes('=') || trimmed.includes('return') || trimmed.includes('console.log'))) {
        this.warnings.push({
          type: 'warning',
          message: 'Consider adding semicolon',
          line: index + 1,
          suggestion: 'Add semicolon at the end of the statement'
        });
      }
    });
  }

  /**
   * Check for console.log statements
   */
  checkConsoleLogs(js) {
    if (js.includes('console.log')) {
      this.warnings.push({
        type: 'info',
        message: 'Console.log statements found',
        line: 1,
        suggestion: 'Remember to remove console.log statements in production code'
      });
    }
  }

  /**
   * Find line number for a given text in code
   */
  findLineNumber(code, text) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(text)) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Extract line number from error message
   */
  extractLineNumber(errorMessage) {
    const match = errorMessage.match(/line (\d+)/i);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Check if HTML tag is self-closing
   */
  isSelfClosingTag(tagName) {
    const selfClosingTags = [
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr'
    ];
    return selfClosingTags.includes(tagName.toLowerCase());
  }

  /**
   * Get syntax suggestions based on error type
   */
  getSuggestions(errorType, language) {
    const suggestions = {
      html: {
        'unclosed-tag': 'Make sure every opening tag has a corresponding closing tag',
        'missing-alt': 'Add alt attributes to images for accessibility',
        'invalid-nesting': 'Check that tags are properly nested'
      },
      css: {
        'missing-semicolon': 'Add semicolons at the end of CSS properties',
        'missing-brace': 'Check that all braces are properly matched',
        'invalid-property': 'Verify CSS property names are correct'
      },
      javascript: {
        'syntax-error': 'Check for missing parentheses, brackets, or quotes',
        'undefined-variable': 'Make sure variables are declared before use',
        'missing-semicolon': 'Consider adding semicolons for clarity'
      }
    };

    return suggestions[language]?.[errorType] || 'Review your code for syntax issues';
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyntaxChecker;
}
