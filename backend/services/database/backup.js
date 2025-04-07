/**
 * Database Backup Service
 * Handles automated backups and recovery for MongoDB
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const logger = require('../../config/logger');
const { getConfig } = require('../../config/env');

// Ensure backup directory exists
const initBackupDir = () => {
  const config = getConfig();
  const backupDir = config.backup.storagePath;

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    logger.info(`Created backup directory at ${backupDir}`);
  }

  return backupDir;
};

// Format date for filename
const getFormattedDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now
    .getHours()
    .toString()
    .padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
};

// Perform database backup using mongodump
const performBackup = async () => {
  const config = getConfig();
  const backupDir = initBackupDir();
  const dateStr = getFormattedDate();
  const backupPath = path.join(backupDir, `backup-${dateStr}`);
  const mongoUri = config.mongodb.uri;

  if (!mongoUri) {
    logger.error('Cannot perform backup: MongoDB URI not configured');
    return null;
  }

  return new Promise((resolve, reject) => {
    // Create mongodump command
    // For production use, mongodump should be installed on the server
    const cmd = `mongodump --uri="${mongoUri}" --out="${backupPath}" --gzip`;

    logger.info(`Starting database backup to ${backupPath}`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Backup failed: ${error.message}`);
        return reject(error);
      }
      
      if (stderr) {
        logger.warn(`Backup warnings: ${stderr}`);
      }
      
      logger.info(`Database backup completed successfully to ${backupPath}`);
      
      // After successful backup, clean up old backups
      cleanupOldBackups();
      
      resolve(backupPath);
    });
  });
};

// Clean up old backups to save space
const cleanupOldBackups = () => {
  const config = getConfig();
  const backupDir = config.backup.storagePath;
  const retentionDays = config.backup.retentionDays;
  
  if (!fs.existsSync(backupDir)) {
    return;
  }
  
  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  fs.readdir(backupDir, (err, files) => {
    if (err) {
      logger.error(`Error reading backup directory: ${err.message}`);
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      
      // Skip if not a directory
      if (!fs.statSync(filePath).isDirectory()) {
        return;
      }
      
      // Check if backup is older than retention period
      const stats = fs.statSync(filePath);
      const fileDate = new Date(stats.mtime);
      
      if (fileDate < cutoffDate) {
        // Remove old backup
        fs.rm(filePath, { recursive: true }, (err) => {
          if (err) {
            logger.error(`Error removing old backup ${filePath}: ${err.message}`);
          } else {
            logger.info(`Removed old backup: ${filePath}`);
          }
        });
      }
    });
  });
};

// Restore database from backup
const restoreFromBackup = async (backupPath) => {
  const config = getConfig();
  const mongoUri = config.mongodb.uri;
  
  if (!mongoUri) {
    logger.error('Cannot perform restore: MongoDB URI not configured');
    return false;
  }
  
  if (!backupPath || !fs.existsSync(backupPath)) {
    logger.error(`Backup path not found: ${backupPath}`);
    return false;
  }
  
  return new Promise((resolve, reject) => {
    // Create mongorestore command
    const cmd = `mongorestore --uri="${mongoUri}" "${backupPath}" --drop --gzip`;
    
    logger.info(`Starting database restore from ${backupPath}`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Restore failed: ${error.message}`);
        return reject(error);
      }
      
      if (stderr) {
        logger.warn(`Restore warnings: ${stderr}`);
      }
      
      logger.info('Database restore completed successfully');
      resolve(true);
    });
  });
};

// Schedule automated backups
const scheduleBackups = () => {
  const config = getConfig();
  const cronSchedule = config.backup.schedule;
  
  // Skip scheduling in test environment
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  
  // Validate cron expression
  if (!cron.validate(cronSchedule)) {
    logger.error(`Invalid backup cron schedule: ${cronSchedule}`);
    return false;
  }
  
  logger.info(`Scheduling automated backups with schedule: ${cronSchedule}`);
  
  // Schedule backup job
  cron.schedule(cronSchedule, async () => {
    try {
      await performBackup();
    } catch (error) {
      logger.error(`Scheduled backup failed: ${error.message}`);
    }
  });
  
  return true;
};

// List available backups
const listBackups = () => {
  const config = getConfig();
  const backupDir = config.backup.storagePath;
  
  if (!fs.existsSync(backupDir)) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(backupDir);
    
    // Filter directories only and sort by date (newest first)
    const backups = files
      .filter(file => {
        const filePath = path.join(backupDir, file);
        return fs.statSync(filePath).isDirectory();
      })
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          date: stats.mtime,
        };
      })
      .sort((a, b) => b.date - a.date);
    
    return backups;
  } catch (error) {
    logger.error(`Error listing backups: ${error.message}`);
    return [];
  }
};

module.exports = {
  performBackup,
  restoreFromBackup,
  scheduleBackups,
  listBackups,
  cleanupOldBackups,
  initBackupDir
}; 