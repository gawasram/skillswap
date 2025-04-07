const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');

// Import configuration modules
const { loadEnv, getConfig } = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');
const logger = require('./config/logger');
const { scheduleBackups } = require('./services/database/backup');
const { migrate } = require('./services/database/migration');

// Load environment variables
loadEnv();
const config = getConfig();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const webhookRoutes = require('./routes/webhooks');
const blockchainRoutes = require('./routes/blockchain');

// Import WebRTC signaling service
const { initializeSocketServer } = require('./services/webrtc/signaling');

// Create Express app
const app = express();
const server = http.createServer(app);
const PORT = config.port;

// Initialize WebRTC signaling
const io = initializeSocketServer(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB and initialize services
const initializeServices = async () => {
  // Connect to MongoDB
  const dbConnected = await connectDB();
  
  if (dbConnected) {
    // Run database migrations
    const migrationResult = await migrate();
    if (migrationResult.applied > 0) {
      logger.info(`Applied ${migrationResult.applied} database migrations`);
    }
    
    // Schedule automated backups
    if (process.env.NODE_ENV === 'production') {
      scheduleBackups();
    }
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Add WebRTC endpoint info
app.get('/api/webrtc/info', (req, res) => {
  res.json({
    success: true,
    data: {
      socketUrl: config.webrtc.socketUrl,
      iceServers: [
        { urls: config.webrtc.stunServer || 'stun:stun.l.google.com:19302' },
        config.webrtc.turnServer ? {
          urls: config.webrtc.turnServer,
          username: config.webrtc.turnUsername,
          credential: config.webrtc.turnCredential
        } : null
      ].filter(Boolean)
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  logger.debug(err.stack);
  
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
server.listen(PORT, async () => {
  logger.info(`Server running in ${config.env} mode on port ${PORT}`);
  await initializeServices();
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    logger.info('Server closed.');
    await disconnectDB();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    logger.info('Server closed.');
    await disconnectDB();
    process.exit(0);
  });
});

module.exports = app; 