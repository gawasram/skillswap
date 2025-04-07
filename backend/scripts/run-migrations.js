/**
 * Database Migration Script
 * Run with: npm run migrate
 */

// Load environment first
require('../config/env').loadEnv();

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/database');
const logger = require('../config/logger');
const { migrate, getMigrationStatus } = require('../services/database/migration');

// Function to run migrations
const runMigrations = async () => {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connectDB();
    
    // Display current migration status
    logger.info('Current migration status:');
    const status = await getMigrationStatus();
    
    logger.info(`Total migrations: ${status.total}`);
    logger.info(`Applied migrations: ${status.applied}`);
    logger.info(`Pending migrations: ${status.pending}`);
    
    if (status.pending === 0) {
      logger.info('No pending migrations to apply.');
    } else {
      // Run migrations
      logger.info(`Applying ${status.pending} pending migrations...`);
      const result = await migrate();
      
      if (result.success) {
        logger.info(`Successfully applied ${result.applied} migrations`);
      } else {
        logger.error(`Migration failed: ${result.message}`);
        process.exit(1);
      }
    }
  } catch (error) {
    logger.error(`Error running migrations: ${error.message}`);
    process.exit(1);
  } finally {
    // Disconnect from the database
    await disconnectDB();
  }
};

// Run the script
runMigrations()
  .then(() => {
    logger.info('Migration process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Migration process failed: ${error.message}`);
    process.exit(1);
  }); 