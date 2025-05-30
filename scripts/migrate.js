const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

function migrate() {
  console.log('Starting database migration...');
  
  try {
    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = ON');
    
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        subscription_level TEXT DEFAULT 'free' CHECK (subscription_level IN ('free', 'premium')),
        subscription_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Modules table
    db.exec(`
      CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        config TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    
    // Settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'blue', 'green')),
        default_layout_preference TEXT DEFAULT 'grid',
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    
    // API Keys table
    db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        service TEXT NOT NULL,
        api_key TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    
    // Devices table
    db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('web', 'mobile', 'iot')),
        api_key TEXT,
        last_access DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    
    // Device Layouts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS device_layouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        device_type TEXT NOT NULL,
        layout_data TEXT DEFAULT '[]',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `);
    
    // Create indexes for performance
    db.exec('CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules (user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices (user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_device_layouts_device_id ON device_layouts (device_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_device_layouts_device_type ON device_layouts (device_type)');
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;