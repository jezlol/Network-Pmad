import { renderHook, act } from '@testing-library/react';
import { useDeviceStore } from '../useDeviceStore';
import { getDevices } from '../../services/api';
import { Device } from 'packages/shared-types';
import { vi } from 'vitest';

// Mock the API service
vi.mock('../../services/api');
const mockGetDevices = getDevices as any;

describe('useDeviceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state to initial values
    useDeviceStore.setState({
      devices: [],
      loading: false,
      error: null,
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDeviceStore());

    expect(result.current.devices).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.fetchDevices).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

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

    mockGetDevices.mockResolvedValueOnce(mockDevices);

    const { result } = renderHook(() => useDeviceStore());

    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(mockGetDevices).toHaveBeenCalledTimes(1);
    expect(result.current.devices).toEqual(mockDevices);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state during fetch', async () => {
    mockGetDevices.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { result } = renderHook(() => useDeviceStore());

    act(() => {
      result.current.fetchDevices();
    });

    // Check loading state immediately after calling fetchDevices
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch devices';
    mockGetDevices.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useDeviceStore());

    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(mockGetDevices).toHaveBeenCalledTimes(1);
    expect(result.current.devices).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should clear error when clearError is called', async () => {
    const errorMessage = 'Failed to fetch devices';
    mockGetDevices.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useDeviceStore());

    // First, trigger an error
    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(result.current.error).toBe(errorMessage);

    // Then clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle multiple fetch calls', async () => {
    const mockDevices1: Device[] = [
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

    const mockDevices2: Device[] = [
      {
        id: '2',
        ip_address: '192.168.1.2',
        hostname: 'server.local',
        mac_address: '00:11:22:33:44:66',
        status: 'offline',
        first_discovered: '2025-01-19T10:00:00Z',
        last_seen: '2025-01-19T10:00:00Z',
        created_at: '2025-01-19T10:00:00Z',
        updated_at: '2025-01-19T10:00:00Z',
        is_monitored: true,
      }
    ];

    mockGetDevices
      .mockResolvedValueOnce(mockDevices1)
      .mockResolvedValueOnce(mockDevices2);

    const { result } = renderHook(() => useDeviceStore());

    // First fetch
    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(result.current.devices).toEqual(mockDevices1);

    // Second fetch
    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(result.current.devices).toEqual(mockDevices2);
    expect(mockGetDevices).toHaveBeenCalledTimes(2);
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Request timeout - please check your connection and try again.') as Error & { code?: string };
    networkError.code = 'ECONNABORTED';
    mockGetDevices.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useDeviceStore());

    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(result.current.error).toBe('Request timeout - please check your connection and try again.');
    expect(result.current.loading).toBe(false);
    expect(result.current.devices).toEqual([]);
  });
}); 