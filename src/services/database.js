const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', '..', 'database.sqlite');
    this.db = new Database(dbPath);
    this.db.exec('PRAGMA foreign_keys = ON');
  }

  // User operations
  createUser(email, hashedPassword) {
    const stmt = this.db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    return stmt.run(email, hashedPassword);
  }

  getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  updateUserSubscription(userId, level, expires) {
    const stmt = this.db.prepare('UPDATE users SET subscription_level = ?, subscription_expires = ? WHERE id = ?');
    return stmt.run(level, expires, userId);
  }

  // Module operations
  createModule(userId, type, config = '{}') {
    const stmt = this.db.prepare('INSERT INTO modules (user_id, type, config) VALUES (?, ?, ?)');
    return stmt.run(userId, type, config);
  }

  getUserModules(userId) {
    const stmt = this.db.prepare('SELECT * FROM modules WHERE user_id = ? ORDER BY created_at');
    return stmt.all(userId);
  }

  getModuleById(id, userId) {
    const stmt = this.db.prepare('SELECT * FROM modules WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId);
  }

  updateModuleConfig(id, userId, config) {
    const stmt = this.db.prepare('UPDATE modules SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?');
    return stmt.run(config, id, userId);
  }

  deleteModule(id, userId) {
    const stmt = this.db.prepare('DELETE FROM modules WHERE id = ? AND user_id = ?');
    return stmt.run(id, userId);
  }

  getModuleCount(userId) {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM modules WHERE user_id = ?');
    return stmt.get(userId).count;
  }

  // Settings operations
  getUserSettings(userId) {
    const stmt = this.db.prepare('SELECT * FROM settings WHERE user_id = ?');
    return stmt.get(userId);
  }

  createUserSettings(userId, theme = 'light', layoutPreference = 'grid') {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (user_id, theme, default_layout_preference) VALUES (?, ?, ?)');
    return stmt.run(userId, theme, layoutPreference);
  }

  updateUserSettings(userId, settings) {
    const fields = [];
    const values = [];
    
    if (settings.theme) {
      fields.push('theme = ?');
      values.push(settings.theme);
    }
    if (settings.default_layout_preference) {
      fields.push('default_layout_preference = ?');
      values.push(settings.default_layout_preference);
    }
    
    if (fields.length === 0) return null;
    
    values.push(userId);
    const stmt = this.db.prepare(`UPDATE settings SET ${fields.join(', ')} WHERE user_id = ?`);
    return stmt.run(...values);
  }

  // API Keys operations
  createApiKey(userId, service, encryptedKey) {
    const stmt = this.db.prepare('INSERT INTO api_keys (user_id, service, api_key) VALUES (?, ?, ?)');
    return stmt.run(userId, service, encryptedKey);
  }

  getUserApiKeys(userId) {
    const stmt = this.db.prepare('SELECT id, service, is_active, created_at FROM api_keys WHERE user_id = ? AND is_active = 1');
    return stmt.all(userId);
  }

  getApiKey(userId, service) {
    const stmt = this.db.prepare('SELECT api_key FROM api_keys WHERE user_id = ? AND service = ? AND is_active = 1');
    return stmt.get(userId, service);
  }

  deleteApiKey(userId, service) {
    const stmt = this.db.prepare('UPDATE api_keys SET is_active = 0 WHERE user_id = ? AND service = ?');
    return stmt.run(userId, service);
  }

  // Device operations
  createDevice(userId, name, type, apiKey = null) {
    const stmt = this.db.prepare('INSERT INTO devices (user_id, name, type, api_key) VALUES (?, ?, ?, ?)');
    return stmt.run(userId, name, type, apiKey);
  }

  getUserDevices(userId) {
    const stmt = this.db.prepare('SELECT * FROM devices WHERE user_id = ? ORDER BY created_at');
    return stmt.all(userId);
  }

  getDeviceById(id, userId) {
    const stmt = this.db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId);
  }

  getDeviceByApiKey(apiKey) {
    const stmt = this.db.prepare('SELECT * FROM devices WHERE api_key = ?');
    return stmt.get(apiKey);
  }

  updateDeviceAccess(id) {
    const stmt = this.db.prepare('UPDATE devices SET last_access = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
  }

  deleteDevice(id, userId) {
    const stmt = this.db.prepare('DELETE FROM devices WHERE id = ? AND user_id = ?');
    return stmt.run(id, userId);
  }

  // Layout operations
  getDeviceLayout(deviceId, deviceType) {
    const stmt = this.db.prepare('SELECT layout_data FROM device_layouts WHERE device_id = ? AND device_type = ?');
    const result = stmt.get(deviceId, deviceType);
    return result ? JSON.parse(result.layout_data) : [];
  }

  saveDeviceLayout(deviceId, deviceType, layoutData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO device_layouts (device_id, device_type, layout_data, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(deviceId, deviceType, JSON.stringify(layoutData));
  }

  getUserLayoutsByType(userId, deviceType) {
    const stmt = this.db.prepare(`
      SELECT dl.layout_data FROM device_layouts dl
      JOIN devices d ON dl.device_id = d.id
      WHERE d.user_id = ? AND dl.device_type = ?
      ORDER BY dl.updated_at DESC
      LIMIT 1
    `);
    const result = stmt.get(userId, deviceType);
    return result ? JSON.parse(result.layout_data) : [];
  }

  close() {
    this.db.close();
  }
}

module.exports = new DatabaseService();