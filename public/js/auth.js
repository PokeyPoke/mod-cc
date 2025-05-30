// Authentication handling for login/register page

ready(() => {
  // Redirect if already authenticated
  if (redirectIfAuthenticated()) {
    return;
  }

  // Tab switching
  const authTabs = document.querySelectorAll('.auth-tab');
  const authForms = document.querySelectorAll('.auth-form');

  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Update active tab
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active form
      authForms.forEach(form => {
        form.classList.remove('active');
        if (form.id === `${targetTab}-form`) {
          form.classList.add('active');
        }
      });
    });
  });

  // Login form handling
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      // Clear previous errors
      Form.clearAllErrors(loginForm);
      
      // Validate inputs
      let hasErrors = false;
      
      if (!Validation.email(email)) {
        Form.setError('login-email', 'Please enter a valid email address');
        hasErrors = true;
      }
      
      if (!Validation.required(password)) {
        Form.setError('login-password', 'Password is required');
        hasErrors = true;
      }
      
      if (hasErrors) return;
      
      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      
      try {
        await api.login(email, password);
        Toast.success('Login successful!');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
        
      } catch (error) {
        console.error('Login failed:', error);
        Toast.error(error.message || 'Login failed. Please try again.');
        
        // Reset button state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Register form handling
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm').value;
      
      // Clear previous errors
      Form.clearAllErrors(registerForm);
      
      // Validate inputs
      let hasErrors = false;
      
      if (!Validation.email(email)) {
        Form.setError('register-email', 'Please enter a valid email address');
        hasErrors = true;
      }
      
      if (!Validation.password(password)) {
        Form.setError('register-password', 'Password must be at least 6 characters long');
        hasErrors = true;
      }
      
      if (password !== confirmPassword) {
        Form.setError('register-confirm', 'Passwords do not match');
        hasErrors = true;
      }
      
      if (hasErrors) return;
      
      // Show loading state
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      
      try {
        await api.register(email, password);
        Toast.success('Account created successfully!');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
        
      } catch (error) {
        console.error('Registration failed:', error);
        Toast.error(error.message || 'Registration failed. Please try again.');
        
        // Reset button state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Real-time validation
  const validateField = (fieldId, validationType) => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.addEventListener('blur', () => {
      const value = field.value;
      Form.clearError(fieldId);
      
      switch (validationType) {
        case 'email':
          if (value && !Validation.email(value)) {
            Form.setError(fieldId, 'Please enter a valid email address');
          }
          break;
        case 'password':
          if (value && !Validation.password(value)) {
            Form.setError(fieldId, 'Password must be at least 6 characters long');
          }
          break;
        case 'confirm-password':
          const passwordField = document.getElementById('register-password');
          if (value && passwordField && value !== passwordField.value) {
            Form.setError(fieldId, 'Passwords do not match');
          }
          break;
      }
    });
    
    // Clear error on input
    field.addEventListener('input', () => {
      Form.clearError(fieldId);
    });
  };

  // Set up real-time validation
  validateField('login-email', 'email');
  validateField('register-email', 'email');
  validateField('register-password', 'password');
  validateField('register-confirm', 'confirm-password');

  // Password confirmation validation on password change
  const registerPassword = document.getElementById('register-password');
  const registerConfirm = document.getElementById('register-confirm');
  
  if (registerPassword && registerConfirm) {
    registerPassword.addEventListener('input', () => {
      if (registerConfirm.value) {
        Form.clearError('register-confirm');
        if (registerPassword.value !== registerConfirm.value) {
          Form.setError('register-confirm', 'Passwords do not match');
        }
      }
    });
  }
});