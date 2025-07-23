import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useUser } from '../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireViewer?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireViewer = false,
  redirectTo = '/login',
}) => {
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const location = useLocation();

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If admin access is required but user is not admin
  if (requireAdmin && user?.role !== 'administrator') {
    return <Navigate to="/dashboard" replace />;
  }

  // If viewer access is required but user is not viewer
  if (requireViewer && user?.role !== 'viewer') {
    return <Navigate to="/dashboard" replace />;
  }

  // If all checks pass, render children
  return <>{children}</>;
};

export default ProtectedRoute; 