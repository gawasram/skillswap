// User model
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'mentor' | 'admin';
  bio?: string;
  avatar?: string;
  skills?: string[];
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request and response types
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorToken?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
  require2FA?: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
}

export interface TwoFactorVerifyRequest {
  userId: string;
  token: string;
}

export interface TwoFactorEnableResponse {
  enabled: boolean;
  backupCodes: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token: string;
} 