const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', 'database.sqlite');

async function resetDatabase() {
  console.log('Resetting database...');
  
  try {
    // Remove existing database file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Existing database removed');
    }
    
    // Run migration to create fresh database
    await require('./migrate')();
    
    console.log('Database reset completed successfully!');
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;