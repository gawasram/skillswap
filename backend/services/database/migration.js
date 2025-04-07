/**
 * Database Migration Service
 * Handles schema migrations and data transformations
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../config/logger');

// Migration status model
const MigrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    required: true
  }
});

// Define migrations directory
const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

// Get or create the Migration model
const getMigrationModel = () => {
  try {
    return mongoose.model('Migration');
  } catch (error) {
    return mongoose.model('Migration', MigrationSchema);
  }
};

// Ensure migrations directory exists
const initMigrationsDir = () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    logger.info(`Created migrations directory at ${MIGRATIONS_DIR}`);
    
    // Create a sample migration file
    const samplePath = path.join(MIGRATIONS_DIR, '00000_sample_migration.js');
    if (!fs.existsSync(samplePath)) {
      const sampleContent = `/**
 * Sample Migration
 * Version: 1
 * Description: This is a sample migration file. Modify or create new ones as needed.
 */

module.exports = {
  version: 1,
  description: 'Sample migration that does nothing',
  
  // Run when migrating up
  up: async (db) => {
    // Example:
    // await db.collection('users').updateMany({}, { $set: { isActive: true } });
    console.log('Sample migration up function executed');
  },
  
  // Run when rolling back
  down: async (db) => {
    // Example:
    // await db.collection('users').updateMany({}, { $unset: { isActive: 1 } });
    console.log('Sample migration down function executed');
  }
};`;
      
      fs.writeFileSync(samplePath, sampleContent);
      logger.info('Created sample migration file');
    }
  }
  
  return MIGRATIONS_DIR;
};

// Get all available migrations
const getAvailableMigrations = () => {
  const migrationsDir = initMigrationsDir();
  
  try {
    // Read migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    // Load each migration module
    const migrations = files.map(file => {
      const filePath = path.join(migrationsDir, file);
      const migration = require(filePath);
      migration.name = file.replace('.js', '');
      return migration;
    });
    
    return migrations;
  } catch (error) {
    logger.error(`Error reading migrations: ${error.message}`);
    return [];
  }
};

// Get applied migrations from database
const getAppliedMigrations = async () => {
  const Migration = getMigrationModel();
  
  try {
    const applied = await Migration.find({}).sort({ name: 1 });
    return applied;
  } catch (error) {
    logger.error(`Error fetching applied migrations: ${error.message}`);
    return [];
  }
};

// Apply pending migrations
const migrate = async () => {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    logger.error('Cannot run migrations: No database connection');
    return { success: false, message: 'No database connection' };
  }
  
  const Migration = getMigrationModel();
  const available = getAvailableMigrations();
  const applied = await getAppliedMigrations();
  
  // Find migrations that haven't been applied
  const appliedNames = applied.map(m => m.name);
  const pendingMigrations = available.filter(m => !appliedNames.includes(m.name));
  
  if (pendingMigrations.length === 0) {
    logger.info('No pending migrations to apply');
    return { success: true, message: 'No pending migrations', applied: 0 };
  }
  
  logger.info(`Found ${pendingMigrations.length} pending migrations to apply`);
  
  let appliedCount = 0;
  
  // Apply each pending migration
  for (const migration of pendingMigrations) {
    try {
      logger.info(`Applying migration: ${migration.name} (version ${migration.version})`);
      
      // Access the raw database
      const db = mongoose.connection.db;
      
      // Run the migration
      await migration.up(db);
      
      // Record the migration as applied
      await Migration.create({
        name: migration.name,
        version: migration.version,
        appliedAt: new Date()
      });
      
      appliedCount++;
      logger.info(`Migration ${migration.name} applied successfully`);
    } catch (error) {
      logger.error(`Error applying migration ${migration.name}: ${error.message}`);
      return { 
        success: false, 
        message: `Error applying migration ${migration.name}: ${error.message}`,
        applied: appliedCount
      };
    }
  }
  
  logger.info(`Applied ${appliedCount} migrations successfully`);
  return { success: true, message: 'Migrations applied successfully', applied: appliedCount };
};

// Rollback last migration
const rollback = async () => {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    logger.error('Cannot run rollback: No database connection');
    return { success: false, message: 'No database connection' };
  }
  
  const Migration = getMigrationModel();
  
  // Get the last applied migration
  const lastMigration = await Migration.findOne({}).sort({ appliedAt: -1 });
  
  if (!lastMigration) {
    logger.info('No migrations to roll back');
    return { success: true, message: 'No migrations to roll back' };
  }
  
  try {
    // Find the migration file
    const migrationFile = path.join(MIGRATIONS_DIR, `${lastMigration.name}.js`);
    
    if (!fs.existsSync(migrationFile)) {
      logger.error(`Migration file not found: ${migrationFile}`);
      return { success: false, message: `Migration file not found: ${lastMigration.name}` };
    }
    
    // Load the migration
    const migration = require(migrationFile);
    
    logger.info(`Rolling back migration: ${lastMigration.name}`);
    
    // Access the raw database
    const db = mongoose.connection.db;
    
    // Run the down migration
    await migration.down(db);
    
    // Delete the migration record
    await Migration.deleteOne({ _id: lastMigration._id });
    
    logger.info(`Migration ${lastMigration.name} rolled back successfully`);
    return { success: true, message: `Migration ${lastMigration.name} rolled back successfully` };
  } catch (error) {
    logger.error(`Error rolling back migration ${lastMigration.name}: ${error.message}`);
    return { 
      success: false, 
      message: `Error rolling back migration ${lastMigration.name}: ${error.message}`
    };
  }
};

// Create a new migration file
const createMigration = (name) => {
  const migrationsDir = initMigrationsDir();
  
  // Format name to be file-friendly
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_');
  
  // Add a timestamp prefix to ensure uniqueness and order
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const fileName = `${timestamp}_${safeName}.js`;
  const filePath = path.join(migrationsDir, fileName);
  
  // Create migration file content
  const content = `/**
 * Migration: ${name}
 * Version: ${Date.now()}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
  version: ${Date.now()},
  description: '${name}',
  
  // Run when migrating up
  up: async (db) => {
    // TODO: Implement migration logic
    // Examples:
    // - Create new collections: await db.createCollection('new_collection')
    // - Update documents: await db.collection('users').updateMany({}, { $set: { newField: true } })
    // - Create indexes: await db.collection('users').createIndex({ email: 1 }, { unique: true })
  },
  
  // Run when rolling back
  down: async (db) => {
    // TODO: Implement rollback logic
    // This should undo whatever the 'up' function does
  }
};`;
  
  try {
    fs.writeFileSync(filePath, content);
    logger.info(`Created new migration file: ${fileName}`);
    return { success: true, fileName, path: filePath };
  } catch (error) {
    logger.error(`Error creating migration file: ${error.message}`);
    return { success: false, message: `Error creating migration file: ${error.message}` };
  }
};

// Check migration status
const getMigrationStatus = async () => {
  const available = getAvailableMigrations();
  const applied = await getAppliedMigrations();
  
  // Create status info for each migration
  const appliedMap = applied.reduce((map, migration) => {
    map[migration.name] = migration;
    return map;
  }, {});
  
  const status = available.map(migration => ({
    name: migration.name,
    description: migration.description || '',
    version: migration.version,
    applied: !!appliedMap[migration.name],
    appliedAt: appliedMap[migration.name] ? appliedMap[migration.name].appliedAt : null
  }));
  
  return {
    total: available.length,
    applied: applied.length,
    pending: available.length - applied.length,
    migrations: status
  };
};

module.exports = {
  migrate,
  rollback,
  createMigration,
  getMigrationStatus,
  initMigrationsDir
}; 