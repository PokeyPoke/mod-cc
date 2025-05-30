// API Client

class ApiClient {
  constructor() {
    this.baseUrl = '/api/v1';
    this.token = Storage.get('auth_token');
    this.refreshToken = Storage.get('refresh_token');
  }

  // Set authorization headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Handle API response
  async handleResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshAuthToken();
        if (refreshed) {
          // Retry the original request would need to be implemented
          // For now, redirect to login
          this.logout();
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      }
      
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.auth !== false),
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false
    });

    this.token = data.token;
    this.refreshToken = data.refreshToken;
    
    Storage.set('auth_token', this.token);
    Storage.set('refresh_token', this.refreshToken);
    Storage.set('user', data.user);

    return data;
  }

  async register(email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: { email, password },
      auth: false
    });

    this.token = data.token;
    this.refreshToken = data.refreshToken;
    
    Storage.set('auth_token', this.token);
    Storage.set('refresh_token', this.refreshToken);
    Storage.set('user', data.user);

    return data;
  }

  async refreshAuthToken() {
    try {
      const data = await this.request('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: this.refreshToken },
        auth: false
      });

      this.token = data.token;
      this.refreshToken = data.refreshToken;
      
      Storage.set('auth_token', this.token);
      Storage.set('refresh_token', this.refreshToken);

      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  logout() {
    this.token = null;
    this.refreshToken = null;
    Storage.remove('auth_token');
    Storage.remove('refresh_token');
    Storage.remove('user');
    window.location.href = '/';
  }

  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    return Storage.get('user');
  }

  // Module methods
  async getModules() {
    return await this.request('/modules/list');
  }

  async createModule(type, config = {}) {
    return await this.request('/modules/create', {
      method: 'POST',
      body: { type, config }
    });
  }

  async getModuleData(moduleId) {
    return await this.request(`/modules/${moduleId}/data`);
  }

  async updateModuleConfig(moduleId, config) {
    return await this.request(`/modules/${moduleId}/config`, {
      method: 'PUT',
      body: { config }
    });
  }

  async deleteModule(moduleId) {
    return await this.request(`/modules/${moduleId}`, {
      method: 'DELETE'
    });
  }

  // Device methods
  async getDevices() {
    return await this.request('/devices/list');
  }

  async registerDevice(name, type) {
    return await this.request('/devices/register', {
      method: 'POST',
      body: { name, type }
    });
  }

  async updateDevice(deviceId, data) {
    return await this.request(`/devices/${deviceId}`, {
      method: 'PUT',
      body: data
    });
  }

  async deleteDevice(deviceId) {
    return await this.request(`/devices/${deviceId}`, {
      method: 'DELETE'
    });
  }

  // Layout methods
  async getLayout(deviceType) {
    return await this.request(`/layouts/${deviceType}`);
  }

  async saveLayout(deviceType, layoutData) {
    return await this.request(`/layouts/${deviceType}`, {
      method: 'PUT',
      body: { layoutData }
    });
  }

  // Settings methods
  async getSettings() {
    return await this.request('/settings');
  }

  async updateSettings(settings) {
    return await this.request('/settings', {
      method: 'PUT',
      body: settings
    });
  }

  async getApiKeys() {
    return await this.request('/settings/api-keys');
  }

  async addApiKey(service, apiKey) {
    return await this.request('/settings/api-keys', {
      method: 'POST',
      body: { service, api_key: apiKey }
    });
  }

  async deleteApiKey(service) {
    return await this.request(`/settings/api-keys/${service}`, {
      method: 'DELETE'
    });
  }

  async getSubscription() {
    return await this.request('/settings/subscription');
  }

  async updateSubscription(level) {
    return await this.request('/settings/subscription', {
      method: 'POST',
      body: { level }
    });
  }

  // System methods
  async getSystemStatus() {
    return await this.request('/system/status', { auth: false });
  }
}

// Create global API instance
window.api = new ApiClient();

// Auth guard for protected pages
function requireAuth() {
  if (!api.isAuthenticated()) {
    window.location.href = '/';
    return false;
  }
  return true;
}

// Redirect if already authenticated (for auth pages)
function redirectIfAuthenticated() {
  if (api.isAuthenticated()) {
    window.location.href = '/dashboard';
    return true;
  }
  return false;
}

// Export for use in other scripts
window.requireAuth = requireAuth;
window.redirectIfAuthenticated = redirectIfAuthenticated;