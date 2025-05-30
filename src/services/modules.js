const fetch = require('node-fetch');
const db = require('./database');
const { decrypt } = require('../utils/encryption');

class ModuleService {
  async getModuleData(type, config, userId, deviceType = 'web') {
    try {
      switch (type) {
        case 'weather':
          return await this.getWeatherData(config, userId, deviceType);
        case 'notes':
          return this.getNotesData(config);
        case 'todo':
          return this.getTodoData(config);
        case 'countdown':
          return this.getCountdownData(config);
        case 'links':
          return this.getLinksData(config);
        case 'custom':
          return this.getCustomData(config);
        default:
          throw new Error('Unknown module type');
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      return { error: 'Failed to fetch data', timestamp: new Date().toISOString() };
    }
  }

  async getWeatherData(config, userId, deviceType) {
    if (!config.location) {
      return { error: 'Location not configured' };
    }

    try {
      // Try to get user's API key first
      let apiKey = null;
      const userApiKey = await db.getApiKey(userId, 'openweathermap');
      if (userApiKey) {
        apiKey = decrypt(userApiKey.api_key);
      }

      // For demo purposes, return mock data if no API key
      if (!apiKey) {
        return {
          location: config.location,
          temperature: Math.round(Math.random() * 30 + 10),
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
          humidity: Math.round(Math.random() * 100),
          windSpeed: Math.round(Math.random() * 20),
          mock: true,
          deviceOptimized: deviceType === 'iot'
        };
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(config.location)}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();
      
      const result = {
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        icon: data.weather[0].icon
      };

      // Simplify data for IoT devices
      if (deviceType === 'iot') {
        return {
          temp: result.temperature,
          condition: result.condition,
          location: result.location
        };
      }

      return result;
    } catch (error) {
      return { error: 'Weather service unavailable' };
    }
  }

  getNotesData(config) {
    return {
      notes: config.notes || [],
      maxNotes: 10
    };
  }

  getTodoData(config) {
    const todos = config.todos || [];
    return {
      todos,
      completed: todos.filter(todo => todo.completed).length,
      pending: todos.filter(todo => !todo.completed).length,
      total: todos.length
    };
  }

  getCountdownData(config) {
    if (!config.targetDate) {
      return { error: 'Target date not configured' };
    }

    const target = new Date(config.targetDate);
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      return {
        expired: true,
        message: config.expiredMessage || 'Event has passed'
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      title: config.title || 'Countdown',
      days,
      hours,
      minutes,
      seconds,
      targetDate: config.targetDate
    };
  }

  getLinksData(config) {
    return {
      links: config.links || [],
      maxLinks: 20
    };
  }

  getCustomData(config) {
    return {
      html: config.html || '<p>Configure your custom HTML content</p>',
      css: config.css || '',
      allowScripts: false // Security: never allow scripts
    };
  }
}

module.exports = new ModuleService();