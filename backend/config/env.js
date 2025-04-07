const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const logger = require('./logger');

// Load environment variables based on NODE_ENV
const loadEnv = () => {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
  const defaultEnvPath = path.resolve(process.cwd(), '.env');
  
  // Try to load environment-specific .env file first
  if (fs.existsSync(envPath)) {
    logger.info(`Loading environment from ${envPath}`);
    dotenv.config({ path: envPath });
  } 
  // Then load default .env file
  else if (fs.existsSync(defaultEnvPath)) {
    logger.info(`Loading environment from ${defaultEnvPath}`);
    dotenv.config({ path: defaultEnvPath });
  } else {
    logger.warn('No .env file found. Using system environment variables only.');
  }
  
  // Validate required environment variables
  validateEnv();
  
  return process.env;
};

// Validate required environment variables
const validateEnv = () => {
  const requiredEnvVars = [
    'PORT',
    'NODE_ENV',
    'JWT_SECRET',
  ];
  
  // In production, ensure we have the MongoDB URI
  if (process.env.NODE_ENV === 'production') {
    requiredEnvVars.push('MONGODB_URI_PROD');
  }
  
  const missingVars = requiredEnvVars.filter(item => !process.env[item]);
  
  if (missingVars.length > 0) {
    missingVars.forEach(item => {
      logger.error(`Missing required environment variable: ${item}`);
    });
    
    if (process.env.NODE_ENV === 'production') {
      logger.error('Missing required environment variables in production. Exiting.');
      process.exit(1);
    }
  }
};

// Get configuration for current environment
const getConfig = () => {
  // Ensure environment variables are loaded
  loadEnv();
  
  const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    mongodb: {
      uri: process.env.NODE_ENV === 'production' 
        ? process.env.MONGODB_URI_PROD 
        : (process.env.NODE_ENV === 'test' 
          ? process.env.MONGODB_URI_TEST 
          : process.env.MONGODB_URI),
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiry: process.env.JWT_EXPIRY || '7d',
    },
    webrtc: {
      socketUrl: process.env.SOCKET_URL,
      stunServer: process.env.STUN_SERVER,
      turnServer: process.env.TURN_SERVER,
      turnUsername: process.env.TURN_USERNAME,
      turnCredential: process.env.TURN_CREDENTIAL,
    },
    backup: {
      schedule: process.env.BACKUP_CRON_SCHEDULE || '0 0 * * *', // Default: daily at midnight
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10),
      storagePath: process.env.BACKUP_STORAGE_PATH || path.join(__dirname, '..', 'backups'),
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
    },
  };
  
  return config;
};

module.exports = {
  loadEnv,
  getConfig,
}; 