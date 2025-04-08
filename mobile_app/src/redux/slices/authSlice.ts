import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import api from '../../services/api';
import { LoginResponse, RegisterRequest, LoginRequest, User } from '../../types/auth';

// Define the initial state
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Create async thunks for authentication actions
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      // Store tokens securely
      await SecureStore.setItemAsync('token', response.data.token);
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      
      // Remove tokens from secure storage
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('refreshToken');
      
      return null;
    } catch (error: any) {
      // Even if the API call fails, we want to clear the local state
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('refreshToken');
      
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      const refreshToken = auth.refreshToken || await SecureStore.getItemAsync('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post<{ token: string }>('/auth/refresh', { refreshToken });
      
      // Store the new token
      await SecureStore.setItemAsync('token', response.data.token);
      
      return { token: response.data.token };
    } catch (error: any) {
      // Clear tokens on refresh failure
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('refreshToken');
      
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      // Load token from secure storage if not in state
      let { auth } = getState() as { auth: AuthState };
      let token = auth.token;
      
      if (!token) {
        token = await SecureStore.getItemAsync('token');
        if (!token) {
          throw new Error('No authentication token');
        }
      }
      
      const response = await api.get('/users/me');
      return response.data;
    } catch (error: any) {
      // Try to refresh the token if unauthorized
      if (error.response?.status === 401) {
        try {
          await dispatch(refreshAuthToken()).unwrap();
          // Retry the request with the new token
          const response = await api.get('/users/me');
          return response.data;
        } catch (refreshError) {
          return rejectWithValue('Session expired. Please log in again.');
        }
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to load user data');
    }
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login actions
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      
      // Register actions
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        // Don't authenticate yet, user needs to log in
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Logout actions
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      
      // Token refresh actions
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      
      // Load user actions
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 