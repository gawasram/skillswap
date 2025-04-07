/**
 * Secrets Management Module
 * 
 * This module provides a secure way to handle sensitive information.
 * For production, consider using a dedicated secrets management service 
 * like AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Encryption key (in production, this should come from a secure external source)
const getEncryptionKey = () => {
  if (process.env.ENCRYPTION_KEY) {
    return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }
  
  // For dev/test only: generate and save a key if not exists
  if (process.env.NODE_ENV !== 'production') {
    const keyPath = path.join(__dirname, '..', '.encryption-key');
    
    if (fs.existsSync(keyPath)) {
      return Buffer.from(fs.readFileSync(keyPath, 'utf8'), 'hex');
    } else {
      const key = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(keyPath, key);
      return Buffer.from(key, 'hex');
    }
  }
  
  logger.error('No encryption key found. Secrets will not be secure!');
  return crypto.randomBytes(32); // Fallback - not secure for production
};

// Encrypt a value
const encrypt = (text) => {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption failed:', error);
    return null;
  }
};

// Decrypt a value
const decrypt = (text) => {
  if (!text) return null;
  
  try {
    const [ivHex, encryptedText] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    return null;
  }
};

// Get a secret, favoring environment variables
// For production, this should integrate with a cloud secrets manager
const getSecret = (key) => {
  if (process.env[key]) {
    return process.env[key];
  }
  
  // In production, integrate with a secrets manager service
  if (process.env.NODE_ENV === 'production') {
    // Implementation would depend on which service you use
    // Example for AWS Secrets Manager would be here
    logger.warn(`Secret ${key} not found in environment variables`);
    return null;
  }
  
  // For development, check a local secrets file
  try {
    const secretsPath = path.join(__dirname, '..', '.secrets.json');
    
    if (fs.existsSync(secretsPath)) {
      const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
      const encryptedValue = secrets[key];
      
      if (encryptedValue) {
        return decrypt(encryptedValue);
      }
    }
  } catch (error) {
    logger.error('Error reading from secrets file:', error);
  }
  
  return null;
};

// Set a secret (for development environments)
const setSecret = (key, value) => {
  if (process.env.NODE_ENV === 'production') {
    logger.warn('In production, secrets should be managed through a secure service, not set through code');
    return false;
  }
  
  try {
    const secretsPath = path.join(__dirname, '..', '.secrets.json');
    let secrets = {};
    
    if (fs.existsSync(secretsPath)) {
      secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    }
    
    secrets[key] = encrypt(value);
    
    fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));
    return true;
  } catch (error) {
    logger.error('Error writing to secrets file:', error);
    return false;
  }
};

module.exports = {
  getSecret,
  setSecret,
  encrypt,
  decrypt
}; 