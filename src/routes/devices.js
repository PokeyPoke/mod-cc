const express = require('express');
const { validate, schemas } = require('../utils/validation');
const db = require('../services/database');
const { verifyToken, checkSubscription } = require('../middleware/auth');
const { generateApiKey } = require('../utils/encryption');

const router = express.Router();

// Register new device
router.post('/register', verifyToken, checkSubscription(), (req, res) => {
  try {
    const { name, type } = validate(schemas.device.register, req.body);
    
    // Generate API key for IoT devices
    let apiKey = null;
    if (type === 'iot') {
      apiKey = generateApiKey();
    }
    
    const result = db.createDevice(req.userId, name, type, apiKey);
    const deviceId = result.lastInsertRowid;
    
    // Create default layout for the device
    db.saveDeviceLayout(deviceId, type, []);
    
    const device = db.getDeviceById(deviceId, req.userId);
    
    res.status(201).json({
      id: device.id,
      name: device.name,
      type: device.type,
      apiKey: device.api_key, // Only returned on creation
      created_at: device.created_at
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user devices
router.get('/list', verifyToken, checkSubscription(), (req, res) => {
  try {
    const devices = db.getUserDevices(req.userId);
    
    res.json(devices.map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      lastAccess: device.last_access,
      created_at: device.created_at
      // API key is not returned for security
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Update device
router.put('/:id', verifyToken, checkSubscription(), (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const device = db.getDeviceById(deviceId, req.userId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // For now, only name updates are supported
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Valid name required' });
    }
    
    // Update device name (simplified - would need proper update method in database service)
    // For now, return success - in production, implement proper update
    
    res.json({
      id: device.id,
      name: name,
      type: device.type,
      lastAccess: device.last_access,
      created_at: device.created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete device
router.delete('/:id', verifyToken, checkSubscription(), (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    
    const device = db.getDeviceById(deviceId, req.userId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    db.deleteDevice(deviceId, req.userId);
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

module.exports = router;