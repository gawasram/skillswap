const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../../models/user');
const logger = require('../../config/logger');

/**
 * Generate a new TOTP secret for a user
 */
const generateTOTPSecret = async (userId) => {
  try {
    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `SkillSwap:${userId}`,
      length: 20
    });
    
    // Get user and update with the new secret
    const user = await User.findById(userId).select('+twoFactorSecret');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Store secret on user
    user.twoFactorSecret = secret.base32;
    await user.save();
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl
    };
  } catch (error) {
    logger.error(`Error generating 2FA secret: ${error.message}`);
    throw new Error('Could not generate 2FA secret');
  }
};

/**
 * Verify a TOTP token
 */
const verifyTOTPToken = async (userId, token) => {
  try {
    // Get user with secret
    const user = await User.findById(userId).select('+twoFactorSecret');
    
    if (!user || !user.twoFactorSecret) {
      return false;
    }
    
    // Verify the token
    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step before/after for time syncing issues
    });
  } catch (error) {
    logger.error(`Error verifying 2FA token: ${error.message}`);
    return false;
  }
};

/**
 * Enable 2FA for a user
 */
const enableTwoFactor = async (userId, token) => {
  try {
    // First verify the token
    const isValid = await verifyTOTPToken(userId, token);
    
    if (!isValid) {
      throw new Error('Invalid verification code');
    }
    
    // Get user and enable 2FA
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Enable 2FA and generate backup codes
    user.twoFactorEnabled = true;
    const backupCodes = user.generateTwoFactorBackupCodes();
    await user.save();
    
    return {
      enabled: true,
      backupCodes
    };
  } catch (error) {
    logger.error(`Error enabling 2FA: ${error.message}`);
    throw error;
  }
};

/**
 * Disable 2FA for a user
 */
const disableTwoFactor = async (userId, token) => {
  try {
    // First verify the token
    const isValid = await verifyTOTPToken(userId, token);
    
    if (!isValid) {
      throw new Error('Invalid verification code');
    }
    
    // Get user and disable 2FA
    const user = await User.findById(userId).select('+twoFactorSecret');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Disable 2FA and remove secret
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();
    
    return { disabled: true };
  } catch (error) {
    logger.error(`Error disabling 2FA: ${error.message}`);
    throw error;
  }
};

/**
 * Verify a backup code
 */
const verifyBackupCode = async (userId, code) => {
  try {
    // Get user with backup codes
    const user = await User.findById(userId).select('+twoFactorBackupCodes.code');
    
    if (!user || !user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
      return false;
    }
    
    // Find the backup code
    const backupCodeIndex = user.twoFactorBackupCodes.findIndex(
      backupCode => backupCode.code === code && !backupCode.used
    );
    
    if (backupCodeIndex === -1) {
      return false;
    }
    
    // Mark as used
    user.twoFactorBackupCodes[backupCodeIndex].used = true;
    await user.save();
    
    return true;
  } catch (error) {
    logger.error(`Error verifying backup code: ${error.message}`);
    return false;
  }
};

module.exports = {
  generateTOTPSecret,
  verifyTOTPToken,
  enableTwoFactor,
  disableTwoFactor,
  verifyBackupCode
}; 