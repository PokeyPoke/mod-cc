// Links Module

class LinksModule extends BaseModule {
  getIcon() {
    return 'fas fa-link';
  }

  getTitle() {
    return 'Quick Links';
  }

  getDefaultConfig() {
    return {
      links: []
    };
  }

  renderData() {
    const links = this.config.links || [];
    
    if (links.length === 0) {
      return `
        <div class="empty-links" style="text-align: center; color: var(--text-secondary); padding: 20px;">
          <i class="fas fa-link" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>No links yet. Add your first link below.</p>
        </div>
        ${this.renderLinkForm()}
      `;
    }

    return `
      <div class="links-list">
        ${links.map((link, index) => `
          <a href="${link.url}" class="link-item" target="_blank" rel="noopener noreferrer">
            <div class="link-icon">
              <i class="${this.getLinkIcon(link.url)}"></i>
            </div>
            <div class="link-info">
              <div class="link-title">${this.escapeHtml(link.title)}</div>
              <div class="link-url">${this.escapeHtml(link.url)}</div>
            </div>
            <button class="btn-icon" data-action="delete-link" data-index="${index}" title="Delete link" onclick="event.preventDefault(); event.stopPropagation();">
              <i class="fas fa-trash"></i>
            </button>
          </a>
        `).join('')}
      </div>
      ${this.renderLinkForm()}
    `;
  }

  renderLinkForm() {
    return `
      <div class="link-add">
        <div class="form-group">
          <input 
            type="text" 
            class="link-title-input" 
            placeholder="Link title..." 
            maxlength="50"
          >
        </div>
        <div class="form-group">
          <input 
            type="url" 
            class="link-url-input" 
            placeholder="https://..." 
          >
        </div>
        <button class="btn btn-primary" data-action="add-link">
          <i class="fas fa-plus"></i> Add Link
        </button>
      </div>
    `;
  }

  renderConfig() {
    return `
      <div class="module-config">
        <p>Links are managed directly in the module. Use the form below to add new links.</p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel-config">Close</button>
        </div>
      </div>
    `;
  }

  handleCustomAction(action, event) {
    switch (action) {
      case 'add-link':
        this.addLink();
        break;
      case 'delete-link':
        const index = parseInt(event.target.closest('[data-index]').dataset.index);
        this.deleteLink(index);
        break;
    }
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Handle Enter key in link inputs
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.target.classList.contains('link-title-input') || e.target.classList.contains('link-url-input'))) {
        this.addLink();
      }
    });
  }

  async addLink() {
    const titleInput = this.container.querySelector('.link-title-input');
    const urlInput = this.container.querySelector('.link-url-input');
    
    if (!titleInput || !urlInput) return;

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();

    if (!title || !url) {
      Toast.warning('Please enter both title and URL');
      return;
    }

    if (!Validation.url(url)) {
      Toast.error('Please enter a valid URL (including http:// or https://)');
      return;
    }

    const links = this.config.links || [];
    const newLink = {
      id: generateId(),
      title: title,
      url: url,
      created: new Date().toISOString()
    };

    links.push(newLink);
    
    // Limit links for free tier
    const user = api.getCurrentUser();
    const maxLinks = user?.subscription_level === 'premium' ? 50 : 10;
    
    if (links.length > maxLinks) {
      Toast.warning(`Link limit reached (${maxLinks}). Upgrade to Premium for more links.`);
      return;
    }

    this.config.links = links;
    
    // Clear inputs
    titleInput.value = '';
    urlInput.value = '';

    // Save and re-render
    await this.saveConfig();
  }

  async deleteLink(index) {
    const links = this.config.links || [];
    if (index >= 0 && index < links.length) {
      links.splice(index, 1);
      this.config.links = links;
      await this.saveConfig();
    }
  }

  async saveConfig() {
    try {
      await api.updateModuleConfig(this.id, this.config);
      this.render();
    } catch (error) {
      console.error('Failed to save links:', error);
      Toast.error('Failed to save link');
    }
  }

  getLinkIcon(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      const iconMap = {
        'github.com': 'fab fa-github',
        'stackoverflow.com': 'fab fa-stack-overflow',
        'google.com': 'fab fa-google',
        'youtube.com': 'fab fa-youtube',
        'facebook.com': 'fab fa-facebook',
        'twitter.com': 'fab fa-twitter',
        'linkedin.com': 'fab fa-linkedin',
        'instagram.com': 'fab fa-instagram',
        'reddit.com': 'fab fa-reddit',
        'medium.com': 'fab fa-medium',
        'discord.com': 'fab fa-discord',
        'slack.com': 'fab fa-slack',
        'trello.com': 'fab fa-trello',
        'dropbox.com': 'fab fa-dropbox',
        'amazon.com': 'fab fa-amazon',
        'netflix.com': 'fas fa-play-circle',
        'spotify.com': 'fab fa-spotify',
        'apple.com': 'fab fa-apple',
        'microsoft.com': 'fab fa-microsoft'
      };

      for (let [domain_key, icon] of Object.entries(iconMap)) {
        if (domain.includes(domain_key)) {
          return icon;
        }
      }

      return 'fas fa-external-link-alt';
    } catch {
      return 'fas fa-link';
    }
  }
}

// Register module type
window.LinksModule = LinksModule;