// Dashboard Management

class DashboardManager {
  constructor() {
    this.grid = null;
    this.modules = new Map();
    this.currentDevice = 'web';
    this.moduleTypes = {
      weather: WeatherModule,
      notes: NotesModule,
      todo: TodoModule,
      countdown: CountdownModule,
      links: LinksModule,
      custom: CustomModule
    };
    
    this.init();
  }

  async init() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Initialize GridStack
    this.initGridStack();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Sync theme with user settings
    await themeManager.syncWithSettings();
    
    // Load dashboard
    await this.loadDashboard();
  }

  initGridStack() {
    this.grid = GridStack.init({
      cellHeight: 80,
      verticalMargin: 10,
      animate: true,
      resizable: {
        handles: 'se'
      },
      draggable: {
        handle: '.module-header'
      }
    });

    // Save layout on change
    this.grid.on('change', debounce(() => {
      this.saveLayout();
    }, 1000));
  }

  setupEventListeners() {
    // Device selector
    document.querySelectorAll('.device-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const device = e.target.dataset.device;
        this.switchDevice(device);
      });
    });

    // Add module button
    document.getElementById('add-module-btn')?.addEventListener('click', () => {
      this.showAddModuleModal();
    });

    document.getElementById('add-first-module')?.addEventListener('click', () => {
      this.showAddModuleModal();
    });

    // Settings button
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.showSettingsModal();
    });

    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.logout();
    });

    // Modal event handlers
    document.querySelectorAll('.module-type').forEach(type => {
      type.addEventListener('click', (e) => {
        const moduleType = e.currentTarget.dataset.type;
        this.createModule(moduleType);
      });
    });

    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;
        this.switchSettingsTab(targetTab);
      });
    });

    // Add API key button
    document.getElementById('add-api-key')?.addEventListener('click', () => {
      this.addApiKey();
    });
  }

  async loadDashboard() {
    try {
      Loading.show();

      // Load modules from API
      const modules = await api.getModules();
      
      // Load layout for current device
      const layoutData = await this.loadLayout();
      
      // Clear existing grid
      this.grid.removeAll();
      this.modules.clear();

      if (modules.length === 0) {
        this.showEmptyDashboard();
        return;
      }

      // Create module instances and add to grid
      for (const moduleData of modules) {
        this.addModuleToGrid(moduleData, layoutData);
      }

      this.hideEmptyDashboard();

    } catch (error) {
      console.error('Failed to load dashboard:', error);
      Toast.error('Failed to load dashboard');
    } finally {
      Loading.hide();
    }
  }

  addModuleToGrid(moduleData, layoutData = []) {
    // Find layout info for this module
    const layoutInfo = layoutData.find(item => item.id === moduleData.id.toString());
    
    // Create grid item with layout info or defaults
    const gridOptions = {
      id: moduleData.id.toString(),
      w: layoutInfo?.w || 4,
      h: layoutInfo?.h || 3,
      x: layoutInfo?.x || 0,
      y: layoutInfo?.y || 0
    };

    // Create DOM element
    const element = document.createElement('div');
    element.className = 'grid-stack-item';
    element.setAttribute('gs-id', moduleData.id);
    element.setAttribute('gs-w', gridOptions.w);
    element.setAttribute('gs-h', gridOptions.h);
    element.setAttribute('gs-x', gridOptions.x);
    element.setAttribute('gs-y', gridOptions.y);

    const content = document.createElement('div');
    content.className = 'grid-stack-item-content';
    element.appendChild(content);

    // Add to grid
    this.grid.addWidget(element);

    // Create module instance
    const ModuleClass = this.moduleTypes[moduleData.type];
    if (ModuleClass) {
      const moduleInstance = new ModuleClass(moduleData, content);
      this.modules.set(moduleData.id, moduleInstance);
    } else {
      content.innerHTML = `<div class="module-error">Unknown module type: ${moduleData.type}</div>`;
    }
  }

  async createModule(type) {
    try {
      // Check module limits for free users
      const user = api.getCurrentUser();
      if (user?.subscription_level === 'free' && this.modules.size >= 5) {
        Toast.warning('Free tier limited to 5 modules. Upgrade to Premium for unlimited modules.');
        return;
      }

      Loading.show();
      
      // Create module via API
      const moduleData = await api.createModule(type);
      
      // Add to grid
      this.addModuleToGrid(moduleData);
      
      // Hide modals
      Modal.hideAll();
      
      // Hide empty dashboard if showing
      this.hideEmptyDashboard();
      
      Toast.success('Module added successfully');

    } catch (error) {
      console.error('Failed to create module:', error);
      Toast.error(error.message || 'Failed to create module');
    } finally {
      Loading.hide();
    }
  }

  async removeModule(moduleId) {
    // Remove from grid
    const element = document.querySelector(`[gs-id="${moduleId}"]`);
    if (element) {
      this.grid.removeWidget(element);
    }

    // Destroy module instance
    const moduleInstance = this.modules.get(moduleId);
    if (moduleInstance) {
      moduleInstance.destroy();
      this.modules.delete(moduleId);
    }

    // Show empty dashboard if no modules left
    if (this.modules.size === 0) {
      this.showEmptyDashboard();
    }

    // Save layout
    await this.saveLayout();
  }

  async switchDevice(device) {
    if (device === this.currentDevice) return;

    // Save current layout
    await this.saveLayout();

    // Update current device
    this.currentDevice = device;

    // Update UI
    document.querySelectorAll('.device-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.device === device);
    });

    // Reload dashboard for new device
    await this.loadDashboard();

    Toast.info(`Switched to ${device} view`);
  }

  async loadLayout() {
    try {
      const response = await api.getLayout(this.currentDevice);
      return response.layout || [];
    } catch (error) {
      console.error('Failed to load layout:', error);
      return [];
    }
  }

  async saveLayout() {
    try {
      const layoutData = this.grid.save(false);
      await api.saveLayout(this.currentDevice, layoutData);
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  }

  showEmptyDashboard() {
    const emptyElement = document.getElementById('empty-dashboard');
    if (emptyElement) {
      emptyElement.style.display = 'flex';
    }
  }

  hideEmptyDashboard() {
    const emptyElement = document.getElementById('empty-dashboard');
    if (emptyElement) {
      emptyElement.style.display = 'none';
    }
  }

  showAddModuleModal() {
    Modal.show('add-module-modal');
  }

  async showSettingsModal() {
    Modal.show('settings-modal');
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      // Load general settings
      const settings = await api.getSettings();
      const themeSelect = document.getElementById('theme-select');
      if (themeSelect) {
        themeSelect.value = settings.theme || 'light';
      }

      // Load API keys
      await this.loadApiKeys();

      // Load subscription info
      await this.loadSubscription();

    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async loadApiKeys() {
    try {
      const apiKeys = await api.getApiKeys();
      const container = document.querySelector('.api-keys-list');
      
      if (!container) return;

      if (apiKeys.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No API keys configured</p>';
        return;
      }

      container.innerHTML = apiKeys.map(key => `
        <div class="api-key-item">
          <div class="api-key-info">
            <div class="api-key-service">${escapeHtml(key.service)}</div>
            <div class="api-key-date">Added ${DateTime.formatDate(key.created_at)}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="dashboardManager.deleteApiKey('${key.service}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join('');

    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  }

  async loadSubscription() {
    try {
      const subscription = await api.getSubscription();
      const container = document.querySelector('.subscription-info');
      
      if (!container) return;

      container.innerHTML = `
        <div class="subscription-badge ${subscription.level}">
          ${subscription.level.toUpperCase()}
        </div>
        <div class="subscription-features">
          <h4>Features</h4>
          <ul>
            <li><i class="fas fa-check"></i> Modules: ${subscription.features.maxModules}</li>
            <li><i class="fas fa-check"></i> Data refresh: ${subscription.features.dataRefreshInterval}</li>
            <li><i class="fas fa-${subscription.features.iotSupport ? 'check' : 'times'}"></i> IoT device support</li>
            <li><i class="fas fa-check"></i> API key support</li>
          </ul>
          ${subscription.level === 'free' ? `
            <button class="btn btn-primary" onclick="dashboardManager.upgradeToPremium()">
              Upgrade to Premium ($1/month)
            </button>
          ` : ''}
        </div>
      `;

    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  }

  switchSettingsTab(tabName) {
    // Update active tab
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update active panel
    document.querySelectorAll('.settings-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-settings`);
    });
  }

  async addApiKey() {
    const service = prompt('Enter service name (e.g., openweathermap):');
    if (!service) return;

    const apiKey = prompt('Enter API key:');
    if (!apiKey) return;

    try {
      await api.addApiKey(service.toLowerCase(), apiKey);
      await this.loadApiKeys();
      Toast.success('API key added successfully');
    } catch (error) {
      console.error('Failed to add API key:', error);
      Toast.error('Failed to add API key');
    }
  }

  async deleteApiKey(service) {
    if (!confirm(`Delete API key for ${service}?`)) return;

    try {
      await api.deleteApiKey(service);
      await this.loadApiKeys();
      Toast.success('API key deleted');
    } catch (error) {
      console.error('Failed to delete API key:', error);
      Toast.error('Failed to delete API key');
    }
  }

  async upgradeToPremium() {
    try {
      await api.updateSubscription('premium');
      await this.loadSubscription();
      Toast.success('Upgraded to Premium! Enjoy unlimited modules and faster refresh rates.');
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      Toast.error('Failed to upgrade subscription');
    }
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      api.logout();
    }
  }
}

// Initialize dashboard when page loads
ready(() => {
  window.dashboardManager = new DashboardManager();

  // Handle theme changes from settings
  document.getElementById('theme-select')?.addEventListener('change', async (e) => {
    themeManager.applyTheme(e.target.value);
    
    try {
      await themeManager.saveToSettings();
      Toast.success('Theme saved');
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  });
});

// Export for global access
window.DashboardManager = DashboardManager;