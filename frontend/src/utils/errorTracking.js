import React from 'react';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import axios from 'axios';

// Define API endpoints
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ERROR_ENDPOINT = `${API_URL}/api/error-report`;
const FEEDBACK_ENDPOINT = `${API_URL}/api/feedback`;

/**
 * Initialize error tracking systems (Sentry and custom)
 * @param {Object} options Configuration options
 */
export const initializeErrorTracking = (options = {}) => {
  const {
    environment = process.env.NODE_ENV || 'development',
    dsn = process.env.REACT_APP_SENTRY_DSN,
    release = process.env.REACT_APP_VERSION,
    tracesSampleRate = 1.0,
    enableInDev = false
  } = options;
  
  // Only initialize in production or if enableInDev is true
  if (environment !== 'development' || enableInDev) {
    // Initialize Sentry if DSN is provided
    if (dsn) {
      Sentry.init({
        dsn,
        integrations: [new BrowserTracing()],
        environment,
        release,
        tracesSampleRate,
        beforeSend(event) {
          // Don't send events in test environment
          if (environment === 'test') {
            return null;
          }
          return event;
        }
      });
      
      console.log(`Error tracking initialized with Sentry (${environment})`);
    } else {
      console.log('Sentry DSN not provided, using local error tracking only');
    }
    
    // Setup global error handlers
    setupGlobalErrorHandlers();
  }
};

/**
 * Set user context for error tracking
 * @param {Object} user User object with id, email, etc.
 */
export const setUserContext = (user) => {
  if (!user) {
    Sentry.configureScope(scope => scope.setUser(null));
    return;
  }
  
  // Set user info in Sentry
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  });
};

/**
 * Log an error to Sentry and the backend API
 * @param {Error} error The error object
 * @param {Object} additionalInfo Additional context
 * @param {boolean} sendToBackend Whether to send to backend
 * @returns {string} Error ID if available
 */
export const logError = async (error, additionalInfo = {}, sendToBackend = true) => {
  // Report to Sentry
  const eventId = Sentry.captureException(error, {
    extra: additionalInfo
  });
  
  // Get browser info
  const browserInfo = {
    name: navigator.userAgent,
    version: navigator.appVersion,
    os: navigator.platform,
    device: detectDeviceType()
  };
  
  // Send to backend if enabled
  if (sendToBackend) {
    try {
      const response = await axios.post(ERROR_ENDPOINT, {
        message: error.message,
        stack: error.stack,
        componentStack: additionalInfo.componentStack,
        url: window.location.href,
        sentryEventId: eventId,
        browserInfo,
        timestamp: new Date().toISOString()
      });
      
      return response.data.errorId;
    } catch (apiError) {
      console.error('Failed to send error to API:', apiError);
    }
  }
  
  return eventId;
};

/**
 * Submit user feedback about an error or issue
 * @param {Object} feedback Feedback data
 * @returns {Object} Response data
 */
export const submitFeedback = async (feedback) => {
  try {
    const response = await axios.post(FEEDBACK_ENDPOINT, {
      ...feedback,
      browserInfo: {
        name: navigator.userAgent,
        version: navigator.appVersion,
        os: navigator.platform,
        device: detectDeviceType()
      },
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    if (feedback.type === 'error' && feedback.sentryEventId) {
      // Associate feedback with Sentry event
      Sentry.withScope(scope => {
        scope.setExtra('feedbackId', response.data.feedbackId);
        scope.setTag('feedback', 'submitted');
        Sentry.captureMessage(
          `User Feedback: ${feedback.title || feedback.description.substring(0, 50)}`,
          Sentry.Severity.Info
        );
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    throw error;
  }
};

// Helper functions

/**
 * Setup global error handlers for uncaught errors
 */
const setupGlobalErrorHandlers = () => {
  // Handle uncaught errors
  window.onerror = function(message, source, lineno, colno, error) {
    logError(error || new Error(message), {
      source,
      lineno,
      colno,
      type: 'global'
    });
    
    // Return false to allow the default browser error handling
    return false;
  };
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    logError(error, {
      type: 'unhandledrejection'
    });
  });
};

/**
 * Detect device type from user agent
 * @returns {string} Device type
 */
const detectDeviceType = () => {
  const ua = navigator.userAgent;
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
};

/**
 * Error boundary component for React
 * Usage: <ErrorBoundary><YourComponent /></ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log the error with component stack
    logError(error, {
      componentStack: errorInfo?.componentStack,
      ...this.props.additionalInfo
    });
  }
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }
      
      // Default error UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>The error has been reported. Please try again later.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Export Sentry with our custom utilities
export { Sentry }; 