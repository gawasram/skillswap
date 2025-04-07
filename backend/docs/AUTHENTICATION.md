# SkillSwap Authentication System

This document describes the authentication system implemented for the SkillSwap platform.

## Overview

The SkillSwap authentication system provides a secure, robust way to authenticate users and protect API routes. It includes the following features:

- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC)
- Permission-based authorization
- Two-factor authentication (2FA) using TOTP
- Password hashing and security
- Account lockout prevention

## Authentication Flow

### Registration

1. User submits registration details (email, username, password, etc.)
2. System validates input and checks for existing users with the same email/username
3. Password is hashed using bcrypt with a salt
4. User is created with default 'user' role and permissions
5. JWT access token and refresh token are generated and returned

### Login

1. User submits email and password
2. System validates credentials
3. If invalid, failed login attempts counter is incremented
4. If valid, JWT access token and refresh token are generated
5. If 2FA is enabled for the user, the system requires a verification code
6. Upon successful 2FA verification, the user is logged in

### Token Refresh

1. When the access token expires, the client sends the refresh token
2. System validates the refresh token and issues a new access token
3. The refresh token has a longer lifespan (7 days by default)

### Logout

1. User sends a logout request
2. The refresh token is invalidated
3. Client discards the access token

## Token Structure

### Access Token

- Contains: User ID, role, permissions
- Short-lived (15 minutes by default)
- Used for API authentication

### Refresh Token

- Stored in the database
- Long-lived (7 days by default)
- Used to obtain new access tokens

## Role-Based Access Control

The system implements three primary roles:

1. **user**: Basic role for all registered users
   - Can read, create, update, and delete their own resources

2. **mentor**: Role for users who provide mentorship
   - Can read any user's public information
   - Can create, update, and delete their own resources

3. **admin**: Administrative role
   - Has full access to all resources
   - Can manage users, roles, and system settings

## Permission System

Permissions follow the format `action:scope` where:
- `action` is one of: `read`, `create`, `update`, `delete`
- `scope` is one of: `own` (user's own resources) or `any` (any user's resources)

Examples:
- `read:own`: User can read their own resources
- `update:any`: User can update any user's resources

## Two-Factor Authentication

The system implements TOTP (Time-based One-Time Password) using the speakeasy library:

1. **Setup**: 
   - System generates a secret key for the user
   - A QR code is provided for the user to scan with an authenticator app (Google Authenticator, Authy, etc.)

2. **Verification**:
   - User enters the 6-digit code from their authenticator app
   - System verifies the code against the stored secret
   - After successful verification, 2FA is enabled for the account

3. **Backup Codes**:
   - System generates 10 one-time use backup codes
   - These can be used if the user loses access to their authenticator device

## Security Measures

### Password Security

- Passwords are hashed using bcrypt with a cost factor of 12
- Password requirements: minimum 8 characters
- Passwords are never returned in API responses

### Account Lockout

- After 5 failed login attempts, the account is locked
- An admin must unlock the account manually

### Token Management

- Refresh tokens can be revoked/invalidated
- Tokens contain minimal information to reduce payload size
- Environment-specific JWT secrets

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with email and password
- `POST /api/auth/verify-2fa`: Verify 2FA code during login
- `POST /api/auth/logout`: Logout and invalidate refresh token
- `POST /api/auth/refresh`: Refresh access token

### Two-Factor Authentication

- `GET /api/auth/2fa/setup/:userId`: Set up 2FA for a user
- `POST /api/auth/2fa/enable/:userId`: Enable 2FA after verification
- `POST /api/auth/2fa/disable/:userId`: Disable 2FA

### Middleware

The system includes several middleware functions:

- `authenticateToken`: Validates JWT access token
- `authorizeRoles`: Restricts access based on user roles
- `authorizePermissions`: Restricts access based on user permissions
- `requireTwoFactor`: Enforces 2FA verification for sensitive routes
- `trackLoginAttempts`: Tracks failed login attempts

## Implementation Details

- JWT tokens are signed using HS256 algorithm
- Refresh tokens are generated using secure random bytes
- 2FA uses TOTP algorithm (RFC 6238)
- Passwords are hashed using bcrypt with a cost factor of 12

## Example Usage

### Protecting Routes

```javascript
// Require authentication for all routes
router.use(authenticateToken);

// Only admins can access this route
router.get('/admin-only', authorizeRoles('admin'), (req, res) => {
  // ... handler code
});

// Only users with read:any permission can access
router.get('/reports', authorizePermissions('read:any'), (req, res) => {
  // ... handler code
});

// Require 2FA for sensitive operations
router.post('/sensitive', requireTwoFactor, (req, res) => {
  // ... handler code
});
```

## Client Implementation Recommendations

1. Store the access token securely (memory for SPAs, HTTP-only cookies for server-rendered apps)
2. Implement automatic token refresh when the access token is about to expire
3. Clear tokens on logout
4. Handle 2FA flow in the UI 