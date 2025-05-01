"use client";

import { useState, useCallback } from 'react';
import { useApi } from '@/lib/api-context';
// These will be available after code generation
import { DefaultService } from '@/lib/api/services/DefaultService';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

export function useAuth() {
  const { auth, login: setAuth, logout: clearAuth } = useApi();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      // This will need to be adjusted based on the generated client
      const response = await DefaultService.authLoginPost({
        username: credentials.username,
        password: credentials.password,
      });

      // Handle successful login
      if (response.success) {
        // Extract data from response
        const { user, tokens } = response.data;
        
        // Store tokens and user info
        localStorage.setItem('refreshToken', tokens.refresh_token);
        
        // Set auth state 
        setAuth(
          tokens.access_token,
          user._id,
          user.username,
          user.role
        );
        
        return true;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setAuth]);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      // This will need to be adjusted based on the generated client
      const response = await DefaultService.authRegisterPost({
        username: data.username,
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      });

      // Handle successful registration
      if (response.success) {
        // Extract data from response
        const { user, tokens } = response.data;
        
        // Store tokens and user info
        localStorage.setItem('refreshToken', tokens.refresh_token);
        
        // Set auth state
        setAuth(
          tokens.access_token,
          user._id,
          user.username,
          user.role
        );
        
        return true;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setAuth]);

  const logout = useCallback(() => {
    clearAuth();
    return true;
  }, [clearAuth]);

  return {
    isAuthenticated: auth.isAuthenticated,
    user: {
      id: auth.userId,
      username: auth.username,
      role: auth.role,
    },
    loading,
    error,
    login,
    register,
    logout,
  };
} 