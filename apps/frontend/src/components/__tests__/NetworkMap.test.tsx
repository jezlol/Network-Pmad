
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import NetworkMap from '../NetworkMap';
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
  }
];

describe('NetworkMap', () => {
  const mockOnDeviceClick = vi.fn();

  beforeEach(() => {
    mockOnDeviceClick.mockClear();
  });

  test('renders empty state when no devices', () => {
    render(<NetworkMap devices={[]} />);
    
    expect(screen.getByText('No devices found')).toBeInTheDocument();
    expect(screen.getByText('Start by discovering devices on your network')).toBeInTheDocument();
  });

  test('renders network map with devices', () => {
    render(<NetworkMap devices={mockDevices} />);
    
    // Check for device labels
    expect(screen.getByText('router-1')).toBeInTheDocument();
    expect(screen.getByText('server-1')).toBeInTheDocument();
    
    // Check for legend
    expect(screen.getByText('Device Status')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  test('calls onDeviceClick when device is clicked', () => {
    render(<NetworkMap devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);
    
    // Find and click on a device circle (using SVG elements)
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    const deviceCircles = svg?.querySelectorAll('circle');
    expect(deviceCircles).toBeDefined();
    
    // Click on the first device circle (should be the router)
    if (deviceCircles && deviceCircles.length > 0) {
      fireEvent.click(deviceCircles[0]);
      expect(mockOnDeviceClick).toHaveBeenCalledWith(mockDevices[0]);
    }
  });

  test('shows selected device with selection ring', () => {
    render(
      <NetworkMap 
        devices={mockDevices} 
        onDeviceClick={mockOnDeviceClick}
        selectedDeviceId="1"
      />
    );
    
    // The selected device should have a selection ring
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    const selectionRings = svg?.querySelectorAll('circle[stroke="#3B82F6"]');
    expect(selectionRings).toBeDefined();
    expect(selectionRings?.length).toBeGreaterThan(0);
  });

  test('displays device icons based on device type', () => {
    render(<NetworkMap devices={mockDevices} />);
    
    // Check that device icons are rendered in SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    const textElements = svg?.querySelectorAll('text');
    expect(textElements).toBeDefined();
    
    // Should have text elements for device icons and labels
    expect(textElements?.length).toBeGreaterThan(0);
  });

  test('renders with proper SVG structure', () => {
    render(<NetworkMap devices={mockDevices} />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 800 400');
  });

  test('handles undefined onDeviceClick gracefully', () => {
    render(<NetworkMap devices={mockDevices} />);
    
    // Should not throw error when clicking without onDeviceClick handler
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    const deviceCircles = svg?.querySelectorAll('circle');
    expect(deviceCircles).toBeDefined();
    
    if (deviceCircles && deviceCircles.length > 0) {
      expect(() => fireEvent.click(deviceCircles[0])).not.toThrow();
    }
  });
}); 