import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser, useAuthStore } from '../store/useAuthStore';

const Header: React.FC = () => {
  const location = useLocation();
  const user = useUser();
  const { logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="bg-primary-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold hover:text-primary-200">
              Network Monitoring App
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-4">
              <Link 
                to="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/dashboard') 
                    ? 'bg-primary-700 text-white' 
                    : 'hover:text-primary-200'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/inventory" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/inventory') 
                    ? 'bg-primary-700 text-white' 
                    : 'hover:text-primary-200'
                }`}
              >
                Inventory
              </Link>
              {user?.role === 'administrator' && (
                <Link 
                  to="/users" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/users') 
                      ? 'bg-primary-700 text-white' 
                      : 'hover:text-primary-200'
                  }`}
                >
                  Users
                </Link>
              )}
              <a 
                href="#alerts" 
                className="hover:text-primary-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Alerts
              </a>
            </nav>

            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 text-sm font-medium hover:text-primary-200 focus:outline-none"
                >
                  <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block">{user.username}</span>
                  <span className="hidden md:block text-xs bg-primary-700 px-2 py-1 rounded">
                    {user.role}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-gray-500 capitalize">{user.role}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link 
            to="/dashboard" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/dashboard') 
                ? 'bg-primary-700 text-white' 
                : 'hover:text-primary-200'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            to="/inventory" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/inventory') 
                ? 'bg-primary-700 text-white' 
                : 'hover:text-primary-200'
            }`}
          >
            Inventory
          </Link>
          {user?.role === 'administrator' && (
            <Link 
              to="/users" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/users') 
                  ? 'bg-primary-700 text-white' 
                  : 'hover:text-primary-200'
              }`}
            >
              Users
            </Link>
          )}
          <a 
            href="#alerts" 
            className="hover:text-primary-200 block px-3 py-2 rounded-md text-base font-medium"
          >
            Alerts
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;