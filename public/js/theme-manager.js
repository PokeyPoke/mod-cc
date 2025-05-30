// Theme Management

class ThemeManager {
  constructor() {
    this.currentTheme = Storage.get('theme', 'light');
    this.themes = ['light', 'dark', 'blue', 'green'];
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupThemeToggle();
    this.setupThemeSelector();
  }

  applyTheme(theme) {
    if (!this.themes.includes(theme)) {
      theme = 'light';
    }

    // Remove all theme classes
    this.themes.forEach(t => {
      document.body.classList.remove(`theme-${t}`);
    });

    // Apply new theme
    document.body.classList.add(`theme-${theme}`);
    this.currentTheme = theme;
    
    // Save to storage
    Storage.set('theme', theme);
    
    // Update theme selector if it exists
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = theme;
    }

    // Dispatch custom event for other components
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  getNextTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    return this.themes[(currentIndex + 1) % this.themes.length];
  }

  toggleTheme() {
    const nextTheme = this.getNextTheme();
    this.applyTheme(nextTheme);
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
        
        // Update button icon based on theme
        const icon = themeToggle.querySelector('i');
        if (icon) {
          // Rotate through different palette icons or keep the same
          icon.className = 'fas fa-palette';
        }
        
        Toast.info(`Theme changed to ${this.currentTheme}`);
      });
    }
  }

  setupThemeSelector() {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = this.currentTheme;
      
      themeSelect.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
      });
    }
  }

  // Sync theme with user settings from API
  async syncWithSettings() {
    try {
      const settings = await api.getSettings();
      if (settings.theme && settings.theme !== this.currentTheme) {
        this.applyTheme(settings.theme);
      }
    } catch (error) {
      console.error('Failed to sync theme with settings:', error);
    }
  }

  // Save theme to user settings via API
  async saveToSettings() {
    try {
      await api.updateSettings({ theme: this.currentTheme });
    } catch (error) {
      console.error('Failed to save theme to settings:', error);
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return [...this.themes];
  }

  // Get theme-specific CSS variables
  getThemeColors() {
    const style = getComputedStyle(document.body);
    return {
      primary: style.getPropertyValue('--color-primary').trim(),
      primaryLight: style.getPropertyValue('--color-primary-light').trim(),
      primaryDark: style.getPropertyValue('--color-primary-dark').trim(),
      secondary: style.getPropertyValue('--color-secondary').trim(),
      background: style.getPropertyValue('--color-neutral-bg').trim(),
      surface: style.getPropertyValue('--color-neutral-surface').trim(),
      textPrimary: style.getPropertyValue('--text-primary').trim(),
      textSecondary: style.getPropertyValue('--text-secondary').trim(),
    };
  }

  // Theme-aware component styling helper
  getModuleStyle(moduleType) {
    const colors = this.getThemeColors();
    
    const styles = {
      weather: {
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        accentColor: '#3498db' // Weather blue
      },
      notes: {
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        accentColor: '#f39c12' // Notes orange
      },
      todo: {
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        accentColor: '#2ecc71' // Todo green
      },
      countdown: {
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        accentColor: '#e74c3c' // Countdown red
      },
      links: {
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        accentColor: '#9b59b6' // Links purple
      },
      custom: {
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        accentColor: colors.primary
      }
    };

    return styles[moduleType] || styles.custom;
  }
}

// Create global theme manager instance
window.themeManager = new ThemeManager();

// Initialize theme on page load
ready(() => {
  // Additional theme-specific initialization can go here
});

// Export for use in other scripts
window.ThemeManager = ThemeManager;