"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { OpenAPI } from "./api"; // This will be generated

// Define your authentication state
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userId: string | null;
  username: string | null;
  role: string | null;
}

// Define the API context interface
interface ApiContextType {
  auth: AuthState;
  login: (token: string, userId: string, username: string, role: string) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

// Create context with default values
const ApiContext = createContext<ApiContextType>({
  auth: {
    token: null,
    isAuthenticated: false,
    userId: null,
    username: null,
    role: null,
  },
  login: () => {},
  logout: () => {},
  refreshToken: async () => false,
});

// API Provider component
export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    userId: null,
    username: null,
    role: null,
  });

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (token && userId) {
      setAuth({
        token,
        isAuthenticated: true,
        userId,
        username,
        role,
      });

      // Configure the OpenAPI base URL and token
      OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
      OpenAPI.TOKEN = token;
    }
  }, []);

  // Login function
  const login = (token: string, userId: string, username: string, role: string) => {
    // Save to state
    setAuth({
      token,
      isAuthenticated: true,
      userId,
      username,
      role,
    });

    // Save to localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("username", username);
    localStorage.setItem("role", role);

    // Configure OpenAPI with the new token
    OpenAPI.TOKEN = token;
  };

  // Logout function
  const logout = () => {
    // Clear state
    setAuth({
      token: null,
      isAuthenticated: false,
      userId: null,
      username: null,
      role: null,
    });

    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("refreshToken");

    // Reset OpenAPI token
    OpenAPI.TOKEN = undefined;
  };

  // Token refresh function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      
      if (!refreshTokenValue) {
        return false;
      }

      // This will be implemented once the API client is generated
      // const response = await AuthService.refresh({ refreshToken: refreshTokenValue });
      
      // For now, just a placeholder
      const response = { 
        success: true, 
        data: { 
          tokens: { 
            access_token: "new_token", 
            refresh_token: "new_refresh_token" 
          } 
        } 
      };

      if (response.success) {
        // Update token in state and localStorage
        const newToken = response.data.tokens.access_token;
        const newRefreshToken = response.data.tokens.refresh_token;
        
        setAuth(prev => ({
          ...prev,
          token: newToken,
        }));
        
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        
        // Update OpenAPI configuration
        OpenAPI.TOKEN = newToken;
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      logout();
      return false;
    }
  };

  // Configure the OpenAPI base URL
  useEffect(() => {
    OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
  }, []);

  return (
    <ApiContext.Provider value={{ auth, login, logout, refreshToken }}>
      {children}
    </ApiContext.Provider>
  );
};

// Custom hook to use the API context
export const useApi = () => useContext(ApiContext);

// Export OpenAPI for direct usage
export { OpenAPI } from "./api"; // This will be generated 