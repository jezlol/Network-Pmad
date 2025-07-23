
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DeviceDetailPanel from '../DeviceDetailPanel';
import { Device, DeviceStatus } from 'packages/shared-types';

const mockDevice: Device = {
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
  is_monitored: true,
  last_response_time: 15,
  notes: 'Main network router'
};

describe('DeviceDetailPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  test('renders nothing when device is null', () => {
    render(
      <DeviceDetailPanel
        device={null}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.queryByText('Device Details')).not.toBeInTheDocument();
  });

  test('renders device information when open', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Device Details')).toBeInTheDocument();
    expect(screen.getByText('router-1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  test('displays device type and MAC address', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('router')).toBeInTheDocument();
    expect(screen.getByText('00:11:22:33:44:55')).toBeInTheDocument();
  });

  test('shows monitoring status', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Yes')).toBeInTheDocument(); // Monitored status
  });

  test('displays timestamps', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('First Discovered:')).toBeInTheDocument();
    expect(screen.getByText('Last Seen:')).toBeInTheDocument();
    expect(screen.getByText('Created:')).toBeInTheDocument();
    expect(screen.getByText('Updated:')).toBeInTheDocument();
  });

  test('shows response time when available', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Last Response Time:')).toBeInTheDocument();
    expect(screen.getByText('15ms')).toBeInTheDocument();
  });

  test('displays notes when available', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Main network router')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Find the close button by looking for the X icon
    const closeButton = document.querySelector('svg[stroke="currentColor"]');
    expect(closeButton).toBeInTheDocument();
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  test('calls onClose when backdrop is clicked', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  test('shows correct status colors for different statuses', () => {
    const offlineDevice = { ...mockDevice, status: DeviceStatus.OFFLINE };
    
    render(
      <DeviceDetailPanel
        device={offlineDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  test('displays device icon based on device type', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('🛰️')).toBeInTheDocument(); // Router icon
  });

  test('shows action buttons', () => {
    render(
      <DeviceDetailPanel
        device={mockDevice}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('View Metrics')).toBeInTheDocument();
    expect(screen.getByText('Edit Device')).toBeInTheDocument();
  });

  test('handles device without hostname', () => {
    const deviceWithoutHostname = { ...mockDevice, hostname: undefined };
    
    render(
      <DeviceDetailPanel
        device={deviceWithoutHostname}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Unknown Device')).toBeInTheDocument();
  });

  test('handles device without MAC address', () => {
    const deviceWithoutMac = { ...mockDevice, mac_address: undefined };
    
    render(
      <DeviceDetailPanel
        device={deviceWithoutMac}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
}); 