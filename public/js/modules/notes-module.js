// Notes Module

class NotesModule extends BaseModule {
  getIcon() {
    return 'fas fa-sticky-note';
  }

  getTitle() {
    return 'Notes';
  }

  getDefaultConfig() {
    return {
      notes: []
    };
  }

  renderData() {
    const notes = this.config.notes || [];
    
    if (notes.length === 0) {
      return `
        <div class="empty-notes">
          <i class="fas fa-sticky-note"></i>
          <p>No notes yet. Add your first note below.</p>
        </div>
        ${this.renderNoteForm()}
      `;
    }

    return `
      <div class="notes-list">
        ${notes.map((note, index) => `
          <div class="note-item" data-index="${index}">
            <div class="note-content">${this.escapeHtml(note.content)}</div>
            <div class="note-meta">
              <small style="color: var(--text-secondary);">
                ${this.formatDate(note.created)}
              </small>
              <button class="btn-icon" data-action="delete-note" data-index="${index}" title="Delete note">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      ${this.renderNoteForm()}
    `;
  }

  renderNoteForm() {
    return `
      <div class="note-add">
        <input 
          type="text" 
          class="note-input" 
          placeholder="Add a new note..." 
          maxlength="200"
        >
        <button class="btn btn-primary" data-action="add-note">
          <i class="fas fa-plus"></i>
        </button>
      </div>
    `;
  }

  renderConfig() {
    return `
      <div class="module-config">
        <p>Notes are managed directly in the module. Use the input field below to add notes and click the trash icon to delete them.</p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel-config">Close</button>
        </div>
      </div>
    `;
  }

  handleCustomAction(action, event) {
    switch (action) {
      case 'add-note':
        this.addNote();
        break;
      case 'delete-note':
        const index = parseInt(event.target.closest('[data-index]').dataset.index);
        this.deleteNote(index);
        break;
    }
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Handle Enter key in note input
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('note-input')) {
        this.addNote();
      }
    });
  }

  async addNote() {
    const input = this.container.querySelector('.note-input');
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    const notes = this.config.notes || [];
    const newNote = {
      id: generateId(),
      content: content,
      created: new Date().toISOString()
    };

    notes.unshift(newNote); // Add to beginning
    
    // Limit to 10 notes for free tier
    const user = api.getCurrentUser();
    const maxNotes = user?.subscription_level === 'premium' ? 50 : 10;
    
    if (notes.length > maxNotes) {
      notes.splice(maxNotes);
      Toast.warning(`Note limit reached. Oldest notes removed. Upgrade to Premium for more notes.`);
    }

    this.config.notes = notes;
    
    // Clear input
    input.value = '';

    // Save and re-render
    await this.saveConfig();
  }

  async deleteNote(index) {
    const notes = this.config.notes || [];
    if (index >= 0 && index < notes.length) {
      notes.splice(index, 1);
      this.config.notes = notes;
      await this.saveConfig();
    }
  }

  async saveConfig() {
    try {
      await api.updateModuleConfig(this.id, this.config);
      this.render();
    } catch (error) {
      console.error('Failed to save notes:', error);
      Toast.error('Failed to save note');
    }
  }
}

// Register module type
window.NotesModule = NotesModule;