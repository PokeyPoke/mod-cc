const db = require('../src/services/database');

async function migrate() {
  console.log('Starting database migration...');
  console.log(`Database type: ${db.dbType}`);
  
  try {
    // Define migrations for both SQLite and PostgreSQL
    const migrations = [];
    
    if (db.dbType === 'postgres') {
      // PostgreSQL migrations
      migrations.push(
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          subscription_level VARCHAR(20) DEFAULT 'free' CHECK (subscription_level IN ('free', 'premium')),
          subscription_expires TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        
        // Modules table
        `CREATE TABLE IF NOT EXISTS modules (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          type VARCHAR(50) NOT NULL,
          config TEXT DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        // Settings table
        `CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'blue', 'green')),
          default_layout_preference TEXT DEFAULT 'grid',
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        // API Keys table
        `CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          service VARCHAR(100) NOT NULL,
          api_key TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        // Devices table
        `CREATE TABLE IF NOT EXISTS devices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('web', 'mobile', 'iot')),
          api_key TEXT,
          last_access TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        // Device Layouts table
        `CREATE TABLE IF NOT EXISTS device_layouts (
          id SERIAL PRIMARY KEY,
          device_id INTEGER NOT NULL,
          device_type VARCHAR(20) NOT NULL,
          layout_data TEXT DEFAULT '[]',
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE,
          UNIQUE(device_id, device_type)
        )`
      );
      
      // PostgreSQL indexes (run separately to handle IF NOT EXISTS)
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_device_layouts_device_id ON device_layouts (device_id)',
        'CREATE INDEX IF NOT EXISTS idx_device_layouts_device_type ON device_layouts (device_type)'
      ];
      migrations.push(...indexes);
      
    } else {
      // SQLite migrations
      migrations.push(
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
          FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE,
          UNIQUE(device_id, device_type)
        )`,
        
        // Create indexes for performance
        'CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_device_layouts_device_id ON device_layouts (device_id)',
        'CREATE INDEX IF NOT EXISTS idx_device_layouts_device_type ON device_layouts (device_type)'
      );
    }

    // Run all migrations
    for (let i = 0; i < migrations.length; i++) {
      try {
        console.log(`Running migration ${i + 1}/${migrations.length}...`);
        await db.run(migrations[i]);
        console.log(`Migration ${i + 1} completed successfully`);
      } catch (error) {
        // For PostgreSQL, some errors like "already exists" are expected and can be ignored
        if (db.dbType === 'postgres' && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key') ||
          error.message.includes('relation') && error.message.includes('already exists')
        )) {
          console.log(`Migration ${i + 1} skipped (already exists)`);
          continue;
        }
        
        console.error(`Migration ${i + 1} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('Database migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrate;