/**
 * Main Application Module
 * Initializes and coordinates all application components
 */
class KidLearnerApp {
  constructor() {
    this.initialized = false;
    this.components = new Map();
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;

    try {
      console.log('Initializing KidLearner application...');

      // Initialize core components in order
      await this.initConfig();
      await this.initErrorBoundary();
      await this.initAPI();
      await this.initUI();
      await this.initComponents();

      // Check API availability
      await this.checkAPIHealth();

      // Mark as initialized
      this.initialized = true;

      console.log('KidLearner application initialized successfully');

      // Show welcome message
      uiManager.showSuccess('Application loaded successfully!');

    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.handleInitError(error);
    }
  }

  /**
   * Initialize configuration
   */
  async initConfig() {
    // Config is already loaded globally
    if (!window.CONFIG) {
      throw new Error('Configuration not loaded');
    }
    console.log('Configuration loaded');
  }

  /**
   * Initialize error boundary
   */
  async initErrorBoundary() {
    if (!window.errorBoundary) {
      throw new Error('Error boundary not loaded');
    }
    // Error boundary initializes itself
    console.log('Error boundary initialized');
  }

  /**
   * Initialize API service
   */
  async initAPI() {
    if (!window.apiService) {
      throw new Error('API service not loaded');
    }
    console.log('API service initialized');
  }

  /**
   * Initialize UI manager
   */
  async initUI() {
    if (!window.uiManager) {
      throw new Error('UI manager not loaded');
    }
    // UI manager initializes itself
    console.log('UI manager initialized');
  }

  /**
   * Initialize page-specific components
   */
  async initComponents() {
    const page = this.getCurrentPage();

    switch (page) {
      case 'index':
        // Home page - no special components needed
        break;

      case 'lessons':
        // Lessons page - initialize lesson loading
        if (typeof loadLessons === 'function') {
          loadLessons();
        }
        break;

      case 'editor':
        // Editor page - editor initializes itself
        break;

      case 'ai':
        // AI page - AI assistant initializes itself
        break;

      case 'study-guide':
        // Study guide - no special initialization needed
        break;

      case 'lesson-viewer':
        // Lesson viewer - may need lesson loading
        break;
    }

    console.log(`Components initialized for page: ${page}`);
  }

  /**
   * Check API health
   */
  async checkAPIHealth() {
    try {
      const isHealthy = await apiService.checkAvailability();
      if (!isHealthy) {
        uiManager.showNotification(
          'Backend service is not available. Some features may not work properly.',
          'warning'
        );
      }
    } catch (error) {
      console.warn('API health check failed:', error);
      uiManager.showNotification(
        'Unable to connect to backend services. Please check your connection.',
        'warning'
      );
    }
  }

  /**
   * Get current page based on URL
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';

    // Map filenames to page types
    const pageMap = {
      'index.html': 'index',
      'lessons.html': 'lessons',
      'editor.html': 'editor',
      'ai.html': 'ai',
      'study-guide.html': 'study-guide',
      'lesson-viewer.html': 'lesson-viewer'
    };

    return pageMap[filename] || 'unknown';
  }

  /**
   * Handle initialization errors
   */
  handleInitError(error) {
    console.error('Application initialization failed:', error);

    // Show critical error message
    const errorMessage = `
      <div style="text-align: center; padding: 20px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
        <h2>Application Failed to Load</h2>
        <p>Sorry, we encountered an error while loading the application.</p>
        <p><strong>Error:</strong> ${error.message}</p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
          <i class="fas fa-refresh"></i> Reload Application
        </button>
      </div>
    `;

    // Try to show error in UI, fallback to alert
    if (window.uiManager) {
      uiManager.showNotification(errorMessage, 'error', 0);
    } else {
      alert('Application failed to load. Please refresh the page.');
    }
  }

  /**
   * Register a component
   */
  registerComponent(name, component) {
    this.components.set(name, component);
  }

  /**
   * Get a registered component
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Check if application is ready
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Get application info
   */
  getInfo() {
    return {
      version: '1.0.0',
      initialized: this.initialized,
      page: this.getCurrentPage(),
      config: CONFIG,
      components: Array.from(this.components.keys())
    };
  }
}

// Create global application instance
const kidLearnerApp = new KidLearnerApp();
window.kidLearnerApp = kidLearnerApp;

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  kidLearnerApp.init();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KidLearnerApp;
}