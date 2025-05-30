// Weather Module

class WeatherModule extends BaseModule {
  getIcon() {
    return 'fas fa-cloud-sun';
  }

  getTitle() {
    return 'Weather';
  }

  getDefaultConfig() {
    return {
      location: 'New York, NY'
    };
  }

  renderData() {
    if (!this.data || this.data.error) {
      return `
        <div class="module-error">
          <i class="fas fa-exclamation-triangle"></i>
          ${this.data?.error || 'Failed to load weather data'}
        </div>
      `;
    }

    const { temperature, condition, location, humidity, windSpeed, description, mock } = this.data;

    return `
      <div class="weather-main">
        <div class="weather-temp">${temperature}°C</div>
        <div class="weather-condition">${condition}</div>
        ${description ? `<div class="weather-description">${description}</div>` : ''}
        <div class="weather-location">
          <i class="fas fa-map-marker-alt"></i>
          ${location}
        </div>
        ${mock ? '<div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 8px;">Demo Data</div>' : ''}
      </div>
      <div class="weather-details">
        <div class="weather-detail">
          <div class="weather-detail-label">Humidity</div>
          <div class="weather-detail-value">${humidity}%</div>
        </div>
        <div class="weather-detail">
          <div class="weather-detail-label">Wind</div>
          <div class="weather-detail-value">${windSpeed} km/h</div>
        </div>
      </div>
    `;
  }

  renderConfig() {
    return `
      <form class="module-config module-config-form">
        <div class="form-group">
          <label for="weather-location">Location</label>
          <input 
            type="text" 
            id="weather-location" 
            name="location" 
            value="${this.config.location || ''}" 
            placeholder="Enter city name"
            required
          >
          <small style="color: var(--text-secondary); font-size: 0.8rem;">
            Enter a city name (e.g., "London", "New York, NY", "Tokyo, Japan")
          </small>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel-config">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `;
  }

  handleCustomAction(action, event) {
    // Handle weather-specific actions if needed
  }
}

// Register module type
window.WeatherModule = WeatherModule;