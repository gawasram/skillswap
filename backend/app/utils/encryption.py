import base64
import os
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.config.settings import get_settings
from app.utils.logging import get_logger

settings = get_settings()
logger = get_logger("encryption")

# Global Fernet instance
_fernet = None

def _initialize_fernet() -> Optional[Fernet]:
    """Initialize the Fernet cipher with the encryption key"""
    global _fernet
    
    if _fernet is not None:
        return _fernet
    
    try:
        if settings.encryption_key:
            # Use the provided encryption key
            key = settings.encryption_key
            
            # If key is not in the correct format (32 byte base64), derive a key
            if len(key) != 44 or not key.endswith('='):
                # Derive a key using PBKDF2
                salt = b'skillswap_salt'  # In production, use a secure random salt
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=salt,
                    iterations=100000,
                )
                derived_key = base64.urlsafe_b64encode(kdf.derive(key.encode()))
                key = derived_key
            
            _fernet = Fernet(key)
            return _fernet
        else:
            logger.warning("No encryption key found. Encryption features will be disabled.")
            return None
    except Exception as e:
        logger.error(f"Failed to initialize encryption: {str(e)}", exc_info=True)
        return None

def encrypt(text: str) -> Optional[str]:
    """
    Encrypt a string value
    Returns None if encryption fails or is not configured
    """
    if not text:
        return text
        
    fernet = _initialize_fernet()
    if not fernet:
        return text
        
    try:
        encrypted_bytes = fernet.encrypt(text.encode())
        return base64.urlsafe_b64encode(encrypted_bytes).decode()
    except Exception as e:
        logger.error(f"Encryption failed: {str(e)}", exc_info=True)
        return None

def decrypt(encrypted_text: str) -> Optional[str]:
    """
    Decrypt an encrypted string value
    Returns None if decryption fails or is not configured
    """
    if not encrypted_text:
        return encrypted_text
    
    fernet = _initialize_fernet()
    if not fernet:
        return encrypted_text
        
    try:
        decoded_bytes = base64.urlsafe_b64decode(encrypted_text.encode())
        decrypted_bytes = fernet.decrypt(decoded_bytes)
        return decrypted_bytes.decode()
    except Exception as e:
        logger.error(f"Decryption failed: {str(e)}", exc_info=True)
        return None

def rotate_encryption_key(new_key: str) -> bool:
    """
    Rotate the encryption key by re-encrypting all sensitive data
    Returns True if successful, False otherwise
    
    This is a placeholder function that should be implemented
    with actual logic to retrieve, decrypt, and re-encrypt all
    sensitive data in the database
    """
    # Get all documents with encrypted fields
    # Decrypt them with the old key
    # Re-encrypt them with the new key
    # Update the documents in the database
    
    logger.warning("Key rotation not implemented")
    return False

def generate_key() -> str:
    """
    Generate a new Fernet key
    """
    key = Fernet.generate_key()
    return key.decode() 