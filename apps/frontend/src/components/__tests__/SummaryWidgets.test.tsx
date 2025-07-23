
import { render, screen } from '@testing-library/react';
import SummaryWidgets from '../SummaryWidgets';
import { Device, DeviceStatus } from 'packages/shared-types';

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
  },
  {
    id: '3',
    ip_address: '192.168.1.3',
    hostname: 'workstation-1',
    mac_address: '00:11:22:33:44:77',
    device_type: 'workstation',
    status: DeviceStatus.ONLINE,
    first_discovered: '2024-01-01T00:00:00Z',
    last_seen: '2024-01-01T12:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    is_monitored: true
  }
];

describe('SummaryWidgets', () => {
  test('renders loading state', () => {
    render(<SummaryWidgets devices={[]} loading={true} />);
    
    // Should show loading skeleton
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBe(3); // 3 widgets
  });

  test('renders error state', () => {
    const errorMessage = 'Failed to load devices';
    render(<SummaryWidgets devices={[]} error={errorMessage} />);
    
    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('renders widgets with correct data', () => {
    render(<SummaryWidgets devices={mockDevices} />);
    
    // Check widget titles
    expect(screen.getByText('Total Devices')).toBeInTheDocument();
    expect(screen.getByText('Active Alerts')).toBeInTheDocument();
    expect(screen.getByText('Network Traffic')).toBeInTheDocument();
    
    // Check device counts
    expect(screen.getByText('3')).toBeInTheDocument(); // Total devices
    expect(screen.getByText('Online: 2 | Offline: 1')).toBeInTheDocument();
  });

  test('displays correct device statistics', () => {
    render(<SummaryWidgets devices={mockDevices} />);
    
    // Total devices should be 3
    const totalDevicesElement = screen.getByText('3');
    expect(totalDevicesElement).toBeInTheDocument();
    
    // Should show online/offline breakdown
    expect(screen.getByText('Online: 2 | Offline: 1')).toBeInTheDocument();
  });

  test('shows placeholder values for alerts and traffic', () => {
    render(<SummaryWidgets devices={mockDevices} />);
    
    // Active alerts should show 0 (placeholder)
    expect(screen.getByText('0')).toBeInTheDocument();
    
    // Network traffic should show -- (placeholder)
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  test('renders with empty devices array', () => {
    render(<SummaryWidgets devices={[]} />);
    
    expect(screen.getByText('Total Devices')).toBeInTheDocument();
    expect(screen.getByText('Online: 0 | Offline: 0')).toBeInTheDocument();
    
    // Check that total devices shows 0 (there are multiple 0s, so check the context)
    const totalDevicesWidget = screen.getByText('Total Devices').closest('div');
    expect(totalDevicesWidget).toHaveTextContent('0');
  });

  test('displays widget icons', () => {
    render(<SummaryWidgets devices={mockDevices} />);
    
    // Check for emoji icons
    expect(screen.getByText('🖥️')).toBeInTheDocument(); // Devices icon
    expect(screen.getByText('🚨')).toBeInTheDocument(); // Alerts icon
    expect(screen.getByText('📊')).toBeInTheDocument(); // Traffic icon
  });

  test('applies hover effects to widgets', () => {
    render(<SummaryWidgets devices={mockDevices} />);
    
    // Check for hover transition classes
    const widgets = document.querySelectorAll('.hover\\:shadow-lg');
    expect(widgets.length).toBe(3); // All 3 widgets should have hover effects
  });
}); 