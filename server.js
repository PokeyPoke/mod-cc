require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

// Import middleware
const { apiLimiter, authLimiter, sanitizeInput, corsOptions } = require('./src/middleware/security');

// Import routes
const authRoutes = require('./src/routes/auth');
const moduleRoutes = require('./src/routes/modules');
const deviceRoutes = require('./src/routes/devices');
const layoutRoutes = require('./src/routes/layouts');
const settingsRoutes = require('./src/routes/settings');
const systemRoutes = require('./src/routes/system');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes with rate limiting
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/modules', apiLimiter, moduleRoutes);
app.use('/api/v1/devices', apiLimiter, deviceRoutes);
app.use('/api/v1/layouts', apiLimiter, layoutRoutes);
app.use('/api/v1/settings', apiLimiter, settingsRoutes);
app.use('/api/v1/system', systemRoutes);

// Serve frontend application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 404 handler for other routes
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Run database migration on startup
  try {
    require('./scripts/migrate')();
    console.log('Database migration completed');
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
});

module.exports = app;