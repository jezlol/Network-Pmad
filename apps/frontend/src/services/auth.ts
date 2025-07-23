import axios from 'axios';

// Types for authentication
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export interface User {
  id: string;
  username: string;
  role: string;
}

// API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance for auth requests
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token validation utilities
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true; // Consider invalid tokens as expired
  }
};

const getValidToken = (): string | null => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    // Clear expired token
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    return null;
  }
  
  return token;
};

// Add request interceptor to include auth token
authApi.interceptors.request.use(
  (config) => {
    const token = getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication service functions
export const authService = {
  /**
   * Login user with username and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Validate input
      if (!credentials.username?.trim()) {
        throw new Error('Username is required');
      }
      if (!credentials.password) {
        throw new Error('Password is required');
      }
      
      const response = await authApi.post<LoginResponse>('/api/auth/login', credentials);
      
      // Store token and user info
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid username or password');
        }
        if (error.response?.status === 422) {
          // Validation error
          const details = error.response.data?.detail;
          if (Array.isArray(details)) {
            const messages = details.map((d: any) => d.msg).join(', ');
            throw new Error(messages);
          }
        }
        throw new Error(error.response?.data?.detail || 'Login failed');
      }
      throw error;
    }
  },

  /**
   * Logout user and clear stored data
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/login';
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      // Clear invalid user data
      localStorage.removeItem('user');
      return null;
    }
  },

  /**
   * Get auth token from localStorage
   */
  getToken(): string | null {
    return getValidToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!token && !!user;
  },

  /**
   * Check if user has administrator role
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'administrator';
  },

  /**
   * Check if user has viewer role
   */
  isViewer(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'viewer';
  },

  /**
   * Get current user info from API
   */
  async getCurrentUserInfo(): Promise<User> {
    try {
      const response = await authApi.get<User>('/api/auth/me');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to get user info');
      }
      throw new Error('Failed to get user info');
    }
  },

  /**
   * Create a new user (admin only)
   */
  async createUser(userData: { username: string; password: string; role: string }): Promise<User> {
    try {
      // Validate input
      if (!userData.username?.trim()) {
        throw new Error('Username is required');
      }
      if (!userData.password || userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      const response = await authApi.post<User>('/api/auth/users', userData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422) {
          const details = error.response.data?.detail;
          if (Array.isArray(details)) {
            const messages = details.map((d: any) => d.msg).join(', ');
            throw new Error(messages);
          }
        }
        throw new Error(error.response?.data?.detail || 'Failed to create user');
      }
      throw error;
    }
  },

  /**
   * Get all users (admin only)
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await authApi.get<User[]>('/api/auth/users');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to get users');
      }
      throw new Error('Failed to get users');
    }
  },

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('authService.deleteUser called with userId:', userId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const url = `/api/auth/users/${userId}`;
      console.log('Making DELETE request to:', url);
      
      const response = await authApi.delete(url);
      console.log('Delete response:', response.status, response.data);
    } catch (error) {
      console.error('Delete error in authService:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        throw new Error(error.response?.data?.detail || 'Failed to delete user');
      }
      throw error;
    }
  },

  /**
   * Change user password (admin only)
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      await authApi.put(`/api/auth/users/${userId}/password`, {
        new_password: newPassword
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to change password');
      }
      throw error;
    }
  }
};