/**
 * API Service Module
 * Centralized API communication with error handling and caching
 */
class APIService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Make an API request with caching and error handling
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}, useCache = true) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}-${url}`;

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    const requestPromise = fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    .then(async response => {
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful GET requests
      if (useCache && (!options.method || options.method === 'GET')) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    })
    .catch(error => {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    })
    .finally(() => {
      this.pendingRequests.delete(cacheKey);
    });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise} Response data
   */
  get(endpoint, useCache = true) {
    return this.request(endpoint, { method: 'GET' }, useCache);
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise} Response data
   */
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }, false);
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise} Response data
   */
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, false);
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} Response data
   */
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' }, false);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Check if API is available
   * @returns {Promise<boolean>} API availability
   */
  async checkAvailability() {
    try {
      await this.get('/api/lessons', false);
      return true;
    } catch (error) {
      console.warn('API availability check failed:', error);
      return false;
    }
  }
}

// Create global API service instance
const apiService = new APIService();
window.apiService = apiService;