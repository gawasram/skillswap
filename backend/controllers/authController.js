const User = require('../models/user');
const logger = require('../config/logger');
const { generateAccessToken, generateRefreshToken, refreshAccessToken, invalidateRefreshToken } = require('../services/auth/authService');
const { generateTOTPSecret, verifyTOTPToken, enableTwoFactor, disableTwoFactor, verifyBackupCode } = require('../services/auth/twoFactorService');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { email, username, password, fullName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      fullName,
      permissions: User.getDefaultPermissions('user')
    });
    
    await user.save();
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role, user.permissions);
    const refreshToken = await generateRefreshToken(user._id);
    
    // Send success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is locked
    if (user.accountLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked due to too many failed login attempts'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        attemptsLeft: Math.max(0, 5 - user.failedLoginAttempts)
      });
    }
    
    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.lastActive = new Date();
    await user.save();
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role, user.permissions);
    const refreshToken = await generateRefreshToken(user._id);
    
    // Check if 2FA is required
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        require2FA: true,
        message: 'Two-factor authentication required',
        userId: user._id,
        refreshToken
      });
    }
    
    // Send success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify Two-Factor Authentication
 */
const verifyTwoFactor = async (req, res) => {
  try {
    const { userId, token, backupCode } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!token && !backupCode) {
      return res.status(400).json({
        success: false,
        message: 'Verification code or backup code is required'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify token or backup code
    let isValid = false;
    
    if (token) {
      isValid = await verifyTOTPToken(userId, token);
    } else if (backupCode) {
      isValid = await verifyBackupCode(userId, backupCode);
    }
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role, user.permissions);
    
    // Update last active
    user.lastActive = new Date();
    await user.save();
    
    // Send success response
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled
        },
        tokens: {
          accessToken
        }
      }
    });
  } catch (error) {
    logger.error(`2FA verification error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error verifying two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Invalidate refresh token
    await invalidateRefreshToken(userId);
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Refresh access token
 */
const refresh = async (req, res) => {
  try {
    const { userId, refreshToken } = req.body;
    
    if (!userId || !refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'User ID and refresh token are required'
      });
    }
    
    // Get new access token
    const accessToken = await refreshAccessToken(userId, refreshToken);
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken
      }
    });
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Setup Two-Factor Authentication
 */
const setupTwoFactor = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Generate 2FA secret and QR code
    const { secret, qrCode } = await generateTOTPSecret(userId);
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication setup initialized',
      data: {
        secret,
        qrCode
      }
    });
  } catch (error) {
    logger.error(`2FA setup error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error setting up two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Enable Two-Factor Authentication
 */
const enableTwoFactorAuth = async (req, res) => {
  try {
    const { userId } = req.params;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }
    
    // Enable 2FA
    const result = await enableTwoFactor(userId, token);
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      data: {
        backupCodes: result.backupCodes
      }
    });
  } catch (error) {
    logger.error(`2FA enable error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error enabling two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Disable Two-Factor Authentication
 */
const disableTwoFactorAuth = async (req, res) => {
  try {
    const { userId } = req.params;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }
    
    // Disable 2FA
    await disableTwoFactor(userId, token);
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    logger.error(`2FA disable error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error disabling two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  verifyTwoFactor,
  setupTwoFactor,
  enableTwoFactorAuth,
  disableTwoFactorAuth
}; 