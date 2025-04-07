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

// Import monitoring system
const monitoring = require('./monitoring');

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

// Initialize monitoring system with Sentry and logging
// Must be before other middleware for proper request tracking
monitoring.initializeMonitoring(app, {
  // Configure based on environment
  sentry: process.env.SENTRY_DSN ? true : false,
  alerts: process.env.ENABLE_ALERTS === 'true',
  performanceMonitoring: true,
  statusMonitorConfig: {
    // Restrict status page access in production
    authorization: {
      enable: process.env.NODE_ENV === 'production',
      users: [
        {
          username: process.env.STATUS_PAGE_USERNAME || 'admin',
          password: process.env.STATUS_PAGE_PASSWORD || 'admin'
        }
      ]
    }
  }
});

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
      monitoring.logger.info(`Applied ${migrationResult.applied} database migrations`);
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

// Setup error handling middleware
// This should be after all routes are defined
monitoring.setupErrorHandlers(app);

// Start the server
server.listen(PORT, async () => {
  monitoring.logger.info(`Server running in ${config.env} mode on port ${PORT}`, {
    port: PORT,
    env: config.env,
    nodeVersion: process.version
  });
  
  await initializeServices();
  
  // Log application startup with all routes (for documentation)
  if (app._router && app._router.stack) {
    monitoring.logger.logAppStartup(app, PORT);
  }
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  monitoring.logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    monitoring.logger.info('Server closed.');
    await disconnectDB();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  monitoring.logger.info('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    monitoring.logger.info('Server closed.');
    await disconnectDB();
    process.exit(0);
  });
});

module.exports = app; 