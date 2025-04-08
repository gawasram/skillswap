import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Base URL configuration
// Use localhost for iOS simulator, 10.0.2.2 for Android emulator
const DEV_BASE_URL = Platform.OS === 'ios' 
  ? 'http://localhost:5000/api' 
  : 'http://10.0.2.2:5000/api';

// Use your production API URL in production
const PROD_BASE_URL = 'https://api.skillswap.com/api';

// Select the appropriate URL based on environment
const baseURL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get the refresh token
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          throw new Error('No refresh token available');
        }
        
        // Call the refresh endpoint
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });
        
        // Store the new token
        const { token } = response.data;
        await SecureStore.setItemAsync('token', token);
        
        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Retry the original request
        return axios(originalRequest);
      } catch (error) {
        // Refresh failed, clear tokens
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('refreshToken');
        
        // You might dispatch a logout action or navigate to login screen here
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 