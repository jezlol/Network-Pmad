import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import { authService } from '../../services/auth';

// Mock the auth service
vi.mock('../../services/auth', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
  });

  describe('initial state', () => {
    it('initializes with user from localStorage', () => {
      const mockUser = { id: '1', username: 'admin', role: 'administrator' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', 'test-token');
      
      (vi.mocked(authService.getCurrentUser) as any).mockReturnValue(mockUser);
      (vi.mocked(authService.isAuthenticated) as any).mockReturnValue(true);
      
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('initializes with no user when not authenticated', () => {
      (vi.mocked(authService.getCurrentUser) as any).mockReturnValue(null);
      (vi.mocked(authService.isAuthenticated) as any).mockReturnValue(false);
      
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockCredentials = { username: 'admin', password: 'admin123' };
      const mockResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: { id: '1', username: 'admin', role: 'administrator' },
      };
      
      (vi.mocked(authService.login) as any).mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.login(mockCredentials);
      });
      
      expect(authService.login).toHaveBeenCalledWith(mockCredentials);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles login error', async () => {
      const mockCredentials = { username: 'admin', password: 'wrongpassword' };
      const mockError = new Error('Invalid credentials');
      
      (vi.mocked(authService.login) as any).mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        try {
          await result.current.login(mockCredentials);
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(authService.login).toHaveBeenCalledWith(mockCredentials);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('sets loading state during login', async () => {
      const mockCredentials = { username: 'admin', password: 'admin123' };
      
      // Create a promise that doesn't resolve immediately
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      
      (vi.mocked(authService.login) as any).mockReturnValue(loginPromise);
      
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.login(mockCredentials);
      });
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      
      // Resolve the promise
      resolveLogin!({
        access_token: 'test-token',
        token_type: 'bearer',
        user: { id: '1', username: 'admin', role: 'administrator' },
      });
      
      await act(async () => {
        await loginPromise;
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('successfully logs out user', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.logout();
      });
      
      expect(authService.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('updates authentication status', () => {
      const mockUser = { id: '1', username: 'admin', role: 'administrator' };
      
      (vi.mocked(authService.getCurrentUser) as any).mockReturnValue(mockUser);
      (vi.mocked(authService.isAuthenticated) as any).mockReturnValue(true);
      
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.checkAuth();
      });
      
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      // Set an error first by triggering a failed login
      act(() => {
        result.current.setUser(null);
      });
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });

    it('clears error when called multiple times', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
      
      // Call again to ensure it doesn't cause issues
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('sets user and updates authentication status', () => {
      const mockUser = { id: '1', username: 'admin', role: 'administrator' };
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setUser(mockUser);
      });
      
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('clears user and sets authenticated to false when user is null', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setUser(null);
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
}); 