// Todo Module

class TodoModule extends BaseModule {
  getIcon() {
    return 'fas fa-check-square';
  }

  getTitle() {
    return 'Todo List';
  }

  getDefaultConfig() {
    return {
      todos: []
    };
  }

  renderData() {
    const todos = this.config.todos || [];
    const completed = todos.filter(todo => todo.completed).length;
    const pending = todos.length - completed;

    return `
      <div class="todo-stats">
        <div class="todo-stat">
          <div class="todo-stat-number">${pending}</div>
          <div class="todo-stat-label">Pending</div>
        </div>
        <div class="todo-stat">
          <div class="todo-stat-number">${completed}</div>
          <div class="todo-stat-label">Completed</div>
        </div>
        <div class="todo-stat">
          <div class="todo-stat-number">${todos.length}</div>
          <div class="todo-stat-label">Total</div>
        </div>
      </div>
      
      ${todos.length === 0 ? `
        <div class="empty-todos" style="text-align: center; color: var(--text-secondary); padding: 20px;">
          <i class="fas fa-check-square" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>No todos yet. Add your first task below.</p>
        </div>
      ` : `
        <div class="todo-list">
          ${todos.map((todo, index) => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
              <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''} 
                data-action="toggle-todo" 
                data-index="${index}"
              >
              <span class="todo-text">${this.escapeHtml(todo.text)}</span>
              <button class="btn-icon" data-action="delete-todo" data-index="${index}" title="Delete task">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `).join('')}
        </div>
      `}
      
      ${this.renderTodoForm()}
    `;
  }

  renderTodoForm() {
    return `
      <div class="todo-add">
        <input 
          type="text" 
          class="todo-input" 
          placeholder="Add a new task..." 
          maxlength="100"
        >
        <button class="btn btn-primary" data-action="add-todo">
          <i class="fas fa-plus"></i>
        </button>
      </div>
    `;
  }

  renderConfig() {
    return `
      <div class="module-config">
        <p>Todo items are managed directly in the module. Use the input field to add tasks and check them off when completed.</p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel-config">Close</button>
          <button type="button" class="btn btn-secondary" data-action="clear-completed">Clear Completed</button>
        </div>
      </div>
    `;
  }

  handleCustomAction(action, event) {
    switch (action) {
      case 'add-todo':
        this.addTodo();
        break;
      case 'toggle-todo':
        const toggleIndex = parseInt(event.target.dataset.index);
        this.toggleTodo(toggleIndex);
        break;
      case 'delete-todo':
        const deleteIndex = parseInt(event.target.closest('[data-index]').dataset.index);
        this.deleteTodo(deleteIndex);
        break;
      case 'clear-completed':
        this.clearCompleted();
        break;
    }
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Handle Enter key in todo input
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('todo-input')) {
        this.addTodo();
      }
    });
  }

  async addTodo() {
    const input = this.container.querySelector('.todo-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const todos = this.config.todos || [];
    const newTodo = {
      id: generateId(),
      text: text,
      completed: false,
      created: new Date().toISOString()
    };

    todos.push(newTodo);
    
    // Limit todos for free tier
    const user = api.getCurrentUser();
    const maxTodos = user?.subscription_level === 'premium' ? 100 : 20;
    
    if (todos.length > maxTodos) {
      Toast.warning(`Todo limit reached (${maxTodos}). Upgrade to Premium for more todos.`);
      return;
    }

    this.config.todos = todos;
    
    // Clear input
    input.value = '';

    // Save and re-render
    await this.saveConfig();
  }

  async toggleTodo(index) {
    const todos = this.config.todos || [];
    if (index >= 0 && index < todos.length) {
      todos[index].completed = !todos[index].completed;
      todos[index].completedAt = todos[index].completed ? new Date().toISOString() : null;
      
      this.config.todos = todos;
      await this.saveConfig();
    }
  }

  async deleteTodo(index) {
    const todos = this.config.todos || [];
    if (index >= 0 && index < todos.length) {
      todos.splice(index, 1);
      this.config.todos = todos;
      await this.saveConfig();
    }
  }

  async clearCompleted() {
    const todos = this.config.todos || [];
    const remaining = todos.filter(todo => !todo.completed);
    
    if (remaining.length === todos.length) {
      Toast.info('No completed todos to clear');
      return;
    }
    
    this.config.todos = remaining;
    await this.saveConfig();
    Toast.success('Completed todos cleared');
  }

  async saveConfig() {
    try {
      await api.updateModuleConfig(this.id, this.config);
      this.render();
    } catch (error) {
      console.error('Failed to save todos:', error);
      Toast.error('Failed to save todo');
    }
  }
}

// Register module type
window.TodoModule = TodoModule;