// Base Module Class

class BaseModule {
  constructor(moduleData, container) {
    this.id = moduleData.id;
    this.type = moduleData.type;
    this.config = moduleData.config || {};
    this.container = container;
    this.data = null;
    this.refreshInterval = null;
    this.isConfiguring = false;
    
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
    this.startAutoRefresh();
  }

  render() {
    const style = themeManager.getModuleStyle(this.type);
    
    this.container.innerHTML = `
      <div class="module ${this.type}-module" style="background-color: ${style.backgroundColor};">
        <div class="module-header">
          <h3 class="module-title">
            <i class="${this.getIcon()}"></i>
            ${this.getTitle()}
          </h3>
          <div class="module-actions">
            <button class="module-action" data-action="refresh" title="Refresh">
              <i class="fas fa-sync-alt"></i>
            </button>
            <button class="module-action" data-action="configure" title="Configure">
              <i class="fas fa-cog"></i>
            </button>
            <button class="module-action" data-action="delete" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="module-body">
          ${this.isConfiguring ? this.renderConfig() : this.renderContent()}
        </div>
      </div>
    `;
  }

  renderContent() {
    if (!this.data) {
      return `
        <div class="module-loading">
          <i class="fas fa-spinner fa-spin"></i>
          Loading...
        </div>
      `;
    }

    if (this.data.error) {
      return `
        <div class="module-error">
          <i class="fas fa-exclamation-triangle"></i>
          ${this.data.error}
        </div>
      `;
    }

    return this.renderData();
  }

  renderData() {
    // Override in subclasses
    return '<p>Module content goes here</p>';
  }

  renderConfig() {
    // Override in subclasses
    return `
      <div class="module-config">
        <p>No configuration options available for this module type.</p>
        <div class="form-actions">
          <button class="btn btn-secondary" data-action="cancel-config">Cancel</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    this.container.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) {
        this.handleAction(action, e);
      }
    });

    this.container.addEventListener('submit', (e) => {
      if (e.target.classList.contains('module-config-form')) {
        e.preventDefault();
        this.handleConfigSubmit(e);
      }
    });
  }

  async handleAction(action, event) {
    switch (action) {
      case 'refresh':
        await this.refresh();
        break;
      case 'configure':
        this.toggleConfig();
        break;
      case 'delete':
        await this.delete();
        break;
      case 'cancel-config':
        this.toggleConfig();
        break;
      default:
        // Allow subclasses to handle custom actions
        this.handleCustomAction(action, event);
    }
  }

  handleCustomAction(action, event) {
    // Override in subclasses for custom actions
  }

  async handleConfigSubmit(event) {
    const formData = new FormData(event.target);
    const newConfig = {};
    
    for (let [key, value] of formData.entries()) {
      newConfig[key] = value;
    }

    try {
      // Merge with existing config
      this.config = { ...this.config, ...newConfig };
      
      // Save to API
      await api.updateModuleConfig(this.id, this.config);
      
      // Exit config mode
      this.isConfiguring = false;
      
      // Re-render and refresh data
      this.render();
      await this.refresh();
      
      Toast.success('Module configuration saved');
    } catch (error) {
      console.error('Failed to save module config:', error);
      Toast.error('Failed to save configuration');
    }
  }

  toggleConfig() {
    this.isConfiguring = !this.isConfiguring;
    this.render();
  }

  async refresh() {
    try {
      // Show loading in refresh button
      const refreshBtn = this.container.querySelector('[data-action="refresh"]');
      if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        icon.classList.add('fa-spin');
      }

      this.data = await api.getModuleData(this.id);
      
      // Re-render if not in config mode
      if (!this.isConfiguring) {
        this.render();
      }

      // Stop spin animation
      if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        icon.classList.remove('fa-spin');
      }

    } catch (error) {
      console.error('Failed to refresh module data:', error);
      this.data = { error: 'Failed to load data' };
      
      if (!this.isConfiguring) {
        this.render();
      }
    }
  }

  async delete() {
    if (!confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      await api.deleteModule(this.id);
      
      // Remove from grid
      if (window.dashboardManager) {
        dashboardManager.removeModule(this.id);
      }
      
      Toast.success('Module deleted');
    } catch (error) {
      console.error('Failed to delete module:', error);
      Toast.error('Failed to delete module');
    }
  }

  startAutoRefresh() {
    // Clear existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Get refresh interval based on subscription
    const user = api.getCurrentUser();
    const interval = user?.subscription_level === 'premium' ? 15 * 60 * 1000 : 60 * 60 * 1000; // 15min vs 1hour

    // Start auto refresh
    this.refreshInterval = setInterval(() => {
      if (!this.isConfiguring) {
        this.refresh();
      }
    }, interval);

    // Initial data load
    this.refresh();
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  destroy() {
    this.stopAutoRefresh();
    this.container.innerHTML = '';
  }

  // Methods to override in subclasses
  getIcon() {
    return 'fas fa-cube';
  }

  getTitle() {
    return 'Module';
  }

  getDefaultConfig() {
    return {};
  }

  // Utility methods
  formatDate(date) {
    return DateTime.formatDate(date);
  }

  formatRelativeTime(date) {
    return DateTime.formatRelative(date);
  }

  escapeHtml(text) {
    return escapeHtml(text);
  }
}

// Export for use in other scripts
window.BaseModule = BaseModule;