
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import DashboardPage from '../DashboardPage';
import { useDeviceStore } from '../../store/useDeviceStore';
import { Device, DeviceStatus } from 'packages/shared-types';

// Mock the device store
vi.mock('../../store/useDeviceStore');

const mockUseDeviceStore = useDeviceStore as jest.MockedFunction<typeof useDeviceStore>;

const mockDevices: Device[] = [
  {
    id: '1',
    ip_address: '192.168.1.1',
    hostname: 'router-1',
    mac_address: '00:11:22:33:44:55',
    device_type: 'router',
    status: DeviceStatus.ONLINE,
    first_discovered: '2024-01-01T00:00:00Z',
    last_seen: '2024-01-01T12:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    is_monitored: true
  },
  {
    id: '2',
    ip_address: '192.168.1.2',
    hostname: 'server-1',
    mac_address: '00:11:22:33:44:66',
    device_type: 'server',
    status: DeviceStatus.OFFLINE,
    first_discovered: '2024-01-01T00:00:00Z',
    last_seen: '2024-01-01T10:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    is_monitored: true
  }
];

describe('DashboardPage', () => {
  const mockFetchDevices = vi.fn();

  beforeEach(() => {
    mockUseDeviceStore.mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn()
    });
    mockFetchDevices.mockClear();
  });

  const renderDashboardPage = () => {
    return render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
  };

  test('renders dashboard title and description', () => {
    renderDashboardPage();
    
    expect(screen.getByText('Network Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Monitor your network health and device status at a glance/)).toBeInTheDocument();
  });

  test('renders summary widgets section', () => {
    renderDashboardPage();
    
    expect(screen.getByText('Total Devices')).toBeInTheDocument();
    expect(screen.getByText('Active Alerts')).toBeInTheDocument();
    expect(screen.getByText('Network Traffic')).toBeInTheDocument();
  });

  test('renders network map section', () => {
    renderDashboardPage();
    
    expect(screen.getByText('Network Map')).toBeInTheDocument();
    expect(screen.getByText(/Visual representation of your network devices/)).toBeInTheDocument();
  });

  test('fetches devices on component mount', () => {
    renderDashboardPage();
    
    expect(mockFetchDevices).toHaveBeenCalledTimes(1);
  });

  test('displays device statistics correctly', () => {
    renderDashboardPage();
    
    // Should show total devices count
    expect(screen.getByText('2')).toBeInTheDocument(); // Total devices
    expect(screen.getByText('Online: 1 | Offline: 1')).toBeInTheDocument();
  });

  test('renders with proper layout structure', () => {
    renderDashboardPage();
    
    // Check for main container
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    
    // Check for grid layout classes
    const summarySection = mainElement.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
    expect(summarySection).toBeInTheDocument();
  });

  test('shows loading state when fetching devices', () => {
    mockUseDeviceStore.mockReturnValue({
      devices: [],
      loading: true,
      error: null,
      fetchDevices: mockFetchDevices,
      clearError: vi.fn()
    });

    renderDashboardPage();
    
    expect(screen.getByText('Loading devices...')).toBeInTheDocument();
  });

  test('shows error state when fetch fails', () => {
    mockUseDeviceStore.mockReturnValue({
      devices: [],
      loading: false,
      error: 'Failed to fetch devices',
      fetchDevices: mockFetchDevices,
      clearError: vi.fn()
    });

    renderDashboardPage();
    
    expect(screen.getByText('Error loading devices')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch devices')).toBeInTheDocument();
  });

  test('renders network map with devices', () => {
    renderDashboardPage();
    
    // Check that network map is rendered with devices
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Check for device labels
    expect(screen.getByText('router-1')).toBeInTheDocument();
    expect(screen.getByText('server-1')).toBeInTheDocument();
  });

  test('handles device click to open detail panel', async () => {
    renderDashboardPage();
    
    // Find and click on a device in the network map
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    const deviceCircles = svg?.querySelectorAll('circle');
    expect(deviceCircles).toBeDefined();
    
    if (deviceCircles && deviceCircles.length > 0) {
      fireEvent.click(deviceCircles[0]);
      
      // Wait for the detail panel to appear
      await waitFor(() => {
        expect(screen.getByText('Device Details')).toBeInTheDocument();
      });
    }
  });
}); 