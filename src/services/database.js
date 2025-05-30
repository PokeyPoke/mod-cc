const path = require('path');

// Database adapter that switches between SQLite (dev) and PostgreSQL (prod)
class DatabaseService {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    
    // Use PostgreSQL if DATABASE_URL is set (Heroku), otherwise SQLite
    if (databaseUrl && databaseUrl.startsWith('postgres')) {
      this.dbType = 'postgres';
      const { Pool } = require('pg');
      this.db = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    } else {
      this.dbType = 'sqlite';
      const sqlite3 = require('sqlite3').verbose();
      const dbPath = databaseUrl || path.join(__dirname, '..', '..', 'database.sqlite');
      this.db = new sqlite3.Database(dbPath);
      this.db.run('PRAGMA foreign_keys = ON');
    }
  }

  // Convert parameter placeholders based on database type
  adaptParams(sql, params) {
    if (this.dbType === 'postgres') {
      // PostgreSQL uses $1, $2, $3, etc.
      let paramIndex = 1;
      const adaptedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      return { sql: adaptedSql, params };
    } else {
      // SQLite uses ? placeholders
      return { sql, params };
    }
  }

  // Universal query method
  async query(sql, params = []) {
    const { sql: adaptedSql, params: adaptedParams } = this.adaptParams(sql, params);
    
    if (this.dbType === 'postgres') {
      try {
        const result = await this.db.query(adaptedSql, adaptedParams);
        return result.rows;
      } catch (error) {
        throw error;
      }
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        this.db.all(adaptedSql, adaptedParams, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  }

  // Universal single row method
  async get(sql, params = []) {
    const { sql: adaptedSql, params: adaptedParams } = this.adaptParams(sql, params);
    
    if (this.dbType === 'postgres') {
      try {
        const result = await this.db.query(adaptedSql, adaptedParams);
        return result.rows[0] || null;
      } catch (error) {
        throw error;
      }
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        this.db.get(adaptedSql, adaptedParams, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  }

  // Universal run method (INSERT/UPDATE/DELETE)
  async run(sql, params = []) {
    const { sql: adaptedSql, params: adaptedParams } = this.adaptParams(sql, params);
    
    if (this.dbType === 'postgres') {
      try {
        // For INSERT statements, try to add RETURNING to get the ID
        let finalSql = adaptedSql;
        if (adaptedSql.trim().toUpperCase().startsWith('INSERT') && !adaptedSql.includes('RETURNING')) {
          finalSql = adaptedSql + ' RETURNING *';
        }
        
        const result = await this.db.query(finalSql, adaptedParams);
        return { 
          lastID: result.rows[0]?.id || null, 
          changes: result.rowCount || 0,
          rows: result.rows
        };
      } catch (error) {
        // If RETURNING fails, try without it
        if (error.message.includes('RETURNING')) {
          try {
            const result = await this.db.query(adaptedSql, adaptedParams);
            return { lastID: null, changes: result.rowCount || 0 };
          } catch (innerError) {
            throw error; // Throw original error
          }
        }
        throw error;
      }
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        this.db.run(adaptedSql, adaptedParams, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
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
    return await this.query('SELECT * FROM modules WHERE user_id = ? ORDER BY created_at', [userId]);
  }

  async getModuleById(id, userId) {
    return await this.get('SELECT * FROM modules WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async updateModuleConfig(id, userId, config) {
    const sql = this.dbType === 'postgres' 
      ? 'UPDATE modules SET config = ?, updated_at = NOW() WHERE id = ? AND user_id = ?'
      : 'UPDATE modules SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
    return await this.run(sql, [config, id, userId]);
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
    if (this.dbType === 'postgres') {
      // PostgreSQL doesn't have INSERT OR REPLACE, use ON CONFLICT
      return await this.run(`
        INSERT INTO settings (user_id, theme, default_layout_preference) 
        VALUES (?, ?, ?) 
        ON CONFLICT (user_id) DO UPDATE SET 
        theme = EXCLUDED.theme, 
        default_layout_preference = EXCLUDED.default_layout_preference
      `, [userId, theme, layoutPreference]);
    } else {
      return await this.run('INSERT OR REPLACE INTO settings (user_id, theme, default_layout_preference) VALUES (?, ?, ?)', [userId, theme, layoutPreference]);
    }
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
    const activeValue = this.dbType === 'postgres' ? 'true' : '1';
    return await this.query(`SELECT id, service, is_active, created_at FROM api_keys WHERE user_id = ? AND is_active = ${activeValue}`, [userId]);
  }

  async getApiKey(userId, service) {
    const activeValue = this.dbType === 'postgres' ? 'true' : '1';
    return await this.get(`SELECT api_key FROM api_keys WHERE user_id = ? AND service = ? AND is_active = ${activeValue}`, [userId, service]);
  }

  async deleteApiKey(userId, service) {
    const inactiveValue = this.dbType === 'postgres' ? 'false' : '0';
    return await this.run(`UPDATE api_keys SET is_active = ${inactiveValue} WHERE user_id = ? AND service = ?`, [userId, service]);
  }

  // Device operations
  async createDevice(userId, name, type, apiKey = null) {
    return await this.run('INSERT INTO devices (user_id, name, type, api_key) VALUES (?, ?, ?, ?)', [userId, name, type, apiKey]);
  }

  async getUserDevices(userId) {
    return await this.query('SELECT * FROM devices WHERE user_id = ? ORDER BY created_at', [userId]);
  }

  async getDeviceById(id, userId) {
    return await this.get('SELECT * FROM devices WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async getDeviceByApiKey(apiKey) {
    return await this.get('SELECT * FROM devices WHERE api_key = ?', [apiKey]);
  }

  async updateDeviceAccess(id) {
    const sql = this.dbType === 'postgres' 
      ? 'UPDATE devices SET last_access = NOW() WHERE id = ?'
      : 'UPDATE devices SET last_access = CURRENT_TIMESTAMP WHERE id = ?';
    return await this.run(sql, [id]);
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
    if (this.dbType === 'postgres') {
      return await this.run(`
        INSERT INTO device_layouts (device_id, device_type, layout_data, updated_at) 
        VALUES (?, ?, ?, NOW()) 
        ON CONFLICT (device_id, device_type) DO UPDATE SET 
        layout_data = EXCLUDED.layout_data, 
        updated_at = NOW()
      `, [deviceId, deviceType, JSON.stringify(layoutData)]);
    } else {
      return await this.run(`
        INSERT OR REPLACE INTO device_layouts (device_id, device_type, layout_data, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [deviceId, deviceType, JSON.stringify(layoutData)]);
    }
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
    if (this.dbType === 'postgres') {
      this.db.end();
    } else {
      this.db.close();
    }
  }
}

module.exports = new DatabaseService();