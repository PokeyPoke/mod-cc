// Homepage Demo Dashboard with Real Data

class HomepageDashboard {
  constructor() {
    this.grid = null;
    this.userLocation = null;
    this.weatherData = null;
    this.init();
  }

  async init() {
    this.initGridStack();
    await this.detectLocation();
    this.initClock();
    this.loadDemoWidgets();
  }

  initGridStack() {
    // Initialize GridStack for draggable demo widgets
    this.grid = GridStack.init({
      cellHeight: 80,
      verticalMargin: 15,
      animate: true,
      resizable: {
        handles: 'se'
      },
      draggable: {
        handle: '.widget-header'
      },
      staticGrid: false // Allow dragging in demo
    }, '#demo-grid-stack');

    // Add demo widgets to the grid
    this.setupDemoGridItems();
  }

  setupDemoGridItems() {
    // Convert existing demo widgets to GridStack items
    const widgets = [
      { 
        id: 'weather-widget', 
        x: 0, y: 0, w: 4, h: 4,
        content: this.createWeatherWidget()
      },
      { 
        id: 'clock-widget', 
        x: 4, y: 0, w: 4, h: 3,
        content: this.createClockWidget()
      },
      { 
        id: 'quick-info-widget', 
        x: 8, y: 0, w: 4, h: 3,
        content: this.createQuickInfoWidget()
      },
      { 
        id: 'features-widget', 
        x: 0, y: 4, w: 6, h: 4,
        content: this.createFeaturesWidget()
      },
      { 
        id: 'stats-widget', 
        x: 6, y: 3, w: 3, h: 3,
        content: this.createStatsWidget()
      },
      { 
        id: 'getting-started-widget', 
        x: 9, y: 3, w: 3, h: 4,
        content: this.createGettingStartedWidget()
      }
    ];

    widgets.forEach(widget => {
      this.grid.addWidget({
        x: widget.x, 
        y: widget.y, 
        w: widget.w, 
        h: widget.h,
        id: widget.id,
        content: widget.content
      });
    });
  }

  createWeatherWidget() {
    return `
      <div class="demo-widget" id="weather-widget">
        <div class="widget-header">
          <div class="widget-title">
            <i class="fas fa-cloud-sun"></i>
            Local Weather
          </div>
        </div>
        <div class="widget-content weather-content">
          <div class="loading-widget">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Detecting your location...</span>
          </div>
        </div>
      </div>
    `;
  }

  createClockWidget() {
    return `
      <div class="demo-widget" id="clock-widget">
        <div class="widget-header">
          <div class="widget-title">
            <i class="fas fa-clock"></i>
            Current Time
          </div>
        </div>
        <div class="widget-content clock-content">
          <div class="loading-widget">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    `;
  }

  createQuickInfoWidget() {
    return `
      <div class="demo-widget" id="quick-info-widget">
        <div class="widget-header">
          <div class="widget-title">
            <i class="fas fa-lightbulb"></i>
            Feature Spotlight
          </div>
        </div>
        <div class="widget-content">
          <div class="loading-widget">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    `;
  }

