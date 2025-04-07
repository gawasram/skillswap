const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireTwoFactor } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify two-factor authentication
 * @access  Public
 */
router.post('/verify-2fa', authController.verifyTwoFactor);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route   GET /api/auth/2fa/setup/:userId
 * @desc    Setup two-factor authentication
 * @access  Private
 */
router.get('/2fa/setup/:userId', authenticateToken, authController.setupTwoFactor);

/**
 * @route   POST /api/auth/2fa/enable/:userId
 * @desc    Enable two-factor authentication
 * @access  Private
 */
router.post('/2fa/enable/:userId', authenticateToken, authController.enableTwoFactorAuth);

/**
 * @route   POST /api/auth/2fa/disable/:userId
 * @desc    Disable two-factor authentication
 * @access  Private (requires 2FA)
 */
router.post('/2fa/disable/:userId', authenticateToken, requireTwoFactor, authController.disableTwoFactorAuth);

module.exports = router;
