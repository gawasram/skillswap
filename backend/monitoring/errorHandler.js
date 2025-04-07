const { getLogger } = require('./logger');
const { captureException } = require('./sentry');

const logger = getLogger('errorHandler');

/**
 * Custom error class for API errors with status code and details
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message, details = null) {
    return new ApiError(message || 'Bad Request', 400, details);
  }
  
  static unauthorized(message, details = null) {
    return new ApiError(message || 'Unauthorized', 401, details);
  }
  
  static forbidden(message, details = null) {
    return new ApiError(message || 'Forbidden', 403, details);
  }
  
  static notFound(message, details = null) {
    return new ApiError(message || 'Resource Not Found', 404, details);
  }
  
  static methodNotAllowed(message, details = null) {
    return new ApiError(message || 'Method Not Allowed', 405, details);
  }
  
  static conflict(message, details = null) {
    return new ApiError(message || 'Conflict', 409, details);
  }
  
  static unprocessableEntity(message, details = null) {
    return new ApiError(message || 'Unprocessable Entity', 422, details);
  }
  
  static tooManyRequests(message, details = null) {
    return new ApiError(message || 'Too Many Requests', 429, details);
  }
  
  static internal(message, details = null) {
    return new ApiError(message || 'Internal Server Error', 500, details);
  }
}

/**
 * Middleware for handling 404 errors for non-existent routes
 * @returns {Function} Express middleware
 */
const notFoundHandler = () => {
  return (req, res, next) => {
    const error = ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`);
    next(error);
  };
};

/**
 * Central error handling middleware for Express
 * @returns {Function} Express error middleware
 */
const errorHandler = () => {
  return (err, req, res, next) => {
    // Set default values
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Something went wrong';
    const name = err.name || 'Error';
    const details = err.details || null;
    
    // Prepare the error response
    const errorResponse = {
      error: {
        name,
        message,
        status,
        ...(details && { details }),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      }
    };
    
    // Log the error with appropriate level
    if (status >= 500) {
      logger.error({
        err,
        req: {
          method: req.method,
          url: req.originalUrl,
          query: req.query,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          ...(req.user && { userId: req.user.id })
        }
      }, `${status} ${name}: ${message}`);
      
      // Send to Sentry for 5xx errors
      captureException(err, {
        user: req.user ? {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        } : undefined,
        tags: {
          route: `${req.method} ${req.route ? req.route.path : req.originalUrl}`
        },
        extra: {
          query: req.query,
          params: req.params,
          // Don't include request body to avoid sensitive data
        }
      });
    } else if (status >= 400 && status < 500) {
      // For 4xx errors, log as warnings 
      logger.warn({
        err: {
          name,
          message,
          status,
          ...(details && { details })
        },
        req: {
          method: req.method,
          url: req.originalUrl,
          userId: req.user?.id
        }
      }, `${status} ${name}: ${message}`);
    }
    
    // Send the response
    res.status(status).json(errorResponse);
  };
};

/**
 * Wrapper for async route handlers to catch errors
 * @param {Function} fn Async route handler
 * @returns {Function} Wrapped handler that catches errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Log unexpected errors in unhandled promise rejections
 */
const setupUnhandledRejectionLogging = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(
      { err: reason },
      'Unhandled Promise Rejection'
    );
    
    // Send to Sentry
    captureException(reason instanceof Error ? reason : new Error(String(reason)), {
      tags: {
        type: 'unhandledRejection'
      }
    });
  });
  
  process.on('uncaughtException', (error) => {
    logger.fatal(
      { err: error },
      'Uncaught Exception - Application stability compromised'
    );
    
    // Send to Sentry
    captureException(error, {
      tags: {
        type: 'uncaughtException'
      },
      level: 'fatal'
    });
    
    // Give time for logs and Sentry to flush, then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
  setupUnhandledRejectionLogging
}; 