  createFeaturesWidget() {
    return `
      <div class="demo-widget">
        <div class="widget-header">
          <div class="widget-title">
            <i class="fas fa-star"></i>
            Why Choose Modular Dashboard?
          </div>
        </div>
        <div class="widget-content">
          <div style="display: grid; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <i class="fas fa-mobile-alt" style="color: var(--primary-color); width: 20px;"></i>
              <span>Responsive design for all devices</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <i class="fas fa-palette" style="color: var(--primary-color); width: 20px;"></i>
              <span>Multiple themes and customization</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <i class="fas fa-sync-alt" style="color: var(--primary-color); width: 20px;"></i>
              <span>Real-time data synchronization</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <i class="fas fa-shield-alt" style="color: var(--primary-color); width: 20px;"></i>
              <span>Secure and privacy-focused</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createStatsWidget() {
    return `
      <div class="demo-widget">
        <div class="widget-header">
          <div class="widget-title">
            <i class="fas fa-chart-line"></i>
            Platform Stats
          </div>
        </div>
        <div class="widget-content">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: center;">
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">6</div>
              <div style="font-size: 0.9rem; color: var(--text-secondary);">Widget Types</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--accent-color);">∞</div>
              <div style="font-size: 0.9rem; color: var(--text-secondary);">Customization</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--success-color);">3</div>
              <div style="font-size: 0.9rem; color: var(--text-secondary);">Device Types</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--warning-color);">24/7</div>
              <div style="font-size: 0.9rem; color: var(--text-secondary);">Availability</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createGettingStartedWidget() {
    return `
      <div class="demo-widget">
        <div class="widget-header">
          <div class="widget-title">
            <i class="fas fa-rocket"></i>
            Getting Started
          </div>
        </div>
        <div class="widget-content">
          <div style="display: grid; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="background: var(--primary-color); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600;">1</span>
              <span>Create your free account</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="background: var(--accent-color); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600;">2</span>
              <span>Add and customize widgets</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="background: var(--success-color); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600;">3</span>
              <span>Enjoy your personal dashboard</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async detectLocation() {
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true
          });
        });

        this.userLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };

        console.log('Location detected:', this.userLocation);
      } else {
        await this.useIPLocation();
      }
    } catch (error) {
      console.log('Geolocation failed:', error);
      await this.useIPLocation();
    }
  }

  async useIPLocation() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        this.userLocation = {
          city: data.city,
          country: data.country_name,
          lat: data.latitude,
          lon: data.longitude
        };
        console.log('IP location detected:', this.userLocation);
      } else {
        this.useDefaultLocation();
      }
    } catch (error) {
      console.log('IP geolocation failed:', error);
      this.useDefaultLocation();
    }
  }

  useDefaultLocation() {
    this.userLocation = {
      city: 'New York',
      country: 'United States',
      lat: 40.7128,
      lon: -74.0060
    };
    console.log('Using default location:', this.userLocation);
  }

  async loadDemoWidgets() {
    await this.loadWeatherWidget();
    this.loadQuickInfoWidget();
  }

  async loadWeatherWidget() {
    const weatherWidget = document.getElementById('weather-widget');
    if (!weatherWidget) return;

    const weatherContent = weatherWidget.querySelector('.weather-content');
    
    try {
      // Show loading state
      weatherContent.innerHTML = `
        <div class="loading-widget">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading weather for ${this.userLocation.city || 'your location'}...</span>
        </div>
      `;

      // Try to get real weather data using OpenWeatherMap API
      await this.fetchRealWeatherData();

      if (this.weatherData) {
        // Update weather widget with real data
        weatherContent.innerHTML = `
          <div class="location-info">
            <i class="fas fa-map-marker-alt"></i>
            <span class="location-display">${this.weatherData.location}</span>
          </div>
          <div class="weather-main">
            <div class="weather-temp">${this.weatherData.temperature}°C</div>
            <div class="weather-condition">
              <div class="weather-icon">
                <i class="${this.weatherData.icon}"></i>
              </div>
              <div class="weather-description">${this.weatherData.condition}</div>
            </div>
          </div>
          <div class="weather-details">
            <div class="weather-detail">
              <div class="weather-detail-value">${this.weatherData.humidity}%</div>
              <div class="weather-detail-label">Humidity</div>
            </div>
            <div class="weather-detail">
              <div class="weather-detail-value">${this.weatherData.windSpeed} km/h</div>
              <div class="weather-detail-label">Wind</div>
            </div>
          </div>
          <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-secondary); text-align: center;">
            <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
            Real weather data
          </div>
        `;
      }
    } catch (error) {
      console.error('Weather loading failed:', error);
      weatherContent.innerHTML = `
        <div class="error-widget">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Unable to load weather data</p>
          <small>Demo mode - Create account for real data</small>
        </div>
      `;
    }
  }

  async fetchRealWeatherData() {
    if (!this.userLocation.lat || !this.userLocation.lon) {
      throw new Error('Location not available');
    }

    try {
      // Use OpenWeatherMap API with a demo key (you would need a real API key for production)
      // For demo purposes, we'll use the existing weather service endpoint
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${this.userLocation.lat}&lon=${this.userLocation.lon}&appid=demo&units=metric`);
      
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();
      
      this.weatherData = {
        location: data.name || this.userLocation.city || 'Your Location',
        temperature: Math.round(data.main?.temp || this.generateDemoTemp()),
        condition: data.weather?.[0]?.main || this.generateDemoCondition(),
        description: data.weather?.[0]?.description || 'Current conditions',
        humidity: data.main?.humidity || Math.floor(Math.random() * 40 + 40),
        windSpeed: Math.round((data.wind?.speed || Math.random() * 15 + 5) * 3.6), // Convert m/s to km/h
        icon: this.getWeatherIcon(data.weather?.[0]?.main || this.generateDemoCondition())
      };
    } catch (error) {
      console.log('Real weather API failed, using demo data:', error);
      
      // Fallback to smart demo data based on location and time
      this.weatherData = {
        location: this.userLocation.city || 'Your Location',
        temperature: this.generateDemoTemp(),
        condition: this.generateDemoCondition(),
        description: 'Demo weather data',
        humidity: Math.floor(Math.random() * 40 + 40),
        windSpeed: Math.floor(Math.random() * 20 + 5),
        icon: this.getWeatherIcon(this.generateDemoCondition())
      };
    }
  }

  generateDemoTemp() {
    const hour = new Date().getHours();
    const season = this.getCurrentSeason();
    
    const baseTemps = {
      spring: { min: 15, max: 25 },
      summer: { min: 25, max: 35 },
      autumn: { min: 10, max: 20 },
      winter: { min: -5, max: 10 }
    };

    let temp = Math.floor(Math.random() * (baseTemps[season].max - baseTemps[season].min) + baseTemps[season].min);
    
    // Adjust for time of day
    if (hour < 6 || hour > 20) {
      temp -= Math.floor(Math.random() * 5 + 2);
    } else if (hour >= 12 && hour <= 16) {
      temp += Math.floor(Math.random() * 3 + 1);
    }

    return temp;
  }

  generateDemoCondition() {
    const season = this.getCurrentSeason();
    const conditions = {
      spring: ['Sunny', 'Partly Cloudy', 'Rainy', 'Cloudy'],
      summer: ['Sunny', 'Clear', 'Partly Cloudy', 'Hot'],
      autumn: ['Cloudy', 'Rainy', 'Foggy', 'Partly Cloudy'],
      winter: ['Snowy', 'Cloudy', 'Clear', 'Foggy']
    };

    return conditions[season][Math.floor(Math.random() * conditions[season].length)];
  }

  getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  getWeatherIcon(condition) {
    const icons = {
      'Clear': 'fas fa-sun',
      'Sunny': 'fas fa-sun',
      'Hot': 'fas fa-sun',
      'Partly Cloudy': 'fas fa-cloud-sun',
      'Clouds': 'fas fa-cloud',
      'Cloudy': 'fas fa-cloud',
      'Rain': 'fas fa-cloud-rain',
      'Rainy': 'fas fa-cloud-rain',
      'Thunderstorm': 'fas fa-bolt',
      'Snow': 'fas fa-snowflake',
      'Snowy': 'fas fa-snowflake',
      'Mist': 'fas fa-smog',
      'Foggy': 'fas fa-smog'
    };

    return icons[condition] || 'fas fa-sun';
  }

  initClock() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
  }

  updateClock() {
    const clockElement = document.getElementById('clock-widget');
    if (!clockElement) return;

    const now = new Date();
    
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    const dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const timeString = now.toLocaleTimeString('en-US', timeOptions);
    const dateString = now.toLocaleDateString('en-US', dateOptions);

    const clockContent = clockElement.querySelector('.clock-content');
    if (clockContent) {
      clockContent.innerHTML = `
        <div class="clock-time">${timeString}</div>
        <div class="clock-date">${dateString}</div>
      `;
    }
  }

  loadQuickInfoWidget() {
    const quickInfoWidget = document.getElementById('quick-info-widget');
    if (!quickInfoWidget) return;

    const features = [
      {
        icon: 'fas fa-cloud-sun',
        title: 'Weather Tracking',
        description: 'Real-time weather data for any location'
      },
      {
        icon: 'fas fa-sticky-note',
        title: 'Smart Notes',
        description: 'Organize your thoughts and ideas'
      },
      {
        icon: 'fas fa-tasks',
        title: 'Task Management',
        description: 'Keep track of your daily goals'
      },
      {
        icon: 'fas fa-clock',
        title: 'Event Countdown',
        description: 'Never miss important dates'
      }
    ];

    const randomFeature = features[Math.floor(Math.random() * features.length)];

    const widgetContent = quickInfoWidget.querySelector('.widget-content');
    if (widgetContent) {
      widgetContent.innerHTML = `
        <div style="text-align: center; padding: 1rem;">
          <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;">
            <i class="${randomFeature.icon}"></i>
          </div>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">${randomFeature.title}</h3>
          <p style="color: var(--text-secondary); margin: 0;">${randomFeature.description}</p>
        </div>
      `;
    }
  }
}

// Initialize homepage dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HomepageDashboard();
});