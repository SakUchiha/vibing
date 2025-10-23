/**
 * UI Utilities Module
 * Handles loading states, notifications, and common UI interactions
 */
class UIManager {
  constructor() {
    this.loadingElements = new Set();
    this.notifications = [];
  }

  /**
   * Show loading state for an element
   * @param {string} elementId - Element ID to show loading for
   * @param {string} message - Loading message
   */
  showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Prevent multiple loading states
    if (this.loadingElements.has(elementId)) return;
    this.loadingElements.add(elementId);

    const originalContent = element.innerHTML;
    element.setAttribute('data-original-content', originalContent);

    element.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span>${message}</span>
      </div>
    `;

    element.classList.add('loading');
  }

  /**
   * Hide loading state for an element
   * @param {string} elementId - Element ID to hide loading for
   */
  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (!this.loadingElements.has(elementId)) return;
    this.loadingElements.delete(elementId);

    const originalContent = element.getAttribute('data-original-content');
    if (originalContent !== null) {
      element.innerHTML = originalContent;
      element.removeAttribute('data-original-content');
    }

    element.classList.remove('loading');
  }

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notification of same type if any
    this.notifications = this.notifications.filter(n => n.type !== type || n.element);

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="uiManager.hideNotification(this)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Add to notifications container
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Store notification info
    const notificationInfo = {
      element: notification,
      type,
      timeout: setTimeout(() => this.hideNotification(notification), duration)
    };
    this.notifications.push(notificationInfo);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
  }

  /**
   * Hide a notification
   * @param {HTMLElement} notificationElement - Notification element to hide
   */
  hideNotification(notificationElement) {
    const notificationInfo = this.notifications.find(n => n.element === notificationElement);
    if (notificationInfo) {
      clearTimeout(notificationInfo.timeout);
      this.notifications = this.notifications.filter(n => n !== notificationInfo);
    }

    notificationElement.classList.remove('show');
    setTimeout(() => {
      if (notificationElement.parentNode) {
        notificationElement.parentNode.removeChild(notificationElement);
      }
    }, 300);
  }

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Icon class
   */
  getNotificationIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  /**
   * Show error message with retry option
   * @param {string} message - Error message
   * @param {Function} retryCallback - Retry callback function
   */
  showError(message, retryCallback = null) {
    let html = `<div class="error-message">${message}</div>`;
    if (retryCallback) {
      html += `<button class="retry-btn" onclick="(${retryCallback.toString()})()">Try Again</button>`;
    }
    this.showNotification(html, 'error', 10000);
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Toggle element visibility
   * @param {string} elementId - Element ID
   * @param {boolean} show - Whether to show or hide
   */
  toggleVisibility(elementId, show = null) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (show === null) {
      show = element.style.display === 'none';
    }

    element.style.display = show ? 'block' : 'none';
  }

  /**
   * Smooth scroll to element
   * @param {string} elementId - Element ID to scroll to
   */
  scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Enable/disable button with loading state
   * @param {string} buttonId - Button element ID
   * @param {boolean} disabled - Whether to disable
   * @param {string} loadingText - Loading text
   */
  setButtonLoading(buttonId, disabled = true, loadingText = 'Loading...') {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.disabled = disabled;

    if (disabled) {
      const originalText = button.textContent;
      button.setAttribute('data-original-text', originalText);
      button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
      const originalText = button.getAttribute('data-original-text');
      if (originalText) {
        button.textContent = originalText;
        button.removeAttribute('data-original-text');
      }
    }
  }

  /**
   * Clear all loading states
   */
  clearAllLoading() {
    this.loadingElements.forEach(elementId => {
      this.hideLoading(elementId);
    });
    this.loadingElements.clear();
  }

  /**
   * Initialize UI components
   */
  init() {
    // Add notification styles if not present
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 400px;
        }
        .notification {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin-bottom: 10px;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          border-left: 4px solid;
        }
        .notification.show {
          transform: translateX(0);
        }
        .notification-success { border-left-color: #28a745; }
        .notification-error { border-left-color: #dc3545; }
        .notification-warning { border-left-color: #ffc107; }
        .notification-info { border-left-color: #17a2b8; }
        .notification-content {
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .notification-close {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 0;
          margin-left: auto;
        }
        .loading-spinner {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          padding: 20px;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .error-message {
          color: #dc3545;
          font-weight: 500;
        }
        .retry-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 10px;
        }
      `;
      document.head.appendChild(styles);
    }
  }
}

// Create global UI manager instance
const uiManager = new UIManager();
window.uiManager = uiManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  uiManager.init();
});