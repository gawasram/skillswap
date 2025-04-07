const statusMonitor = require('express-status-monitor');
const { getLogger } = require('./logger');

const logger = getLogger('performance');

// Create default configuration
const monitorConfig = {
  title: 'SkillSwap API Status',
  theme: 'default',
  path: '/status',
  spans: [
    {
      interval: 1,     // Every second
      retention: 60    // Keep 60 data points (1 minute)
    },
    {
      interval: 5,     // Every 5 seconds
      retention: 60    // Keep 60 data points (5 minutes)
    },
    {
      interval: 15,    // Every 15 seconds
      retention: 60    // Keep 60 data points (15 minutes)
    }
  ],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    responseTime: true,
    rps: true,
    statusCodes: true
  },
  healthChecks: []
};

/**
 * Configure express-status-monitor with custom settings
 * @param {Object} config Override configuration
 * @returns {Function} Configured middleware
 */
const configureStatusMonitor = (config = {}) => {
  // Merge default config with any overrides
  const finalConfig = {
    ...monitorConfig,
    ...config,
    // Allow merging healthChecks array
    healthChecks: [
      ...monitorConfig.healthChecks,
      ...(config.healthChecks || [])
    ]
  };
  
  return statusMonitor(finalConfig);
};

/**
 * Middleware to track request duration
 * @returns {Function} Express middleware
 */
const requestDurationMiddleware = () => {
  return (req, res, next) => {
    const start = process.hrtime();
    
    // Function to be called on response finish
    const logRequestMetrics = () => {
      const diff = process.hrtime(start);
      const duration = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2); // in ms
      
      // Log slow requests (adjust threshold as needed)
      if (duration > 1000) { // 1 second threshold
        logger.warn({
          msg: 'Slow request detected',
          method: req.method,
          url: req.originalUrl,
          duration,
          statusCode: res.statusCode
        });
      }
      
      // Store duration on response object for other middleware
      res.duration = duration;
      
      // Clean up event listener
      res.removeListener('finish', logRequestMetrics);
    };
    
    // Listen for response finish event
    res.on('finish', logRequestMetrics);
    
    next();
  };
};

/**
 * Create a performance marker for a specific operation
 * @param {string} name Operation name
 * @returns {Object} Performance marker with start and end methods
 */
const createPerformanceMarker = (name) => {
  const marker = {
    name,
    startTime: null,
    endTime: null,
    start() {
      this.startTime = process.hrtime();
      return this;
    },
    end() {
      if (!this.startTime) {
        throw new Error('Performance marker must be started before ending');
      }
      
      this.endTime = process.hrtime(this.startTime);
      const duration = (this.endTime[0] * 1e3 + this.endTime[1] * 1e-6).toFixed(2); // in ms
      
      logger.debug({
        msg: 'Performance measurement',
        operation: this.name,
        duration
      });
      
      return duration;
    }
  };
  
  return marker;
};

/**
 * Track database query performance
 * @param {Function} originalExec Original mongoose exec function
 * @returns {Function} Wrapped exec function with performance tracking
 */
const trackDatabasePerformance = (originalExec) => {
  return async function() {
    const collection = this.mongooseCollection.name;
    const queryType = this.op;
    
    const marker = createPerformanceMarker(`db:${collection}:${queryType}`).start();
    
    try {
      // Execute the original function
      const result = await originalExec.apply(this, arguments);
      const duration = marker.end();
      
      // Log slow queries
      if (duration > 200) { // 200ms threshold
        logger.warn({
          msg: 'Slow database query',
          collection,
          queryType,
          duration,
          query: this.getQuery()
        });
      }
      
      return result;
    } catch (error) {
      marker.end(); // Still record timing even for failures
      throw error;
    }
  };
};

module.exports = {
  configureStatusMonitor,
  requestDurationMiddleware,
  createPerformanceMarker,
  trackDatabasePerformance
}; 