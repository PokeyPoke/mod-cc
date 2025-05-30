const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', 'database.sqlite');

function migrate() {
  console.log('Starting database migration...');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
    });

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err);
        reject(err);
        return;
      }
    });
    
    // Run migrations in sequence
    const migrations = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        subscription_level TEXT DEFAULT 'free' CHECK (subscription_level IN ('free', 'premium')),
        subscription_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Modules table
      `CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        config TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'blue', 'green')),
        default_layout_preference TEXT DEFAULT 'grid',
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // API Keys table
      `CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        service TEXT NOT NULL,
        api_key TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Devices table
      `CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('web', 'mobile', 'iot')),
        api_key TEXT,
        last_access DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Device Layouts table
      `CREATE TABLE IF NOT EXISTS device_layouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        device_type TEXT NOT NULL,
        layout_data TEXT DEFAULT '[]',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )`,
      
      // Create indexes for performance
      'CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_device_layouts_device_id ON device_layouts (device_id)',
      'CREATE INDEX IF NOT EXISTS idx_device_layouts_device_type ON device_layouts (device_type)'
    ];

    let completed = 0;
    
    function runNextMigration() {
      if (completed >= migrations.length) {
        console.log('Database migration completed successfully!');
        db.close();
        resolve();
        return;
      }

      db.run(migrations[completed], (err) => {
        if (err) {
          console.error(`Migration ${completed} failed:`, err);
          db.close();
          reject(err);
          return;
        }
        
        completed++;
        runNextMigration();
      });
    }

    runNextMigration();
  });
}

if (require.main === module) {
  migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = migrate;