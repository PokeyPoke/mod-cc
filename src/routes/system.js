const express = require('express');
const db = require('../services/database');

const router = express.Router();

// System status endpoint
router.get('/status', (req, res) => {
  try {
    // Basic health check
    const timestamp = new Date().toISOString();
    
    res.json({
      status: 'healthy',
      timestamp,
      version: '1.0.0',
      api_version: 'v1',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    name: 'Modular Dashboard API',
    version: '1.0.0',
    base_url: '/api/v1',
    endpoints: {
      auth: {
        'POST /auth/register': 'Register new user',
        'POST /auth/login': 'User login',
        'POST /auth/refresh': 'Refresh JWT token'
      },
      modules: {
        'GET /modules/list': 'Get user modules',
        'POST /modules/create': 'Create new module',
        'GET /modules/:id/data': 'Get module data',
        'PUT /modules/:id/config': 'Update module config',
        'DELETE /modules/:id': 'Delete module'
      },
      devices: {
        'POST /devices/register': 'Register new device',
        'GET /devices/list': 'Get user devices',
        'PUT /devices/:id': 'Update device',
        'DELETE /devices/:id': 'Delete device'
      },
      layouts: {
        'GET /layouts/:deviceType': 'Get device layout',
        'PUT /layouts/:deviceType': 'Save device layout'
      },
      settings: {
        'GET /settings': 'Get user settings',
        'PUT /settings': 'Update user settings',
        'GET /settings/api-keys': 'Get API keys',
        'POST /settings/api-keys': 'Add API key',
        'DELETE /settings/api-keys/:service': 'Delete API key',
        'GET /settings/subscription': 'Get subscription info',
        'POST /settings/subscription': 'Update subscription'
      },
      system: {
        'GET /system/status': 'System health check',
        'GET /system/docs': 'API documentation'
      }
    },
    authentication: 'JWT Bearer token required for most endpoints',
    device_auth: 'IoT devices use X-Device-Key header'
  });
});

module.exports = router;