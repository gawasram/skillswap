const mongoose = require('mongoose');
const logger = require('./logger');

// Database connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Get MongoDB URI based on environment
const getMongoURI = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return process.env.MONGODB_URI_PROD;
    case 'test':
      return process.env.MONGODB_URI_TEST;
    case 'development':
    default:
      return process.env.MONGODB_URI;
  }
};

// Connect to MongoDB
const connectDB = async () => {
  const mongoURI = getMongoURI();
  
  if (!mongoURI) {
    logger.warn('MongoDB URI not provided. Running without database connection.');
    return false;
  }
  
  try {
    const conn = await mongoose.connect(mongoURI, options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set up indexes
    await setupIndexes();
    
    return true;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    // Exit with failure in production, continue in dev/test
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return false;
  }
};

// Setup performance indexes
const setupIndexes = async () => {
  try {
    // Ensure we have the Session model loaded
    const Session = mongoose.model('Session');
    
    // Create compound index for sessions by mentor and mentee
    await Session.collection.createIndex({ mentor: 1, mentee: 1 });
    
    // Create index for sessions by status
    await Session.collection.createIndex({ status: 1 });
    
    // Create index for sessions by date
    await Session.collection.createIndex({ startTime: 1, endTime: 1 });
    
    logger.info('Database indexes configured successfully');
  } catch (error) {
    logger.error(`Error setting up database indexes: ${error.message}`);
  }
};

// Graceful disconnection
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getMongoURI
}; 