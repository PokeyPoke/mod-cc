const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', '..', 'database.sqlite');
    this.db = new sqlite3.Database(dbPath);
    this.db.run('PRAGMA foreign_keys = ON');
  }

  // Promisify database operations
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // User operations
  async createUser(email, hashedPassword) {
    return await this.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
  }

  async getUserByEmail(email) {
    return await this.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  async getUserById(id) {
    return await this.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  async updateUserSubscription(userId, level, expires) {
    return await this.run('UPDATE users SET subscription_level = ?, subscription_expires = ? WHERE id = ?', [level, expires, userId]);
  }

  // Module operations
  async createModule(userId, type, config = '{}') {
    return await this.run('INSERT INTO modules (user_id, type, config) VALUES (?, ?, ?)', [userId, type, config]);
  }

  async getUserModules(userId) {
    return await this.all('SELECT * FROM modules WHERE user_id = ? ORDER BY created_at', [userId]);
  }

  async getModuleById(id, userId) {
    return await this.get('SELECT * FROM modules WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async updateModuleConfig(id, userId, config) {
    return await this.run('UPDATE modules SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [config, id, userId]);
  }

  async deleteModule(id, userId) {
    return await this.run('DELETE FROM modules WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async getModuleCount(userId) {
    const result = await this.get('SELECT COUNT(*) as count FROM modules WHERE user_id = ?', [userId]);
    return result.count;
  }

  // Settings operations
  async getUserSettings(userId) {
    return await this.get('SELECT * FROM settings WHERE user_id = ?', [userId]);
  }

  async createUserSettings(userId, theme = 'light', layoutPreference = 'grid') {
    return await this.run('INSERT OR REPLACE INTO settings (user_id, theme, default_layout_preference) VALUES (?, ?, ?)', [userId, theme, layoutPreference]);
  }

  async updateUserSettings(userId, settings) {
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
    return await this.run(`UPDATE settings SET ${fields.join(', ')} WHERE user_id = ?`, values);
  }

  // API Keys operations
  async createApiKey(userId, service, encryptedKey) {
    return await this.run('INSERT INTO api_keys (user_id, service, api_key) VALUES (?, ?, ?)', [userId, service, encryptedKey]);
  }

  async getUserApiKeys(userId) {
    return await this.all('SELECT id, service, is_active, created_at FROM api_keys WHERE user_id = ? AND is_active = 1', [userId]);
  }

  async getApiKey(userId, service) {
    return await this.get('SELECT api_key FROM api_keys WHERE user_id = ? AND service = ? AND is_active = 1', [userId, service]);
  }

  async deleteApiKey(userId, service) {
    return await this.run('UPDATE api_keys SET is_active = 0 WHERE user_id = ? AND service = ?', [userId, service]);
  }

  // Device operations
  async createDevice(userId, name, type, apiKey = null) {
    return await this.run('INSERT INTO devices (user_id, name, type, api_key) VALUES (?, ?, ?, ?)', [userId, name, type, apiKey]);
  }

  async getUserDevices(userId) {
    return await this.all('SELECT * FROM devices WHERE user_id = ? ORDER BY created_at', [userId]);
  }

  async getDeviceById(id, userId) {
    return await this.get('SELECT * FROM devices WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async getDeviceByApiKey(apiKey) {
    return await this.get('SELECT * FROM devices WHERE api_key = ?', [apiKey]);
  }

  async updateDeviceAccess(id) {
    return await this.run('UPDATE devices SET last_access = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  async deleteDevice(id, userId) {
    return await this.run('DELETE FROM devices WHERE id = ? AND user_id = ?', [id, userId]);
  }

  // Layout operations
  async getDeviceLayout(deviceId, deviceType) {
    const result = await this.get('SELECT layout_data FROM device_layouts WHERE device_id = ? AND device_type = ?', [deviceId, deviceType]);
    return result ? JSON.parse(result.layout_data) : [];
  }

  async saveDeviceLayout(deviceId, deviceType, layoutData) {
    return await this.run(`
      INSERT OR REPLACE INTO device_layouts (device_id, device_type, layout_data, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [deviceId, deviceType, JSON.stringify(layoutData)]);
  }

  async getUserLayoutsByType(userId, deviceType) {
    const result = await this.get(`
      SELECT dl.layout_data FROM device_layouts dl
      JOIN devices d ON dl.device_id = d.id
      WHERE d.user_id = ? AND dl.device_type = ?
      ORDER BY dl.updated_at DESC
      LIMIT 1
    `, [userId, deviceType]);
    return result ? JSON.parse(result.layout_data) : [];
  }

  close() {
    this.db.close();
  }
}

module.exports = new DatabaseService();