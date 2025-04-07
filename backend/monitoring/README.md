# SkillSwap Monitoring and Error Tracking System

This module provides a comprehensive monitoring, logging, and error tracking solution for the SkillSwap backend API. It's designed to help with debugging issues, tracking performance, and ensuring the overall health and reliability of the application.

## Features

- **Error Tracking with Sentry**: Capture and analyze exceptions with detailed context
- **Structured Logging with Pino**: Fast, structured logging with different severity levels
- **Performance Monitoring**: Track API response times and database query performance
- **Health Checks**: Monitor the status of critical services like the database
- **Dashboard**: Real-time monitoring dashboard with system metrics
- **Alerting System**: Get notified about critical issues via multiple channels
- **User Feedback Collection**: Collect and categorize error reports from users
- **Centralized Error Handling**: Unified approach to error handling across the application

## Installation

The monitoring system is installed as part of the main backend application. Make sure all required dependencies are installed:

```bash
cd backend
npm install
```

If you want to install just the monitoring-specific dependencies:

```bash
cd backend
npm install @sentry/node @sentry/profiling-node express-pino-logger pino pino-pretty express-status-monitor node-cron
```

## Configuration

Copy the sample configuration file and customize it:

```bash
cp monitoring/config.sample.env .env
```

Edit the `.env` file with your specific settings:

- Set `SENTRY_DSN` to your Sentry project DSN
- Configure log levels with `LOG_LEVEL`
- Set up alert recipients with `ALERT_EMAIL_RECIPIENTS` and `ALERT_SLACK_WEBHOOK`
- Adjust alert thresholds with settings like `CPU_ALERT_THRESHOLD` and `ERROR_RATE_ALERT_THRESHOLD`

## Usage

### Basic Setup

The monitoring system is automatically initialized when the server starts. In your `server.js`:

```javascript
const monitoring = require('./monitoring');

// Initialize monitoring with default configuration
monitoring.initializeMonitoring(app);

// Add routes and other middleware here...

// Setup error handlers (must be after all routes)
monitoring.setupErrorHandlers(app);
```

### Customizing Configuration

You can customize the monitoring configuration:

```javascript
monitoring.initializeMonitoring(app, {
  sentry: true,              // Enable/disable Sentry integration
  logging: true,             // Enable/disable HTTP request logging
  healthChecks: true,        // Enable/disable health check endpoint
  performanceMonitoring: true, // Enable/disable performance monitoring
  alerts: true,              // Enable/disable alert system
  feedback: true,            // Enable/disable user feedback system
  errorHandling: true,       // Enable/disable global error handlers
  // Custom configuration for status monitor
  statusMonitorConfig: {
    path: '/status',         // Status page URL
    authorization: {
      enable: true,
      users: [{ username: 'admin', password: 'password' }]
    }
  }
});
```

### Logging

Use the structured logger throughout your application:

```javascript
const { getLogger } = require('./monitoring/logger');

// Create a logger for a specific component
const logger = getLogger('auth-service');

// Log with different levels and structured data
logger.info({ userId: '123', action: 'login' }, 'User logged in successfully');
logger.error({ err: error, userId: '123' }, 'Failed to authenticate user');
```

### Error Handling

Use the custom error classes and async handler:

```javascript
const { ApiError, asyncHandler } = require('./monitoring');

// Route handler with automatic error catching
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  res.json(user);
}));
```

### Tracking Performance

Create performance markers for critical operations:

```javascript
const { createPerformanceMarker } = require('./monitoring/performance');

async function importantOperation() {
  const marker = createPerformanceMarker('important-operation').start();
  
  // Do work here
  
  const duration = marker.end(); // Returns duration in milliseconds
  console.log(`Operation completed in ${duration}ms`);
}
```

### Manual Health Checks

Run health checks programmatically:

```javascript
const { runHealthCheck } = require('./monitoring/health');

// Check system health and get results
const health = await runHealthCheck();
console.log(`System status: ${health.status}`);
```

### Sending Alerts

Send manual alerts for important events:

```javascript
const { sendAlert } = require('./monitoring/alerts');

// Send a critical alert
await sendAlert(
  'Database Connection Lost',
  'Unable to connect to MongoDB instance',
  { attemptCount: 5, lastError: errorMsg },
  'error',
  'manual:database:connection'
);
```

## Endpoints

The monitoring system adds these endpoints to your API:

- **GET /health**: Returns health status of the application
- **GET /status**: Real-time performance monitoring dashboard
- **POST /api/feedback**: Endpoint for collecting user feedback
- **POST /api/error-report**: Endpoint for client-side error reporting

## Frontend Integration

The system includes a React-compatible error tracking client:

```javascript
// In your frontend app entry point
import { initializeErrorTracking, ErrorBoundary } from './utils/errorTracking';

// Initialize error tracking
initializeErrorTracking({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// In your components
function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Best Practices

1. **Use Structured Logging**: Always include relevant context data in log messages
2. **Be Mindful of Sensitive Data**: Never log passwords, tokens or PII
3. **Use ApiError Classes**: Use the provided error classes for consistent error responses
4. **Monitor Dashboard Regularly**: Check the /status page for performance issues
5. **Review Error Reports**: Regularly check Sentry and feedback for user-reported issues

## Contributing

To extend the monitoring system:

1. Add new components in the `monitoring/` folder
2. Update the main `index.js` to expose your new functionality
3. Document your additions in this README 