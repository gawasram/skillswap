/**
 * Database Backup Script
 * Run with: npm run backup
 * 
 * This script performs a manual backup of the MongoDB database.
 */

// Load environment first
require('../config/env').loadEnv();

const { connectDB, disconnectDB } = require('../config/database');
const logger = require('../config/logger');
const { 
  performBackup, 
  listBackups,
  initBackupDir
} = require('../services/database/backup');

// Function to run backup
const runBackup = async () => {
  try {
    // Ensure backup directory exists
    initBackupDir();
    
    // Connect to database
    logger.info('Connecting to database...');
    await connectDB();
    
    // Perform backup
    logger.info('Starting database backup...');
    const backupPath = await performBackup();
    
    if (backupPath) {
      logger.info(`Backup completed successfully at: ${backupPath}`);
      
      // List available backups
      const backups = listBackups();
      logger.info(`Available backups: ${backups.length}`);
      
      // Display most recent backups (up to 5)
      if (backups.length > 0) {
        logger.info('Recent backups:');
        backups.slice(0, 5).forEach((backup, index) => {
          const date = backup.date.toISOString().replace('T', ' ').substr(0, 19);
          logger.info(`${index + 1}. ${backup.name} (${date})`);
        });
      }
    } else {
      logger.error('Backup failed');
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Error performing backup: ${error.message}`);
    process.exit(1);
  } finally {
    // Disconnect from the database
    await disconnectDB();
  }
};

// Run the script
runBackup()
  .then(() => {
    logger.info('Backup process completed');
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Backup process failed: ${error.message}`);
    process.exit(1);
  }); 