const nodeCron = require('node-cron');
const { getLogger } = require('./logger');
const { runHealthCheck } = require('./health');

const logger = getLogger('alerts');

// Store alert configuration
let alertConfig = {
  enabled: process.env.ENABLE_ALERTS === 'true',
  channels: {
    console: true,
    email: process.env.ENABLE_EMAIL_ALERTS === 'true',
    slack: process.env.ENABLE_SLACK_ALERTS === 'true'
  },
  thresholds: {
    cpu: parseInt(process.env.CPU_ALERT_THRESHOLD || '80', 10), // 80% CPU usage
    memory: parseInt(process.env.MEMORY_ALERT_THRESHOLD || '85', 10), // 85% memory usage
    responseTime: parseInt(process.env.RESPONSE_TIME_ALERT_THRESHOLD || '2000', 10), // 2000ms
    errorRate: parseFloat(process.env.ERROR_RATE_ALERT_THRESHOLD || '0.05', 10) // 5% error rate
  },
  cooldown: {
    // Time in minutes before the same alert can be triggered again
    default: parseInt(process.env.ALERT_COOLDOWN || '15', 10)
  },
  recipients: {
    email: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
    slack: process.env.ALERT_SLACK_WEBHOOK
  }
};

// Track active alerts to prevent alert flooding
const activeAlerts = new Map();

/**
 * Configure alert settings
 * @param {Object} config Configuration to merge with existing
 * @returns {Object} Updated configuration
 */
const configureAlerts = (config = {}) => {
  alertConfig = {
    ...alertConfig,
    ...config,
    // Deep merge nested objects
    channels: { ...alertConfig.channels, ...(config.channels || {}) },
    thresholds: { ...alertConfig.thresholds, ...(config.thresholds || {}) },
    cooldown: { ...alertConfig.cooldown, ...(config.cooldown || {}) },
    recipients: { ...alertConfig.recipients, ...(config.recipients || {}) }
  };
  
  return alertConfig;
};

/**
 * Check if an alert is in cooldown period
 * @param {string} alertId Unique identifier for the alert
 * @param {number} cooldownMinutes Minutes to wait before allowing the same alert
 * @returns {boolean} Whether the alert is in cooldown
 */
const isInCooldown = (alertId, cooldownMinutes = alertConfig.cooldown.default) => {
  if (!activeAlerts.has(alertId)) {
    return false;
  }
  
  const lastTriggered = activeAlerts.get(alertId);
  const cooldownMs = cooldownMinutes * 60 * 1000;
  
  return (Date.now() - lastTriggered) < cooldownMs;
};

/**
 * Send alert to configured channels
 * @param {string} title Alert title
 * @param {string} message Alert message
 * @param {Object} data Additional alert data
 * @param {string} level Alert level (error, warn, info)
 * @param {string} alertId Unique identifier for cooldown tracking
 */
const sendAlert = async (title, message, data = {}, level = 'error', alertId = null) => {
  if (!alertConfig.enabled) {
    return;
  }
  
  // Generate alertId if not provided
  if (!alertId) {
    alertId = `${level}:${title.replace(/\s+/g, '_').toLowerCase()}`;
  }
  
  // Check for cooldown
  if (isInCooldown(alertId)) {
    logger.debug(
      { alertId, lastTriggered: activeAlerts.get(alertId) },
      'Alert in cooldown period, skipping'
    );
    return;
  }
  
  // Record alert time
  activeAlerts.set(alertId, Date.now());
  
  // Format alert message
  const alert = {
    title,
    message,
    timestamp: new Date().toISOString(),
    level,
    data
  };
  
  // Log to console (always happens through logger)
  logger[level](
    { alert: { ...alert, id: alertId } },
    `ALERT: ${title} - ${message}`
  );
  
  // Send to email if enabled
  if (alertConfig.channels.email && alertConfig.recipients.email.length > 0) {
    try {
      // Implementation would use a mail service
      logger.info(
        { recipients: alertConfig.recipients.email, alert },
        'Email alert would be sent here'
      );
      
      // In a real implementation, you would send the email here
      // await sendEmail(alertConfig.recipients.email, title, message, alert);
    } catch (error) {
      logger.error(
        { err: error },
        'Failed to send email alert'
      );
    }
  }
  
  // Send to Slack if enabled
  if (alertConfig.channels.slack && alertConfig.recipients.slack) {
    try {
      // Implementation would use Slack webhook
      logger.info(
        { webhook: 'configured_webhook', alert },
        'Slack alert would be sent here'
      );
      
      // In a real implementation, you would send to Slack here
      // await sendSlackMessage(alertConfig.recipients.slack, title, message, alert);
    } catch (error) {
      logger.error(
        { err: error },
        'Failed to send Slack alert'
      );
    }
  }
  
  return alert;
};

/**
 * Create a scheduled health check job
 * @param {string} schedule Cron schedule expression
 * @returns {Object} The scheduled job
 */
const scheduleHealthCheckAlerts = (schedule = '*/5 * * * *') => { // Default: every 5 minutes
  const job = nodeCron.schedule(schedule, async () => {
    try {
      const health = await runHealthCheck();
      
      // Alert on error status
      if (health.status === 'error') {
        const errorComponents = Object.entries(health.components)
          .filter(([_, component]) => component.status === 'error')
          .map(([name]) => name);
        
        await sendAlert(
          'System Health Check Failed',
          `The following components are reporting errors: ${errorComponents.join(', ')}`,
          health,
          'error',
          'scheduled:health_check:error'
        );
      }
      
      // Alert on high CPU usage
      const cpuLoad = health.system.cpu.loadAvg[0];
      const cpuCores = health.system.cpu.cores;
      const cpuUsagePercent = (cpuLoad / cpuCores) * 100;
      
      if (cpuUsagePercent > alertConfig.thresholds.cpu) {
        await sendAlert(
          'High CPU Usage',
          `CPU usage is at ${cpuUsagePercent.toFixed(1)}% (threshold: ${alertConfig.thresholds.cpu}%)`,
          { cpuUsagePercent, cpuLoad, cpuCores },
          'warn',
          'scheduled:high_cpu'
        );
      }
      
      // Alert on high memory usage
      const memoryUsagePercent = health.system.systemMemory.usedPercentage;
      
      if (memoryUsagePercent > alertConfig.thresholds.memory) {
        await sendAlert(
          'High Memory Usage',
          `Memory usage is at ${memoryUsagePercent}% (threshold: ${alertConfig.thresholds.memory}%)`,
          health.system.systemMemory,
          'warn',
          'scheduled:high_memory'
        );
      }
    } catch (error) {
      logger.error(
        { err: error },
        'Failed to run scheduled health check for alerts'
      );
    }
  });
  
  return job;
};

/**
 * Middleware for triggering alerts on API errors
 * @returns {Function} Express error middleware
 */
const errorAlertMiddleware = () => {
  return (err, req, res, next) => {
    // Only alert on 5xx errors (server errors)
    if (!err.status || err.status >= 500) {
      sendAlert(
        'API Server Error',
        `${err.message || 'Unknown error'} at ${req.method} ${req.originalUrl}`,
        {
          error: {
            message: err.message,
            stack: err.stack,
            status: err.status || 500
          },
          request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent')
          }
        },
        'error',
        `api:${req.method}:${err.name || 'ServerError'}`
      );
    }
    
    // Continue to next error handler
    next(err);
  };
};

module.exports = {
  configureAlerts,
  sendAlert,
  scheduleHealthCheckAlerts,
  errorAlertMiddleware
}; 