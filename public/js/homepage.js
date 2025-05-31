// Homepage Demo Dashboard

class HomepageDashboard {
  constructor() {
    this.userLocation = null;
    this.weatherData = null;
    this.init();
  }

  async init() {
    await this.detectLocation();
    this.initClock();
    this.loadDemoWidgets();
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

        // Get city name from coordinates using reverse geocoding
        await this.reverseGeocode();
      } else {
        this.useDefaultLocation();
      }
    } catch (error) {
      console.log('Geolocation failed:', error);
      this.useDefaultLocation();
    }
  }

  async reverseGeocode() {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${this.userLocation.lat}&lon=${this.userLocation.lon}&limit=1&appid=demo`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          this.userLocation.city = data[0].name;
          this.userLocation.country = data[0].country;
        }
      }
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
    }

    // Fallback to IP-based location
    if (!this.userLocation.city) {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          this.userLocation.city = data.city;
          this.userLocation.country = data.country_name;
          this.userLocation.lat = data.latitude;
          this.userLocation.lon = data.longitude;
        }
      } catch (error) {
        console.log('IP geolocation failed:', error);
        this.useDefaultLocation();
      }
    }
  }

  useDefaultLocation() {
    this.userLocation = {
      city: 'New York',
      country: 'United States',
      lat: 40.7128,
      lon: -74.0060
    };
  }

  async loadDemoWidgets() {
    this.updateLocationDisplay();
    await this.loadWeatherWidget();
    this.loadQuickInfoWidget();
  }

  updateLocationDisplay() {
    const locationElements = document.querySelectorAll('.location-display');
    const locationText = this.userLocation.city 
      ? `${this.userLocation.city}, ${this.userLocation.country || ''}`
      : 'Location detected';
    
    locationElements.forEach(element => {
      element.textContent = locationText;
    });
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
          <span>Loading weather...</span>
        </div>
      `;

      // Generate demo weather data based on location and time
      this.weatherData = this.generateDemoWeatherData();

      // Update weather widget
      weatherContent.innerHTML = `
        <div class="location-info">
          <i class="fas fa-map-marker-alt"></i>
          <span class="location-display">${this.userLocation.city || 'Your Location'}</span>
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
      `;
    } catch (error) {
      weatherContent.innerHTML = `
        <div class="error-widget">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Unable to load weather data</p>
        </div>
      `;
    }
  }

  generateDemoWeatherData() {
    const hour = new Date().getHours();
    const season = this.getCurrentSeason();
    
    // Base temperatures by season
    const baseTemps = {
      spring: { min: 15, max: 25 },
      summer: { min: 25, max: 35 },
      autumn: { min: 10, max: 20 },
      winter: { min: -5, max: 10 }
    };

    // Weather conditions by season and time
    const conditions = {
      spring: ['Sunny', 'Partly Cloudy', 'Rainy', 'Cloudy'],
      summer: ['Sunny', 'Hot', 'Partly Cloudy', 'Thunderstorm'],
      autumn: ['Cloudy', 'Rainy', 'Foggy', 'Partly Cloudy'],
      winter: ['Snowy', 'Cloudy', 'Clear', 'Foggy']
    };

    const icons = {
      'Sunny': 'fas fa-sun',
      'Hot': 'fas fa-sun',
      'Partly Cloudy': 'fas fa-cloud-sun',
      'Cloudy': 'fas fa-cloud',
      'Rainy': 'fas fa-cloud-rain',
      'Thunderstorm': 'fas fa-bolt',
      'Snowy': 'fas fa-snowflake',
      'Foggy': 'fas fa-smog',
      'Clear': 'fas fa-moon'
    };

    // Generate realistic temperature based on season and time of day
    const baseTemp = baseTemps[season];
    let temperature = Math.floor(Math.random() * (baseTemp.max - baseTemp.min) + baseTemp.min);
    
    // Adjust for time of day
    if (hour < 6 || hour > 20) {
      temperature -= Math.floor(Math.random() * 5 + 2); // Cooler at night
    } else if (hour >= 12 && hour <= 16) {
      temperature += Math.floor(Math.random() * 3 + 1); // Warmer in afternoon
    }

    const condition = conditions[season][Math.floor(Math.random() * conditions[season].length)];
    
    return {
      temperature,
      condition,
      icon: icons[condition] || 'fas fa-sun',
      humidity: Math.floor(Math.random() * 40 + 40), // 40-80%
      windSpeed: Math.floor(Math.random() * 20 + 5) // 5-25 km/h
    };
  }

  getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
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

    clockElement.querySelector('.clock-content').innerHTML = `
      <div class="clock-time">${timeString}</div>
      <div class="clock-date">${dateString}</div>
    `;
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

    quickInfoWidget.querySelector('.widget-content').innerHTML = `
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

// Initialize homepage dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HomepageDashboard();
});