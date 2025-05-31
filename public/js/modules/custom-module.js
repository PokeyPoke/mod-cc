// Custom HTML Module

class CustomModule extends BaseModule {
  getIcon() {
    return 'fas fa-code';
  }

  getTitle() {
    return 'Custom HTML';
  }

  getDefaultConfig() {
    return {
      html: '<h3>Welcome to your custom module!</h3><p>Edit the HTML content in the configuration to customize this module.</p>',
      css: ''
    };
  }

  renderData() {
    const html = this.config.html || '';
    const css = this.config.css || '';

    return `
      <div class="custom-content">
        ${css ? `<style scoped>${this.sanitizeCSS(css)}</style>` : ''}
        <div class="custom-html">${this.sanitizeHTML(html)}</div>
      </div>
    `;
  }

  renderConfig() {
    return `
      <form class="module-config module-config-form">
        <div class="form-group">
          <label for="custom-html">HTML Content</label>
          <textarea 
            id="custom-html" 
            name="html" 
            rows="8"
            placeholder="Enter your HTML content here..."
          >${this.escapeHtml(this.config.html || '')}</textarea>
          <small style="color: var(--text-secondary); font-size: 0.8rem;">
            Basic HTML tags are supported. Scripts are not allowed for security.
          </small>
        </div>
        <div class="form-group">
          <label for="custom-css">Custom CSS (Optional)</label>
          <textarea 
            id="custom-css" 
            name="css" 
            rows="6"
            placeholder="Enter custom CSS styles here..."
          >${this.escapeHtml(this.config.css || '')}</textarea>
          <small style="color: var(--text-secondary); font-size: 0.8rem;">
            CSS will be scoped to this module only.
          </small>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel-config">Cancel</button>
          <button type="button" class="btn btn-secondary" data-action="preview">Preview</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `;
  }

  handleCustomAction(action, event) {
    switch (action) {
      case 'preview':
        this.previewContent();
        break;
    }
  }

  previewContent() {
    const htmlTextarea = this.container.querySelector('#custom-html');
    const cssTextarea = this.container.querySelector('#custom-css');
    
    if (!htmlTextarea) return;

    const html = htmlTextarea.value;
    const css = cssTextarea ? cssTextarea.value : '';

    // Create temporary preview
    const tempConfig = { html, css };
    const originalConfig = this.config;
    
    this.config = tempConfig;
    this.isConfiguring = false;
    this.render();
    
    // Show preview for 3 seconds, then restore config mode
    setTimeout(() => {
      this.config = originalConfig;
      this.isConfiguring = true;
      this.render();
    }, 3000);

    Toast.info('Preview for 3 seconds...');
  }

  sanitizeHTML(html) {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove script tags and event attributes for security
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove dangerous event attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      });
    });

    // Remove javascript: URLs
    const links = temp.querySelectorAll('a[href], link[href]');
    links.forEach(link => {
      if (link.href && link.href.toLowerCase().startsWith('javascript:')) {
        link.removeAttribute('href');
      }
    });

    const imgs = temp.querySelectorAll('img[src]');
    imgs.forEach(img => {
      if (img.src && img.src.toLowerCase().startsWith('javascript:')) {
        img.removeAttribute('src');
      }
    });

    return temp.innerHTML;
  }

  sanitizeCSS(css) {
    // Basic CSS sanitization - remove potentially dangerous properties
    let sanitized = css.replace(/javascript\s*:/gi, '');
    sanitized = sanitized.replace(/expression\s*\(/gi, '');
    sanitized = sanitized.replace(/@import/gi, '');
    sanitized = sanitized.replace(/behaviour\s*:/gi, '');
    sanitized = sanitized.replace(/-moz-binding\s*:/gi, '');
    
    return sanitized;
  }

  // Override handleConfigSubmit to handle custom validation
  async handleConfigSubmit(event) {
    const formData = new FormData(event.target);
    const html = formData.get('html') || '';
    const css = formData.get('css') || '';

    // Basic validation
    if (html.length > 10000) {
      Toast.error('HTML content is too long (max 10,000 characters)');
      return;
    }

    if (css.length > 5000) {
      Toast.error('CSS content is too long (max 5,000 characters)');
      return;
    }

    const newConfig = { html, css };

    try {
      this.config = { ...this.config, ...newConfig };
      await api.updateModuleConfig(this.id, this.config);
      
      this.isConfiguring = false;
      this.render();
      
      Toast.success('Custom module saved');
    } catch (error) {
      console.error('Failed to save custom module:', error);
      Toast.error('Failed to save configuration');
    }
  }
}

// Register module type
window.CustomModule = CustomModule;