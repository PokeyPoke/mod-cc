const express = require('express');
const { validate, schemas } = require('../utils/validation');
const db = require('../services/database');
const { verifyToken, checkSubscription } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();

// Get user settings
router.get('/', verifyToken, checkSubscription(), (req, res) => {
  try {
    let settings = db.getUserSettings(req.userId);
    
    if (!settings) {
      // Create default settings
      db.createUserSettings(req.userId);
      settings = db.getUserSettings(req.userId);
    }
    
    res.json({
      theme: settings.theme,
      default_layout_preference: settings.default_layout_preference
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', verifyToken, checkSubscription(), (req, res) => {
  try {
    const settings = validate(schemas.settings.update, req.body);
    
    db.updateUserSettings(req.userId, settings);
    
    const updatedSettings = db.getUserSettings(req.userId);
    
    res.json({
      theme: updatedSettings.theme,
      default_layout_preference: updatedSettings.default_layout_preference
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user API keys (service names only)
router.get('/api-keys', verifyToken, checkSubscription(), (req, res) => {
  try {
    const apiKeys = db.getUserApiKeys(req.userId);
    
    res.json(apiKeys.map(key => ({
      id: key.id,
      service: key.service,
      created_at: key.created_at,
      is_active: key.is_active
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Add or update API key
router.post('/api-keys', verifyToken, checkSubscription(), (req, res) => {
  try {
    const { service, api_key } = validate(schemas.apiKey.create, req.body);
    
    // Delete existing key for this service
    db.deleteApiKey(req.userId, service);
    
    // Encrypt and store new key
    const encryptedKey = encrypt(api_key);
    const result = db.createApiKey(req.userId, service, encryptedKey);
    
    res.status(201).json({
      id: result.lastInsertRowid,
      service,
      message: 'API key saved successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete API key
router.delete('/api-keys/:service', verifyToken, checkSubscription(), (req, res) => {
  try {
    const { service } = req.params;
    
    db.deleteApiKey(req.userId, service);
    
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get subscription info
router.get('/subscription', verifyToken, checkSubscription(), (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      level: user.subscription_level,
      expires: user.subscription_expires,
      features: {
        maxModules: user.subscription_level === 'premium' ? 'unlimited' : 5,
        dataRefreshInterval: user.subscription_level === 'premium' ? '15min' : '60min',
        iotSupport: user.subscription_level === 'premium',
        apiKeySupport: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription info' });
  }
});

// Update subscription (simplified - in production would integrate with payment processor)
router.post('/subscription', verifyToken, checkSubscription(), (req, res) => {
  try {
    const { level } = req.body;
    
    if (!['free', 'premium'].includes(level)) {
      return res.status(400).json({ error: 'Invalid subscription level' });
    }
    
    let expires = null;
    if (level === 'premium') {
      // Set expiration to 30 days from now
      expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    db.updateUserSubscription(req.userId, level, expires);
    
    res.json({
      message: 'Subscription updated successfully',
      level,
      expires
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;