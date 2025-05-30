const express = require('express');
const { validate, schemas } = require('../utils/validation');
const db = require('../services/database');
const { verifyToken, checkSubscription } = require('../middleware/auth');

const router = express.Router();

// Get layout for device type
router.get('/:deviceType', verifyToken, checkSubscription(), (req, res) => {
  try {
    const { deviceType } = req.params;
    
    if (!['web', 'mobile', 'iot'].includes(deviceType)) {
      return res.status(400).json({ error: 'Invalid device type' });
    }
    
    const layout = db.getUserLayoutsByType(req.userId, deviceType);
    
    res.json({
      deviceType,
      layout
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch layout' });
  }
});

// Save layout for device type
router.put('/:deviceType', verifyToken, checkSubscription(), (req, res) => {
  try {
    const { deviceType } = req.params;
    
    if (!['web', 'mobile', 'iot'].includes(deviceType)) {
      return res.status(400).json({ error: 'Invalid device type' });
    }
    
    const { layoutData } = validate(schemas.layout.save, req.body);
    
    // Find or create a device for this type and user
    const devices = db.getUserDevices(req.userId);
    let device = devices.find(d => d.type === deviceType);
    
    if (!device) {
      // Create default device for this type
      const result = db.createDevice(req.userId, `Default ${deviceType}`, deviceType);
      device = { id: result.lastInsertRowid, type: deviceType };
    }
    
    // Save the layout
    db.saveDeviceLayout(device.id, deviceType, layoutData);
    
    res.json({
      message: 'Layout saved successfully',
      deviceType,
      layout: layoutData
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;