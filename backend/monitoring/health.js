const mongoose = require('mongoose');
const os = require('os');
const { getLogger } = require('./logger');

const logger = getLogger('health');

/**
 * Check MongoDB connection status
 * @returns {Object} Status and response time
 */
const checkDatabase = async () => {
  const startTime = Date.now();
  
  try {
    // Check if already connected
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'error',
        message: 'Database not connected',
        responseTime: 0
      };
    }
    
    // Run a simple command to test connection
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'ok',
      message: 'Database connected',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    return {
      status: 'error',
      message: error.message,
      responseTime: Date.now() - startTime
    };
  }
};

/**
 * Get system information
 * @returns {Object} System metrics
 */
const getSystemInfo = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    processMemoryUsage: process.memoryUsage(),
    systemMemory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usedPercentage: Math.round((usedMemory / totalMemory) * 100)
    },
    cpu: {
      loadAvg: os.loadavg(),
      cores: os.cpus().length
    }
  };
};

/**
 * Create Express route handler for health checks
 * @returns {Function} Express route handler
 */
const healthCheckHandler = () => {
  return async (req, res) => {
    const healthData = {
      timestamp: new Date().toISOString(),
      service: 'skillswap-backend',
      status: 'ok',
      version: process.env.APP_VERSION || 'development'
    };
    
    // Get component health checks
    try {
      // Always include
      healthData.system = getSystemInfo();
      
      // Conditionally include detailed checks based on query param
      if (req.query.detailed === 'true') {
        healthData.components = {
          database: await checkDatabase(),
          // Add other component checks here as needed
        };
      }
      
      // Determine overall status
      const componentStatuses = Object.values(healthData.components || {})
        .map(component => component.status);
      
      if (componentStatuses.some(status => status === 'error')) {
        healthData.status = 'error';
        res.status(500);
      } else if (componentStatuses.some(status => status === 'warn')) {
        healthData.status = 'warn';
        res.status(200);
      } else {
        res.status(200);
      }
    } catch (error) {
      logger.error({ err: error }, 'Health check failed');
      healthData.status = 'error';
      healthData.error = error.message;
      res.status(500);
    }
    
    res.json(healthData);
  };
};

/**
 * Perform a full system health check and log results
 * @returns {Object} Complete health status
 */
const runHealthCheck = async () => {
  const health = {
    timestamp: new Date().toISOString(),
    system: getSystemInfo(),
    components: {
      database: await checkDatabase(),
      // Add other component checks here
    }
  };
  
  // Determine overall status
  const componentStatuses = Object.values(health.components)
    .map(component => component.status);
  
  if (componentStatuses.some(status => status === 'error')) {
    health.status = 'error';
    logger.error(health, 'System health check failed');
  } else if (componentStatuses.some(status => status === 'warn')) {
    health.status = 'warn';
    logger.warn(health, 'System health check warning');
  } else {
    health.status = 'ok';
    logger.info(health, 'System health check passed');
  }
  
  return health;
};

module.exports = {
  healthCheckHandler,
  runHealthCheck,
  checkDatabase,
  getSystemInfo
}; 