/**
 * Error Boundary Module
 * Provides comprehensive error handling and recovery mechanisms
 */
class ErrorBoundary {
  constructor() {
    this.errorCount = 0;
    this.maxErrors = 5;
    this.errorResetTime = 5 * 60 * 1000; // 5 minutes
    this.lastErrorTime = 0;
  }

  /**
   * Initialize error boundary
   */
  init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error, event.message, event.filename, event.lineno, event.colno);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event.reason);
    });

    // Handle page visibility changes to clear errors when user returns
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.resetErrorCount();
      }
    });

    console.log('Error boundary initialized');
  }

  /**
   * Handle global JavaScript errors
   */
  handleGlobalError(error, message, filename, lineno, colno) {
    this.errorCount++;

    const errorInfo = {
      message: message || error?.message,
      stack: error?.stack,
      filename,
      lineno,
      colno,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Global error caught:', errorInfo);

    // Check if we're hitting error limits
    if (this.errorCount >= this.maxErrors) {
      this.handleCriticalError(errorInfo);
      return;
    }

    // Show user-friendly error message
    this.showUserError(errorInfo);

    // Report error (in production, this would send to error reporting service)
    this.reportError(errorInfo);
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(reason) {
    console.error('Unhandled promise rejection:', reason);

    const errorInfo = {
      message: reason?.message || 'Unhandled promise rejection',
      stack: reason?.stack,
      timestamp: new Date().toISOString(),
      type: 'promise_rejection'
    };

    this.showUserError(errorInfo);
    this.reportError(errorInfo);
  }

  /**
   * Handle critical errors (too many errors)
   */
  handleCriticalError(errorInfo) {
    // Show critical error overlay
    this.showCriticalErrorOverlay();

    // Disable problematic features
    this.disableFeatures();

    // Log critical error
    console.error('Critical error threshold reached:', errorInfo);
  }

  /**
   * Show user-friendly error message
   */
  showUserError(errorInfo) {
    let message = 'An unexpected error occurred. ';

    if (errorInfo.message?.includes('fetch')) {
      message += 'Please check your internet connection.';
    } else if (errorInfo.message?.includes('script')) {
      message += 'Some features may not work properly.';
    } else {
      message += 'Please try refreshing the page.';
    }

    uiManager.showError(message, () => window.location.reload());
  }

  /**
   * Show critical error overlay
   */
  showCriticalErrorOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'critical-error-overlay';
    overlay.innerHTML = `
      <div class="critical-error-modal">
        <div class="critical-error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h2>Something went wrong</h2>
          <p>We've encountered multiple errors. Please refresh the page to continue.</p>
          <button onclick="window.location.reload()" class="btn btn-primary">
            <i class="fas fa-refresh"></i> Refresh Page
          </button>
        </div>
      </div>
    `;

    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Disable problematic features
   */
  disableFeatures() {
    // Disable auto-run
    if (window.autoRunEnabled) {
      window.autoRunEnabled = false;
    }

    // Clear any pending requests
    if (window.apiService) {
      window.apiService.clearCache();
    }

    // Disable AI assistant
    if (window.aiAssistant) {
      window.aiAssistant = null;
    }
  }

  /**
   * Report error (placeholder for error reporting service)
   */
  reportError(errorInfo) {
    // In production, send to error reporting service like Sentry, LogRocket, etc.
    if (CONFIG.DEBUG_MODE) {
      console.log('Error reported:', errorInfo);
    }

    // Store error in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push(errorInfo);
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.shift();
      }
      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Reset error count
   */
  resetErrorCount() {
    const now = Date.now();
    if (now - this.lastErrorTime > this.errorResetTime) {
      this.errorCount = 0;
      this.lastErrorTime = now;
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      count: this.errorCount,
      maxErrors: this.maxErrors,
      lastErrorTime: this.lastErrorTime
    };
  }

  /**
   * Safe function execution wrapper
   */
  safeExecute(fn, fallback = null, context = null) {
    try {
      return fn.call(context);
    } catch (error) {
      console.error('Safe execute error:', error);
      this.handleGlobalError(error);
      return fallback;
    }
  }

  /**
   * Safe async function execution wrapper
   */
  async safeExecuteAsync(fn, fallback = null, context = null) {
    try {
      return await fn.call(context);
    } catch (error) {
      console.error('Safe execute async error:', error);
      this.handleGlobalError(error);
      return fallback;
    }
  }
}

// Create global error boundary instance
const errorBoundary = new ErrorBoundary();
window.errorBoundary = errorBoundary;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  errorBoundary.init();
});