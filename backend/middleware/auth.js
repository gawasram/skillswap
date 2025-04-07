const { validateAccessToken, getUserFromToken } = require('../services/auth/authService');
const { verifyTOTPToken, verifyBackupCode } = require('../services/auth/twoFactorService');
const logger = require('../config/logger');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token is required' 
      });
    }
    
    // Verify token
    const decodedToken = validateAccessToken(token);
    
    if (!decodedToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    // Attach user information to request
    req.user = {
      userId: decodedToken.userId,
      role: decodedToken.role,
      permissions: decodedToken.permissions
    };
    
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

/**
 * Middleware to check for specific roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this resource' 
      });
    }
    
    next();
  };
};

/**
 * Middleware to check for specific permissions
 */
const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(
      permission => req.user.permissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this resource' 
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if a user has 2FA enabled and to enforce it
 */
const requireTwoFactor = async (req, res, next) => {
  try {
    const user = await getUserFromToken(req.headers.authorization.split(' ')[1]);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // If 2FA is not enabled, just continue
    if (!user.twoFactorEnabled) {
      return next();
    }
    
    // Check for 2FA token in headers or body
    const twoFactorToken = req.headers['x-2fa-token'] || req.body.twoFactorToken;
    const backupCode = req.headers['x-backup-code'] || req.body.backupCode;
    
    if (!twoFactorToken && !backupCode) {
      return res.status(403).json({
        success: false,
        message: '2FA verification required',
        require2FA: true
      });
    }
    
    // Verify 2FA token or backup code
    let isValid = false;
    
    if (twoFactorToken) {
      isValid = await verifyTOTPToken(user._id, twoFactorToken);
    } else if (backupCode) {
      isValid = await verifyBackupCode(user._id, backupCode);
    }
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code',
        require2FA: true
      });
    }
    
    next();
  } catch (error) {
    logger.error(`2FA authentication error: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

/**
 * Middleware to handle failed login attempts
 */
const trackLoginAttempts = async (req, res, next) => {
  const { email } = req.body;
  
  // Store the email in request so it can be used later
  req.loginEmail = email;
  
  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizePermissions,
  requireTwoFactor,
  trackLoginAttempts
}; 