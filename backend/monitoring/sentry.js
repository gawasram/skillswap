const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const os = require('os');

/**
 * Initialize Sentry for error tracking and performance monitoring
 * @param {Object} app Express application instance
 */
const initSentry = (app) => {
  // Get environment from env vars or default to development
  const environment = process.env.NODE_ENV || 'development';

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express request handler tracing
      new Sentry.Integrations.Express({ app }),
      // Enable profiling integration
      new ProfilingIntegration(),
    ],
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // We recommend adjusting this value in production
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
    // Set profilesSampleRate to 1.0 to profile all transactions
    // Adjust in production for performance considerations
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Add server information to error reports
    serverName: os.hostname(),
    
    // Add release information (if available from env)
    ...(process.env.APP_VERSION && { release: process.env.APP_VERSION }),
    
    // Set custom tags that will be sent with every event
    initialScope: {
      tags: {
        platform: 'node',
        service: 'skillswap-backend',
      },
    },
    
    // Configure before send to sanitize sensitive data
    beforeSend(event) {
      // Don't send events in test environment
      if (process.env.NODE_ENV === 'test') {
        return null;
      }
      
      // Remove sensitive data if needed
      if (event.request && event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      return event;
    }
  });
  
  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
};

/**
 * Add error handler middleware to Express app
 * @param {Object} app Express application instance
 */
const addSentryErrorHandler = (app) => {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Send all errors except 4xx client errors to Sentry
      return !error.status || error.status >= 500;
    }
  }));
};

/**
 * Manually capture exception with additional context
 * @param {Error} error Error object
 * @param {Object} additionalInfo Additional context data 
 */
const captureException = (error, additionalInfo = {}) => {
  Sentry.withScope(scope => {
    // Add additional context to the error
    Object.entries(additionalInfo).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    
    // Capture the exception
    Sentry.captureException(error);
  });
};

/**
 * Start a transaction for performance monitoring
 * @param {string} name Name of the transaction
 * @param {string} op Operation type (e.g., 'db.query', 'http.request')
 * @returns {Transaction} Sentry transaction object
 */
const startTransaction = (name, op) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Set user information for the current Sentry scope
 * @param {Object} user User object with id and other relevant info
 */
const setUserContext = (user) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

module.exports = {
  initSentry,
  addSentryErrorHandler,
  captureException,
  startTransaction,
  setUserContext,
  Sentry, // Export Sentry instance for advanced use cases
}; 