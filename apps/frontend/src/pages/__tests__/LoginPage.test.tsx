import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from '../LoginPage';
import { useAuthStore } from '../../store/useAuthStore';

// Mock the auth store
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
  useIsLoading: vi.fn(),
  useAuthError: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      login: mockLogin,
      clearError: mockClearError,
    });
    (vi.mocked(useAuthStore) as any).useIsLoading = vi.fn(() => false);
    (vi.mocked(useAuthStore) as any).useAuthError = vi.fn(() => null);
  });

  it('renders login form', () => {
    renderLoginPage();
    
    expect(screen.getByText('Network Monitoring System')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows demo credentials', () => {
    renderLoginPage();
    
    expect(screen.getByText('Demo Credentials')).toBeInTheDocument();
    expect(screen.getByText('Admin: admin / admin123')).toBeInTheDocument();
    expect(screen.getByText('Viewer: viewer / viewer123')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderLoginPage();
    
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
    
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits form with valid credentials', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      });
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows loading state during login', () => {
    (vi.mocked(useAuthStore) as any).useIsLoading = vi.fn(() => true);
    renderLoginPage();
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Signing in/ })).toBeDisabled();
  });

  it('shows error message when login fails', () => {
    const errorMessage = 'Invalid username or password';
    (vi.mocked(useAuthStore) as any).useAuthError = vi.fn(() => errorMessage);
    renderLoginPage();
    
    expect(screen.getByText('Login failed')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('clears error when input changes', async () => {
    const errorMessage = 'Invalid username or password';
    (vi.mocked(useAuthStore) as any).useAuthError = vi.fn(() => errorMessage);
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  it('handles login error', async () => {
    const error = new Error('Login failed');
    mockLogin.mockRejectedValue(error);
    renderLoginPage();
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'wrongpassword',
      });
    });
  });
}); 