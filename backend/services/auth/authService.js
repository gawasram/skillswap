const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../models/user');
const { getSecret } = require('../../config/secrets');
const logger = require('../../config/logger');

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId, role, permissions) => {
  const jwtSecret = getSecret('JWT_SECRET') || process.env.JWT_SECRET;
  const jwtExpiry = process.env.JWT_EXPIRY || '15m';
  
  return jwt.sign(
    { 
      userId, 
      role,
      permissions
    },
    jwtSecret,
    { expiresIn: jwtExpiry }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = async (userId) => {
  try {
    // Create a refresh token that expires in 7 days
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Update user with refresh token
    await User.findByIdAndUpdate(userId, {
      refreshToken,
      refreshTokenExpiresAt
    });
    
    return refreshToken;
  } catch (error) {
    logger.error(`Error generating refresh token: ${error.message}`);
    throw new Error('Error generating refresh token');
  }
};

/**
 * Validate access token
 */
const validateAccessToken = (token) => {
  try {
    const jwtSecret = getSecret('JWT_SECRET') || process.env.JWT_SECRET;
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    logger.error(`Token validation error: ${error.message}`);
    return null;
  }
};

/**
 * Validate refresh token
 */
const validateRefreshToken = async (userId, refreshToken) => {
  try {
    const user = await User.findById(userId).select('+refreshToken +refreshTokenExpiresAt');
    
    if (!user || user.refreshToken !== refreshToken) {
      return false;
    }
    
    // Check if refresh token is expired
    if (user.refreshTokenExpiresAt < new Date()) {
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error(`Refresh token validation error: ${error.message}`);
    return false;
  }
};

/**
 * Refresh the access token using refresh token
 */
const refreshAccessToken = async (userId, refreshToken) => {
  try {
    // Validate refresh token
    const isValidRefreshToken = await validateRefreshToken(userId, refreshToken);
    
    if (!isValidRefreshToken) {
      throw new Error('Invalid refresh token');
    }
    
    // Get user data to include in new token
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate new access token
    return generateAccessToken(user._id, user.role, user.permissions);
  } catch (error) {
    logger.error(`Access token refresh error: ${error.message}`);
    throw error;
  }
};

/**
 * Invalidate refresh token
 */
const invalidateRefreshToken = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
      refreshTokenExpiresAt: null
    });
    
    return true;
  } catch (error) {
    logger.error(`Error invalidating refresh token: ${error.message}`);
    return false;
  }
};

/**
 * Get user from access token
 */
const getUserFromToken = async (token) => {
  try {
    const decoded = validateAccessToken(token);
    
    if (!decoded) {
      return null;
    }
    
    const user = await User.findById(decoded.userId);
    return user;
  } catch (error) {
    logger.error(`Error getting user from token: ${error.message}`);
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  validateAccessToken,
  validateRefreshToken,
  refreshAccessToken,
  invalidateRefreshToken,
  getUserFromToken
}; 