/**
 * Error Handler for KidLearner
 * Provides centralized error handling and user-friendly error messages
 */
class ErrorHandler {
  static handle(error, context = 'general') {
    console.error(`Error in ${context}:`, error);

    // Categorize error types
    const errorType = this.categorizeError(error);

    // Show appropriate user message
    const userMessage = this.getUserMessage(errorType, error);
    this.showErrorToast(userMessage, errorType);

    // Log for debugging (in production, send to error tracking service)
    this.logError(error, context, errorType);

    return errorType;
  }

  static categorizeError(error) {
    if (error.name === 'TypeError') return 'type';
    if (error.name === 'ReferenceError') return 'reference';
    if (error.name === 'SyntaxError') return 'syntax';
    if (error.message && error.message.includes('fetch')) return 'network';
    if (error.message && error.message.includes('Ollama')) return 'ai';
    if (error.message && error.message.includes('localStorage')) return 'storage';
    return 'general';
  }

  static getUserMessage(errorType, error) {
    const messages = {
      type: 'Something went wrong with the data type. Please try again.',
      reference: 'A required component is missing. Please refresh the page.',
      syntax: 'There\'s a code syntax issue. Please check your code.',
      network: 'Network connection issue. Please check your internet connection.',
      ai: 'AI assistant is temporarily unavailable. Please try again later.',
      storage: 'Unable to save your progress. Please check your browser settings.',
      general: 'An unexpected error occurred. Please try again.'
    };

    return messages[errorType] || messages.general;
  }

  static showErrorToast(message, type = 'error') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `error-toast error-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);

    // Add CSS if not already present
    if (!document.getElementById('error-toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'error-toast-styles';
      styles.textContent = `
        .error-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          min-width: 300px;
          max-width: 500px;
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease;
        }

        .error-error {
          background: #fee;
          border-left: 4px solid #e74c3c;
        }

        .error-warning {
          background: #fff3cd;
          border-left: 4px solid #f39c12;
        }

        .error-info {
          background: #d1ecf1;
          border-left: 4px solid #17a2b8;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }

        .toast-content i {
          font-size: 18px;
          flex-shrink: 0;
        }

        .error-error .toast-content i { color: #e74c3c; }
        .error-warning .toast-content i { color: #f39c12; }
        .error-info .toast-content i { color: #17a2b8; }

        .toast-content span {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }

        .toast-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .toast-close:hover {
          opacity: 1;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .error-toast {
            left: 10px;
            right: 10px;
            min-width: auto;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  static logError(error, context, type) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      type,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store in localStorage for debugging (in production, send to server)
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      logs.push(errorLog);
      // Keep only last 50 errors
      if (logs.length > 50) logs.shift();
      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log error:', e);
    }

    console.error('Error logged:', errorLog);
  }

  static getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch (e) {
      return [];
    }
  }

  static clearErrorLogs() {
    localStorage.removeItem('error_logs');
  }

  // Wrap async functions with error handling
  static async withErrorHandling(fn, context = 'async') {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      throw error; // Re-throw for caller to handle if needed
    }
  }

  // Wrap regular functions with error handling
  static withErrorHandlingSync(fn, context = 'sync') {
    try {
      return fn();
    } catch (error) {
      this.handle(error, context);
      throw error;
    }
  }
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  ErrorHandler.handle(event.error, 'global');
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handle(new Error(event.reason), 'promise');
});