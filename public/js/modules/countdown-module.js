// Countdown Module

class CountdownModule extends BaseModule {
  constructor(moduleData, container) {
    super(moduleData, container);
    this.countdownInterval = null;
  }

  getIcon() {
    return 'fas fa-clock';
  }

  getTitle() {
    return 'Countdown';
  }

  getDefaultConfig() {
    return {
      title: 'My Event',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      expiredMessage: 'Event has passed!'
    };
  }

  renderData() {
    if (!this.config.targetDate) {
      return `
        <div class="module-error">
          <i class="fas fa-exclamation-triangle"></i>
          Please configure the target date
        </div>
      `;
    }

    const target = new Date(this.config.targetDate);
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      return `
        <div class="countdown-expired">
          <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <div>${this.config.expiredMessage || 'Event has passed!'}</div>
        </div>
      `;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `
      <div class="countdown-title">${this.escapeHtml(this.config.title || 'Countdown')}</div>
      <div class="countdown-display">
        <div class="countdown-unit">
          <div class="countdown-number">${days}</div>
          <div class="countdown-label">Days</div>
        </div>
        <div class="countdown-unit">
          <div class="countdown-number">${hours}</div>
          <div class="countdown-label">Hours</div>
        </div>
        <div class="countdown-unit">
          <div class="countdown-number">${minutes}</div>
          <div class="countdown-label">Minutes</div>
        </div>
        <div class="countdown-unit">
          <div class="countdown-number">${seconds}</div>
          <div class="countdown-label">Seconds</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 10px; font-size: 0.9rem; color: var(--text-secondary);">
        ${target.toLocaleDateString()} at ${target.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>
    `;
  }

  renderConfig() {
    // Format date for input (YYYY-MM-DD)
    const currentDate = this.config.targetDate ? 
      new Date(this.config.targetDate).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0];

    return `
      <form class="module-config module-config-form">
        <div class="form-group">
          <label for="countdown-title">Event Title</label>
          <input 
            type="text" 
            id="countdown-title" 
            name="title" 
            value="${this.config.title || ''}" 
            placeholder="My Event"
            maxlength="50"
            required
          >
        </div>
        <div class="form-group">
          <label for="countdown-date">Target Date</label>
          <input 
            type="date" 
            id="countdown-date" 
            name="targetDate" 
            value="${currentDate}" 
            min="${new Date().toISOString().split('T')[0]}"
            required
          >
        </div>
        <div class="form-group">
          <label for="countdown-message">Expired Message</label>
          <input 
            type="text" 
            id="countdown-message" 
            name="expiredMessage" 
            value="${this.config.expiredMessage || ''}" 
            placeholder="Event has passed!"
            maxlength="100"
          >
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel-config">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `;
  }

  startAutoRefresh() {
    // Override parent to use 1-second updates for countdown
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Update countdown every second
    this.countdownInterval = setInterval(() => {
      if (!this.isConfiguring && this.config.targetDate) {
        this.updateCountdown();
      }
    }, 1000);

    // Still do periodic data refresh for other updates
    const user = api.getCurrentUser();
    const interval = user?.subscription_level === 'premium' ? 15 * 60 * 1000 : 60 * 60 * 1000;
    
    this.refreshInterval = setInterval(() => {
      if (!this.isConfiguring) {
        this.refresh();
      }
    }, interval);

    // Initial render
    this.render();
  }

  stopAutoRefresh() {
    super.stopAutoRefresh();
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  updateCountdown() {
    // Just re-render the content without API call
    const bodyElement = this.container.querySelector('.module-body');
    if (bodyElement && !this.isConfiguring) {
      bodyElement.innerHTML = this.renderData();
    }
  }

  destroy() {
    this.stopAutoRefresh();
    super.destroy();
  }
}

// Register module type
window.CountdownModule = CountdownModule;