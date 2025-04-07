const pino = require('pino');
const expressPino = require('express-pino-logger');

// Configure the base logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty', options: { colorize: true } } 
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'skillswap-backend',
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    // Standard serializers
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
    // Custom error serializer to include more details
    error: (error) => ({
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode || error.status,
      ...(error.details && { details: error.details }),
    }),
    // Custom user serializer to prevent logging sensitive information
    user: (user) => ({
      id: user.id,
      email: user.email ? '***@' + user.email.split('@')[1] : undefined,
      role: user.role,
    }),
  },
});

// Create a child logger specifically for HTTP requests
const httpLogger = expressPino({
  logger,
  // Don't log body by default due to sensitive information
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      // Remove sensitive headers
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[Filtered]' : undefined,
        cookie: req.headers.cookie ? '[Filtered]' : undefined,
      },
      // Only log query params, not body
      query: req.query,
      // Include user ID if authenticated
      ...(req.user && { user: { id: req.user.id, role: req.user.role } }),
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      // Track response time
      responseTime: res.responseTime,
    }),
  },
  autoLogging: {
    // Don't log health check endpoints to reduce noise
    ignore: (req) => req.url.includes('/health') || req.url.includes('/favicon'),
  },
});

/**
 * Creates a child logger with specific component context
 * @param {string} component Component name for context
 * @returns {Object} Child logger instance
 */
const getLogger = (component) => {
  return logger.child({ component });
};

/**
 * Log application startup information
 * @param {Object} app Express application instance
 * @param {number} port Server port
 */
const logAppStartup = (app, port) => {
  const routes = [];
  
  // Extract registered routes for documentation
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly
      const path = middleware.route.path;
      const methods = Object.keys(middleware.route.methods)
        .filter(method => middleware.route.methods[method])
        .map(method => method.toUpperCase());
      
      routes.push({ path, methods });
    } else if (middleware.name === 'router') {
      // Routes registered via Router
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods)
            .filter(method => handler.route.methods[method])
            .map(method => method.toUpperCase());
          
          routes.push({ path, methods });
        }
      });
    }
  });

  logger.info(
    {
      msg: 'Server started',
      port,
      nodeVersion: process.version,
      routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
      memoryUsage: process.memoryUsage(),
    },
    `Server running at http://localhost:${port}`
  );
};

module.exports = {
  logger,
  httpLogger,
  getLogger,
  logAppStartup,
}; 