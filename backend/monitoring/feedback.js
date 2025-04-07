const mongoose = require('mongoose');
const { getLogger } = require('./logger');
const { captureException } = require('./sentry');

const logger = getLogger('feedback');

/**
 * Create feedback schema for storing user-reported issues
 */
const FeedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['error', 'bug', 'improvement', 'feature', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  screenshot: {
    type: String, // URL to screenshot if provided
  },
  technicalDetails: {
    errorMessage: String,
    errorStack: String,
    browserInfo: {
      name: String,
      version: String,
      os: String,
      device: String
    },
    url: String,
    componentStack: String,
    timestamp: Date
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved', 'closed', 'duplicate'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  resolution: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: String,
  userRole: String,
  associatedSession: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

/**
 * Initialize feedback model only if it hasn't been initialized
 * @returns {Object} Mongoose model for Feedback
 */
const getFeedbackModel = () => {
  try {
    return mongoose.model('Feedback');
  } catch (error) {
    return mongoose.model('Feedback', FeedbackSchema);
  }
};

/**
 * Submit user feedback and associate with Sentry if applicable
 * @param {Object} feedbackData Feedback data submitted by user
 * @returns {Object} Created feedback entry
 */
const submitFeedback = async (feedbackData) => {
  const Feedback = getFeedbackModel();
  
  // Log the feedback
  logger.info(
    {
      type: feedbackData.type,
      title: feedbackData.title,
      userId: feedbackData.userId
    },
    'User submitted feedback'
  );
  
  // If this is an error report, also send to Sentry
  if (feedbackData.type === 'error' && feedbackData.technicalDetails) {
    const error = new Error(feedbackData.title);
    error.stack = feedbackData.technicalDetails.errorStack;
    
    captureException(error, {
      user: {
        id: feedbackData.userId,
        email: feedbackData.userEmail,
        role: feedbackData.userRole
      },
      tags: {
        feedbackId: 'pending', // Will be updated after DB save
        source: 'user-reported'
      },
      extra: {
        description: feedbackData.description,
        browserInfo: feedbackData.technicalDetails.browserInfo,
        url: feedbackData.technicalDetails.url,
        componentStack: feedbackData.technicalDetails.componentStack
      }
    });
  }
  
  // Save the feedback to the database
  const feedback = new Feedback(feedbackData);
  await feedback.save();
  
  return feedback;
};

/**
 * Create Express route handler for feedback submission
 * @returns {Function} Express route handler
 */
const feedbackHandler = () => {
  return async (req, res, next) => {
    try {
      // Expect feedback data in request body
      const feedbackData = req.body;
      
      // Inject user information if authenticated
      if (req.user) {
        feedbackData.userId = req.user.id;
        feedbackData.userEmail = req.user.email;
        feedbackData.userRole = req.user.role;
      }
      
      // Add session ID if available
      if (req.sessionID) {
        feedbackData.associatedSession = req.sessionID;
      }
      
      // Submit the feedback
      const feedback = await submitFeedback(feedbackData);
      
      // Return the created feedback with ID
      res.status(201).json({
        message: 'Feedback submitted successfully',
        feedbackId: feedback._id
      });
    } catch (error) {
      logger.error(
        { err: error },
        'Failed to submit feedback'
      );
      next(error);
    }
  };
};

/**
 * Middleware to capture client-side errors
 * @returns {Function} Express route handler
 */
const clientErrorHandler = () => {
  return async (req, res, next) => {
    try {
      const errorData = req.body;
      
      // Format error data for feedback system
      const feedbackData = {
        type: 'error',
        title: errorData.message || 'Client-side error',
        description: 'Automatically captured client error',
        technicalDetails: {
          errorMessage: errorData.message,
          errorStack: errorData.stack,
          browserInfo: errorData.browserInfo,
          url: errorData.url,
          componentStack: errorData.componentStack,
          timestamp: new Date()
        },
        status: 'new',
        priority: determinePriority(errorData),
        // Add user info if available
        ...(req.user && {
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role
        }),
        associatedSession: req.sessionID
      };
      
      // Submit the error feedback
      const feedback = await submitFeedback(feedbackData);
      
      res.status(200).json({
        message: 'Error reported successfully',
        errorId: feedback._id
      });
    } catch (error) {
      logger.error(
        { err: error },
        'Failed to process client error'
      );
      // Still return success to client even if processing failed
      res.status(200).json({
        message: 'Error received'
      });
    }
  };
};

/**
 * Determine priority of an error based on its characteristics
 * @param {Object} errorData Error data from client
 * @returns {string} Priority level
 */
const determinePriority = (errorData) => {
  // Critical errors usually contain specific keywords or affect core functionality
  const criticalPatterns = [
    'crash', 'exception', 'fatal', 'authentication', 'payment', 'security',
    'unable to load', 'data loss', 'corruption'
  ];
  
  // Check if any critical patterns are in the error message
  if (errorData.message && 
      criticalPatterns.some(pattern => 
        errorData.message.toLowerCase().includes(pattern))) {
    return 'critical';
  }
  
  // Check if this is a common UI error vs a more significant error
  if (errorData.componentStack && 
      !errorData.stack && 
      errorData.message && 
      (errorData.message.includes('render') || 
       errorData.message.includes('prop'))) {
    return 'low';
  }
  
  // Default to medium priority
  return 'medium';
};

module.exports = {
  submitFeedback,
  feedbackHandler,
  clientErrorHandler,
  getFeedbackModel
}; 