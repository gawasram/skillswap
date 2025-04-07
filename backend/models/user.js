const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false, // Don't return password by default in queries
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  profilePicture: {
    type: String,
    default: 'default-profile.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'mentor', 'admin'],
    default: 'user',
  },
  permissions: [{
    type: String,
    enum: [
      'read:own', 'read:any', 
      'create:own', 'create:any', 
      'update:own', 'update:any', 
      'delete:own', 'delete:any'
    ],
  }],
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
  },
  skills: [{
    type: String,
    trim: true,
  }],
  refreshToken: {
    type: String,
    select: false, // Don't return refresh token by default
  },
  refreshTokenExpiresAt: {
    type: Date,
    select: false,
  },
  // Two-factor authentication fields
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  twoFactorBackupCodes: [{
    code: { type: String, select: false },
    used: { type: Boolean, default: false },
  }],
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  accountLocked: {
    type: Boolean,
    default: false,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lastActive: Date,
}, {
  timestamps: true,
});

// Pre-save middleware to hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to passwordResetToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Set expiry (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Method to generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  // Set expiry (24 hours)
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// Method to generate 2FA backup codes
userSchema.methods.generateTwoFactorBackupCodes = function() {
  const backupCodes = [];
  
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex');
    backupCodes.push({ code: code, used: false });
  }
  
  this.twoFactorBackupCodes = backupCodes;
  return backupCodes.map(item => item.code);
};

// Static method to check if user has a specific permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Static method to add role-based permissions
userSchema.statics.getDefaultPermissions = function(role) {
  switch (role) {
    case 'admin':
      return [
        'read:own', 'read:any', 
        'create:own', 'create:any', 
        'update:own', 'update:any', 
        'delete:own', 'delete:any'
      ];
    case 'mentor':
      return [
        'read:own', 'read:any', 
        'create:own', 'update:own', 
        'delete:own'
      ];
    case 'user':
    default:
      return [
        'read:own', 'create:own', 
        'update:own', 'delete:own'
      ];
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 