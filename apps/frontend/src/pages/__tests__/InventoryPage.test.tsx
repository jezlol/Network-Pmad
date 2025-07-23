import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import InventoryPage from '../InventoryPage';
import { useDeviceStore } from '../../store/useDeviceStore';
import { Device } from 'packages/shared-types';

// Mock the device store
vi.mock('../../store/useDeviceStore');

const mockUseDeviceStore = useDeviceStore as any;

// Mock data
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
  },
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
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockUseDeviceStore.mockReturnValue({
      devices: [],
      loading: true,
      error: null,
      fetchDevices: vi.fn(),
      clearError: vi.fn(),
    });

    renderWithRouter(<InventoryPage />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders error state when API call fails', () => {
    const mockFetchDevices = vi.fn();
    const mockClearError = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: [],
      loading: false,
      error: 'Failed to fetch devices',
      fetchDevices: mockFetchDevices,
      clearError: mockClearError,
    });

    renderWithRouter(<InventoryPage />);
    
    expect(screen.getByText('Error Loading Inventory')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch devices')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls fetchDevices on mount', () => {
    const mockFetchDevices = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: [],
      loading: false,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn(),
    });

    renderWithRouter(<InventoryPage />);
    
    expect(mockFetchDevices).toHaveBeenCalledTimes(1);
  });

  it('displays devices in table when loaded', () => {
    const mockFetchDevices = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn(),
    });

    renderWithRouter(<InventoryPage />);
    
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('router.local')).toBeInTheDocument();
    expect(screen.getByText('00:11:22:33:44:55')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
    
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    expect(screen.getByText('server.local')).toBeInTheDocument();
    expect(screen.getByText('00:11:22:33:44:66')).toBeInTheDocument();
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('displays device count correctly', () => {
    const mockFetchDevices = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn(),
    });

    renderWithRouter(<InventoryPage />);
    
    expect(screen.getByText('2 of 2 devices')).toBeInTheDocument();
  });

  it('filters devices by search term', () => {
    const mockFetchDevices = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn(),
    });

    renderWithRouter(<InventoryPage />);
    
    const searchInput = screen.getByPlaceholderText('Search by IP, hostname, or MAC address...');
    
    // Search by IP
    fireEvent.change(searchInput, { target: { value: '192.168.1.1' } });
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.queryByText('192.168.1.2')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 devices')).toBeInTheDocument();
    
    // Search by hostname
    fireEvent.change(searchInput, { target: { value: 'router' } });
    expect(screen.getByText('router.local')).toBeInTheDocument();
    expect(screen.queryByText('server.local')).not.toBeInTheDocument();
    
    // Search by MAC address
    fireEvent.change(searchInput, { target: { value: '44:66' } });
    expect(screen.getByText('00:11:22:33:44:66')).toBeInTheDocument();
    expect(screen.queryByText('00:11:22:33:44:55')).not.toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    const mockFetchDevices = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn(),
    });

    renderWithRouter(<InventoryPage />);
    
    const searchInput = screen.getByPlaceholderText('Search by IP, hostname, or MAC address...');
    
    // Add search term
    fireEvent.change(searchInput, { target: { value: 'router' } });
    expect(searchInput).toHaveValue('router');
    
    // Clear search
    const clearButton = screen.getByText('✕');
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
    expect(screen.getByText('2 of 2 devices')).toBeInTheDocument();
  });

  it('shows no results message when search has no matches', () => {
    const mockFetchDevices = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn(),
    });

    renderWithRouter(<InventoryPage />);
    
    const searchInput = screen.getByPlaceholderText('Search by IP, hostname, or MAC address...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No devices found matching your search.')).toBeInTheDocument();
  });

  it('shows no devices message when no devices are discovered', () => {
    const mockFetchDevices = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: [],
      loading: false,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn(),
    });

    renderWithRouter(<InventoryPage />);
    
    expect(screen.getByText('No devices discovered yet.')).toBeInTheDocument();
  });

  it('handles retry button click', () => {
    const mockFetchDevices = vi.fn();
    const mockClearError = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: [],
      loading: false,
      error: 'Failed to fetch devices',
      fetchDevices: mockFetchDevices,
      clearError: mockClearError,
    });

    renderWithRouter(<InventoryPage />);
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(mockClearError).toHaveBeenCalled();
    expect(mockFetchDevices).toHaveBeenCalled();
  });

  it('displays unknown for missing hostname and MAC address', () => {
    const devicesWithMissingData: Device[] = [
      {
        id: '1',
        ip_address: '192.168.1.1',
        hostname: undefined,
        mac_address: undefined,
        status: 'online',
        first_discovered: '2025-01-19T10:00:00Z',
        last_seen: '2025-01-19T10:00:00Z',
        created_at: '2025-01-19T10:00:00Z',
        updated_at: '2025-01-19T10:00:00Z',
        is_monitored: true,
      },
    ];

    const mockFetchDevices = vi.fn();
    
    mockUseDeviceStore.mockReturnValue({
      devices: devicesWithMissingData,
      loading: false,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn(),
    });

    renderWithRouter(<InventoryPage />);
    
    const unknownElements = screen.getAllByText('Unknown');
    expect(unknownElements).toHaveLength(2);
  });
}); 