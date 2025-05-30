const jwt = require('jsonwebtoken');
const db = require('../services/database');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type === 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function verifyDeviceToken(req, res, next) {
  const deviceKey = req.headers['x-device-key'];
  
  if (!deviceKey) {
    return res.status(401).json({ error: 'Device key required' });
  }

  try {
    const device = db.getDeviceByApiKey(deviceKey);
    if (!device) {
      return res.status(403).json({ error: 'Invalid device key' });
    }

    req.deviceId = device.id;
    req.userId = device.user_id;
    req.deviceType = device.type;
    
    // Update last access
    db.updateDeviceAccess(device.id);
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Device authentication failed' });
  }
}

function checkSubscription(requiredLevel = 'free') {
  return (req, res, next) => {
    try {
      const user = db.getUserById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (requiredLevel === 'premium' && user.subscription_level !== 'premium') {
        return res.status(403).json({ error: 'Premium subscription required' });
      }

      // Check if premium subscription is expired
      if (user.subscription_level === 'premium' && user.subscription_expires) {
        const expires = new Date(user.subscription_expires);
        if (expires < new Date()) {
          // Downgrade to free
          db.updateUserSubscription(user.id, 'free', null);
          user.subscription_level = 'free';
        }
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Subscription check failed' });
    }
  };
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyDeviceToken,
  checkSubscription
};