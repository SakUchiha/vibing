// Configuration file for KidLearner application
const CONFIG = {
  // API endpoints - configurable based on environment
  API_BASE_URL: (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? `http://${window.location.hostname}:4000`
    : window.location.origin),
  API_BASE_URL_ALT: (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? `http://${window.location.hostname}:4001`
    : window.location.origin),
  FRONTEND_BASE_URL: window.location.origin,

  // Feature flags
  ENABLE_AI_ASSISTANT: true,
  ENABLE_PROGRESS_TRACKING: true,
  ENABLE_AUTO_RUN: true,

  // UI settings
  DEFAULT_THEME: 'light',
  MAX_CHAT_HISTORY: 50,

  // Error messages
  MESSAGES: {
    API_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
    NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
    AI_UNAVAILABLE: 'AI assistant is currently unavailable. Please try again later.',
    LESSON_LOAD_ERROR: 'Unable to load lesson. Please try again.',
    VALIDATION_ERROR: 'Code validation failed. Please check your syntax.'
  },

  // Timeouts
  API_TIMEOUT: 10000, // 10 seconds
  AUTO_RUN_DEBOUNCE: 1000, // 1 second

  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  // Development settings
  DEBUG_MODE: window.location.hostname === 'localhost'
};

// Make config globally available
window.CONFIG = CONFIG;