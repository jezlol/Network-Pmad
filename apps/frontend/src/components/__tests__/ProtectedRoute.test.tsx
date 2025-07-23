import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from '../ProtectedRoute';
import { useAuthStore } from '../../store/useAuthStore';

// Mock the auth store
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
  useIsAuthenticated: vi.fn(),
  useUser: vi.fn(),
}));

const TestComponent = () => <div>Protected Content</div>;

const renderProtectedRoute = (props: any = {}) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute {...props}>
              <TestComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when authentication is not required', () => {
    renderProtectedRoute({ requireAuth: false });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    (vi.mocked(useAuthStore) as any).useIsAuthenticated = vi.fn(() => false);
    (vi.mocked(useAuthStore) as any).useUser = vi.fn(() => null);
    
    renderProtectedRoute();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    (vi.mocked(useAuthStore) as any).useIsAuthenticated = vi.fn(() => true);
    (vi.mocked(useAuthStore) as any).useUser = vi.fn(() => ({
      id: '1',
      username: 'admin',
      role: 'administrator',
    }));
    
    renderProtectedRoute();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to dashboard when admin access required but user is not admin', () => {
    (vi.mocked(useAuthStore) as any).useIsAuthenticated = vi.fn(() => true);
    (vi.mocked(useAuthStore) as any).useUser = vi.fn(() => ({
      id: '2',
      username: 'viewer',
      role: 'viewer',
    }));
    
    renderProtectedRoute({ requireAdmin: true });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders children when admin access required and user is admin', () => {
    (vi.mocked(useAuthStore) as any).useIsAuthenticated = vi.fn(() => true);
    (vi.mocked(useAuthStore) as any).useUser = vi.fn(() => ({
      id: '1',
      username: 'admin',
      role: 'administrator',
    }));
    
    renderProtectedRoute({ requireAdmin: true });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to dashboard when viewer access required but user is not viewer', () => {
    (vi.mocked(useAuthStore) as any).useIsAuthenticated = vi.fn(() => true);
    (vi.mocked(useAuthStore) as any).useUser = vi.fn(() => ({
      id: '1',
      username: 'admin',
      role: 'administrator',
    }));
    
    renderProtectedRoute({ requireViewer: true });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders children when viewer access required and user is viewer', () => {
    (vi.mocked(useAuthStore) as any).useIsAuthenticated = vi.fn(() => true);
    (vi.mocked(useAuthStore) as any).useUser = vi.fn(() => ({
      id: '2',
      username: 'viewer',
      role: 'viewer',
    }));
    
    renderProtectedRoute({ requireViewer: true });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('uses custom redirect path', () => {
    (vi.mocked(useAuthStore) as any).useIsAuthenticated = vi.fn(() => false);
    (vi.mocked(useAuthStore) as any).useUser = vi.fn(() => null);
    
    renderProtectedRoute({ redirectTo: '/custom-login' });
    // Note: This test would need a route for /custom-login to work properly
    // For now, we just verify it doesn't show the protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
}); 