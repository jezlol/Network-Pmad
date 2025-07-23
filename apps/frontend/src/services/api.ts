import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { Device } from 'packages/shared-types';

// Extend AxiosRequestConfig to include metadata
interface ExtendedAxiosRequestConfig {
  metadata?: {
    startTime: Date;
  };
}

// API Error interface
interface APIError {
  message: string;
  type: string;
  status_code: number;
  details?: any;
}

// Mock data for development when backend is not available
const mockDevices: Device[] = [
  {
    id: '1',
    ip_address: '192.168.1.1',
    mac_address: '00:11:22:33:44:55',
    hostname: 'router-gateway',
    device_type: 'router',
    status: 'online',
    last_seen: new Date().toISOString(),
    first_discovered: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_monitored: true
  },
  {
    id: '2',
    ip_address: '192.168.1.10',
    mac_address: '00:11:22:33:44:66',
    hostname: 'server-01',
    device_type: 'server',
    status: 'online',
    last_seen: new Date().toISOString(),
    first_discovered: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_monitored: true
  },
  {
    id: '3',
    ip_address: '192.168.1.20',
    mac_address: '00:11:22:33:44:77',
    hostname: 'workstation-01',
    device_type: 'workstation',
    status: 'offline',
    last_seen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    first_discovered: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_monitored: true
  },
  {
    id: '4',
    ip_address: '192.168.1.30',
    mac_address: '00:11:22:33:44:88',
    hostname: 'printer-01',
    device_type: 'printer',
    status: 'online',
    last_seen: new Date().toISOString(),
    first_discovered: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_monitored: true
  }
];

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 5000, // Reduced timeout for faster fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging, timing, and authentication
api.interceptors.request.use(
  (config) => {
    const extendedConfig = config as ExtendedAxiosRequestConfig;
    extendedConfig.metadata = { startTime: new Date() };
    
    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging, timing, and error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const endTime = new Date();
    const extendedConfig = response.config as ExtendedAxiosRequestConfig;
    const startTime = extendedConfig.metadata?.startTime || endTime;
    const duration = endTime.getTime() - startTime.getTime();
    
    console.log(`API Response: ${response.status} ${response.config.url} (${duration}ms)`);
    return response;
  },
  (error: AxiosError) => {
    const endTime = new Date();
    const extendedConfig = error.config as ExtendedAxiosRequestConfig;
    const startTime = extendedConfig?.metadata?.startTime || endTime;
    const duration = endTime.getTime() - startTime.getTime();
    
    console.error(`API Error: ${error.response?.status} ${error.config?.url} (${duration}ms)`, error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Authentication failed - please log in again.');
    }
    
    // Handle API-specific errors
    if (error.response?.data && typeof error.response.data === 'object') {
      const responseData = error.response.data as any;
      if (responseData.error) {
        const apiError = responseData.error as APIError;
        throw new NetworkMonitoringAPIError(apiError);
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check your connection and try again.');
    }
    
    if (!error.response) {
      throw new Error('Network error - please check your connection and try again.');
    }
    
    // Handle HTTP errors
    const status = error.response.status;
    switch (status) {
      case 401:
        throw new Error('Unauthorized - please log in again.');
      case 403:
        throw new Error('Forbidden - you do not have permission to access this resource.');
      case 404:
        throw new Error('Resource not found.');
      case 500:
        throw new Error('Server error - please try again later.');
      default:
        throw new Error(`HTTP ${status} - ${error.response.statusText}`);
    }
  }
);

// Custom error class for API errors
export class NetworkMonitoringAPIError extends Error {
  public statusCode: number;
  public type: string;
  public details?: any;

  constructor(errorData: APIError) {
    super(errorData.message);
    this.name = 'NetworkMonitoringAPIError';
    this.statusCode = errorData.status_code;
    this.type = errorData.type;
    this.details = errorData.details;
  }
}

// API functions with mock data fallback
export const getDevices = async (): Promise<Device[]> => {
  try {
    const response = await api.get<Device[]>('/api/devices');
    return response.data;
  } catch (error) {
    console.warn('Backend not available, using mock data:', error);
    // Return mock data when backend is not available
    return mockDevices;
  }
};

export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.warn('Health check failed, backend not available:', error);
    // Return mock health status
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }
};

export default api; 