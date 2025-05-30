// Utility Functions

// Toast notification system
const Toast = {
  show(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: 12px;">&times;</button>
      </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);
  },
  
  success(message, duration) {
    this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    this.show(message, 'error', duration);
  },
  
  warning(message, duration) {
    this.show(message, 'warning', duration);
  },
  
  info(message, duration) {
    this.show(message, 'info', duration);
  }
};

// Loading overlay
const Loading = {
  show() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  },
  
  hide() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }
};

// Modal utilities
const Modal = {
  show(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  },
  
  hide(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  },
  
  hideAll() {
    document.querySelectorAll('.modal.show').forEach(modal => {
      modal.classList.remove('show');
    });
    document.body.style.overflow = '';
  }
};

// Local storage utilities with error handling
const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Form validation utilities
const Validation = {
  email(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  password(password) {
    return password && password.length >= 6;
  },
  
  required(value) {
    return value && value.toString().trim().length > 0;
  },
  
  url(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

// Form helper utilities
const Form = {
  getData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  },
  
  setError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const formGroup = field.closest('.form-group');
    if (formGroup) {
      formGroup.classList.add('error');
      
      let errorElement = formGroup.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
      }
      errorElement.textContent = message;
    }
  },
  
  clearError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const formGroup = field.closest('.form-group');
    if (formGroup) {
      formGroup.classList.remove('error');
      
      const errorElement = formGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove();
      }
    }
  },
  
  clearAllErrors(formElement) {
    const errorGroups = formElement.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => {
      group.classList.remove('error');
      const errorElement = group.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove();
      }
    });
  }
};

// Date and time utilities
const DateTime = {
  formatRelative(date) {
    const now = new Date();
    const target = new Date(date);
    const diffMs = target - now;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (Math.abs(diffMins) < 1) {
      return 'Just now';
    } else if (Math.abs(diffMins) < 60) {
      return `${Math.abs(diffMins)} minute${Math.abs(diffMins) === 1 ? '' : 's'} ${diffMins > 0 ? 'from now' : 'ago'}`;
    } else if (Math.abs(diffHours) < 24) {
      return `${Math.abs(diffHours)} hour${Math.abs(diffHours) === 1 ? '' : 's'} ${diffHours > 0 ? 'from now' : 'ago'}`;
    } else if (Math.abs(diffDays) < 7) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ${diffDays > 0 ? 'from now' : 'ago'}`;
    } else {
      return target.toLocaleDateString();
    }
  },
  
  formatDate(date) {
    return new Date(date).toLocaleDateString();
  },
  
  formatDateTime(date) {
    return new Date(date).toLocaleString();
  }
};

// Debounce utility for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// DOM ready utility
function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Global event delegation
document.addEventListener('click', (e) => {
  // Close modals when clicking outside
  if (e.target.classList.contains('modal')) {
    Modal.hideAll();
  }
  
  // Close modal when clicking close button
  if (e.target.classList.contains('modal-close')) {
    Modal.hideAll();
  }
});

// Global keyboard event handling
document.addEventListener('keydown', (e) => {
  // Close modals on Escape key
  if (e.key === 'Escape') {
    Modal.hideAll();
  }
});

// Export utilities for use in other scripts
window.Toast = Toast;
window.Loading = Loading;
window.Modal = Modal;
window.Storage = Storage;
window.Validation = Validation;
window.Form = Form;
window.DateTime = DateTime;
window.debounce = debounce;
window.throttle = throttle;
window.ready = ready;
window.generateId = generateId;
window.escapeHtml = escapeHtml;