import { getDevices, healthCheck, NetworkMonitoringAPIError } from '../api';
import api from '../api';
import { Device } from 'packages/shared-types';
import { vi } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}));

const mockApi = api as any;

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDevices', () => {
    it('should fetch devices successfully', async () => {
      const mockDevices: Device[] = [
        {
          id: '1',
          ip_address: '192.168.1.1',
          hostname: 'router.local',
          mac_address: '00:11:22:33:44:55',
          status: 'online',
          first_discovered: '2025-01-19T10:00:00Z',
          last_seen: '2025-01-19T10:00:00Z',
          created_at: '2025-01-19T10:00:00Z',
          updated_at: '2025-01-19T10:00:00Z',
          is_monitored: true,
        }
      ];

      mockApi.get.mockResolvedValueOnce({ data: mockDevices });

      const result = await getDevices();

      expect(mockApi.get).toHaveBeenCalledWith('/devices');
      expect(result).toEqual(mockDevices);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to fetch devices';
      mockApi.get.mockRejectedValueOnce(new Error(errorMessage));

      await expect(getDevices()).rejects.toThrow(errorMessage);
      expect(mockApi.get).toHaveBeenCalledWith('/devices');
    });

    it('should handle network errors', async () => {
      const networkError = {
        code: 'ECONNABORTED',
        message: 'Request timeout'
      };
      mockApi.get.mockRejectedValueOnce(networkError);

      await expect(getDevices()).rejects.toThrow();
      expect(mockApi.get).toHaveBeenCalledWith('/devices');
    });
  });

  describe('healthCheck', () => {
    it('should perform health check successfully', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        timestamp: '2025-01-19T10:00:00Z',
        version: '1.0.0',
        environment: 'development'
      };

      mockApi.get.mockResolvedValueOnce({ data: mockHealthResponse });

      const result = await healthCheck();

      expect(mockApi.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockHealthResponse);
    });

    it('should handle health check errors', async () => {
      const errorMessage = 'Health check failed';
      mockApi.get.mockRejectedValueOnce(new Error(errorMessage));

      await expect(healthCheck()).rejects.toThrow(errorMessage);
      expect(mockApi.get).toHaveBeenCalledWith('/health');
    });
  });

  describe('NetworkMonitoringAPIError', () => {
    it('should create error with correct properties', () => {
      const errorData = {
        message: 'Test error',
        type: 'TestError',
        status_code: 500,
        details: { field: 'test' }
      };

      const error = new NetworkMonitoringAPIError(errorData);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe('TestError');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('NetworkMonitoringAPIError');
    });
  });
}); 