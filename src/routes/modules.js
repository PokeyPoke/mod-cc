const express = require('express');
const { validate, schemas } = require('../utils/validation');
const db = require('../services/database');
const { verifyToken, verifyDeviceToken, checkSubscription } = require('../middleware/auth');
const moduleService = require('../services/modules');

const router = express.Router();

// Get all modules for user
router.get('/list', verifyToken, checkSubscription(), async (req, res) => {
  try {
    const modules = await db.getUserModules(req.userId);
    res.json(modules.map(module => ({
      ...module,
      config: JSON.parse(module.config)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// Create new module
router.post('/create', verifyToken, checkSubscription(), async (req, res) => {
  try {
    const { type, config } = validate(schemas.module.create, req.body);
    
    // Check module limit for free users
    if (req.user.subscription_level === 'free') {
      const moduleCount = await db.getModuleCount(req.userId);
      if (moduleCount >= 5) {
        return res.status(403).json({ 
          error: 'Free tier limited to 5 modules. Upgrade to premium for unlimited modules.' 
        });
      }
    }
    
    // Validate module type
    const validTypes = ['weather', 'notes', 'todo', 'countdown', 'links', 'custom'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid module type' });
    }
    
    const result = await db.createModule(req.userId, type, JSON.stringify(config));
    const moduleId = result.lastID;
    
    const newModule = await db.getModuleById(moduleId, req.userId);
    
    res.status(201).json({
      ...newModule,
      config: JSON.parse(newModule.config)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get module data (supports both user auth and device auth for IoT)
router.get('/:id/data', (req, res, next) => {
  // Try device auth first (for IoT), then user auth
  const deviceKey = req.headers['x-device-key'];
  if (deviceKey) {
    verifyDeviceToken(req, res, next);
  } else {
    verifyToken(req, res, next);
  }
}, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    const module = await db.getModuleById(moduleId, req.userId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    const config = JSON.parse(module.config);
    const data = await moduleService.getModuleData(module.type, config, req.userId, req.deviceType);
    
    res.json({
      id: module.id,
      type: module.type,
      data,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Module data fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch module data',
      data: null // Graceful degradation
    });
  }
});

// Update module configuration
router.put('/:id/config', verifyToken, checkSubscription(), async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    const { config } = validate(schemas.module.update, req.body);
    
    const module = await db.getModuleById(moduleId, req.userId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    await db.updateModuleConfig(moduleId, req.userId, JSON.stringify(config));
    
    const updatedModule = await db.getModuleById(moduleId, req.userId);
    res.json({
      ...updatedModule,
      config: JSON.parse(updatedModule.config)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete module
router.delete('/:id', verifyToken, checkSubscription(), async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    
    const module = await db.getModuleById(moduleId, req.userId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    await db.deleteModule(moduleId, req.userId);
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

module.exports = router;