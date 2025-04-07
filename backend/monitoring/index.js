const { initSentry, addSentryErrorHandler } = require('./sentry');
const { logger, httpLogger, logAppStartup } = require('./logger');
const { healthCheckHandler, runHealthCheck } = require('./health');
const { configureStatusMonitor, requestDurationMiddleware, trackDatabasePerformance } = require('./performance');
const { configureAlerts, scheduleHealthCheckAlerts, errorAlertMiddleware } = require('./alerts');
const { feedbackHandler, clientErrorHandler } = require('./feedback');
const { errorHandler, notFoundHandler, setupUnhandledRejectionLogging, ApiError, asyncHandler } = require('./errorHandler');
const mongoose = require('mongoose');

/**
 * Initialize all monitoring systems for the Express app
 * @param {Object} app Express app instance
 * @param {Object} options Configuration options
 */
const initializeMonitoring = (app, options = {}) => {
  const logger = require('./logger').getLogger('monitoring');
  
  // Default configuration
  const config = {
    sentry: true,
    logging: true,
    healthChecks: true,
    performanceMonitoring: true,
    alerts: true,
    feedback: true,
    errorHandling: true,
    // Default nested config objects
    ...options
  };
  
  logger.info('Initializing application monitoring systems');
  
  try {
    // Initialize Sentry for error tracking
    if (config.sentry) {
      logger.info('Initializing Sentry for error tracking');
      initSentry(app);
    }
    
    // Setup request logging with Pino
    if (config.logging) {
      logger.info('Setting up HTTP request logging');
      app.use(httpLogger);
    }
    
    // Apply performance monitoring middleware
    if (config.performanceMonitoring) {
      logger.info('Setting up performance monitoring');
      app.use(requestDurationMiddleware());
      
      // Setup status monitoring dashboard
      const statusMonitorConfig = {
        ...(config.statusMonitorConfig || {}),
      };
      app.use(configureStatusMonitor(statusMonitorConfig));
      
      // Patch mongoose for query performance tracking
      if (mongoose.Query.prototype.exec) {
        logger.info('Setting up database query performance tracking');
        const originalExec = mongoose.Query.prototype.exec;
        mongoose.Query.prototype.exec = trackDatabasePerformance(originalExec);
      }
    }
    
    // Register health check endpoint
    if (config.healthChecks) {
      logger.info('Setting up health check endpoint');
      app.get('/health', healthCheckHandler());
      
      // Run an initial health check
      runHealthCheck().catch(error => {
        logger.error({ err: error }, 'Initial health check failed');
      });
    }
    
    // Setup alerts for critical issues
    if (config.alerts) {
      logger.info('Setting up alert system');
      
      // Configure alerts if custom config provided
      if (config.alertConfig) {
        configureAlerts(config.alertConfig);
      }
      
      // Schedule periodic health check with alerts
      const alertSchedule = config.alertSchedule || '*/15 * * * *'; // Default: every 15 minutes
      scheduleHealthCheckAlerts(alertSchedule);
    }
    
    // Setup feedback and error reporting endpoints
    if (config.feedback) {
      logger.info('Setting up user feedback system');
      app.post('/api/feedback', feedbackHandler());
      app.post('/api/error-report', clientErrorHandler());
    }
    
    // Global unhandled rejection logging
    if (config.errorHandling) {
      logger.info('Setting up global error handlers');
      setupUnhandledRejectionLogging();
    }
    
    logger.info('Application monitoring systems initialized successfully');
  } catch (error) {
    logger.error(
      { err: error },
      'Failed to initialize monitoring systems'
    );
    
    // Don't rethrow - we want the app to continue even if monitoring setup fails
  }
};

/**
 * Add error handling middleware to Express app
 * This should be called after all routes are registered
 * @param {Object} app Express app instance
 */
const setupErrorHandlers = (app) => {
  const logger = require('./logger').getLogger('monitoring');
  
  logger.info('Setting up error handling middleware');
  
  // Add error alert middleware for notifications
  app.use(errorAlertMiddleware());
  
  // Add Sentry error handler
  addSentryErrorHandler(app);
  
  // Not found handler for unknown routes
  app.use(notFoundHandler());
  
  // Central error handler must be last
  app.use(errorHandler());
};

module.exports = {
  initializeMonitoring,
  setupErrorHandlers,
  ApiError,
  asyncHandler,
  logger,
  // Re-export individual modules for direct access
  sentry: require('./sentry'),
  logger: require('./logger'),
  health: require('./health'),
  performance: require('./performance'),
  alerts: require('./alerts'),
  feedback: require('./feedback'),
  errorHandler: require('./errorHandler')
}; 