/**
 * Create Migration Script
 * Run with: npm run create-migration -- "migration name"
 * Example: npm run create-migration -- "add user roles"
 */

// Load environment first
require('../config/env').loadEnv();

const logger = require('../config/logger');
const { createMigration } = require('../services/database/migration');

// Get migration name from command line arguments
const getMigrationName = () => {
  // Skip first two args (node and script path)
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    logger.error('Missing migration name. Usage: npm run create-migration -- "migration name"');
    process.exit(1);
  }
  
  return args.join(' ');
};

// Create migration
const runCreateMigration = async () => {
  try {
    const migrationName = getMigrationName();
    logger.info(`Creating migration: "${migrationName}"`);
    
    const result = createMigration(migrationName);
    
    if (result.success) {
      logger.info(`Migration file created successfully: ${result.fileName}`);
      logger.info(`Path: ${result.path}`);
      logger.info('Edit this file to implement your migration logic.');
    } else {
      logger.error(`Failed to create migration: ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Error creating migration: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
runCreateMigration()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Creation process failed: ${error.message}`);
    process.exit(1);
  }); 