import React, { useMemo } from 'react';
import { Device, DeviceStatus } from 'packages/shared-types';

interface NetworkMapProps {
  devices: Device[];
  onDeviceClick?: (device: Device) => void;
  selectedDeviceId?: string;
}



const NetworkMap: React.FC<NetworkMapProps> = ({ 
  devices, 
  onDeviceClick, 
  selectedDeviceId 
}) => {
  const deviceNodes = useMemo(() => {
    if (devices.length === 0) return [];

    // Calculate positions in a circular layout
    const centerX = 400;
    const centerY = 200;
    const radius = 150;
    
    return devices.map((device, index) => {
      const angle = (index * 2 * Math.PI) / devices.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      return {
        device,
        x,
        y,
        radius: 20
      };
    });
  }, [devices]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case DeviceStatus.ONLINE:
        return '#10B981'; // green-500
      case DeviceStatus.OFFLINE:
        return '#EF4444'; // red-500
      case DeviceStatus.WARNING:
        return '#F59E0B'; // amber-500
      case DeviceStatus.CRITICAL:
        return '#DC2626'; // red-600
      default:
        return '#6B7280'; // gray-500
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'router':
        return '🛰️';
      case 'switch':
        return '🔌';
      case 'server':
        return '🖥️';
      case 'workstation':
        return '💻';
      case 'firewall':
        return '🛡️';
      case 'access_point':
        return '📶';
      default:
        return '🔧';
    }
  };

  const handleDeviceClick = (device: Device) => {
    if (onDeviceClick) {
      onDeviceClick(device);
    }
  };

  if (devices.length === 0) {
    return (
      <div className="h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🌐</div>
          <p className="text-gray-500 text-lg">No devices found</p>
          <p className="text-gray-400 text-sm">Start by discovering devices on your network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 400"
        className="absolute inset-0"
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connection lines between devices */}
        {deviceNodes.length > 1 && deviceNodes.map((node, index) => {
          const nextNode = deviceNodes[(index + 1) % deviceNodes.length];
          return (
            <line
              key={`connection-${index}`}
              x1={node.x}
              y1={node.y}
              x2={nextNode.x}
              y2={nextNode.y}
              stroke="#D1D5DB"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Device nodes */}
        {deviceNodes.map((node) => {
          const isSelected = selectedDeviceId === node.device.id;
          const statusColor = getStatusColor(node.device.status);
          const deviceIcon = getDeviceIcon(node.device.device_type);
          
          return (
            <g key={node.device.id}>
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius + 8}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
              )}
              
              {/* Device circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill="white"
                stroke={statusColor}
                strokeWidth="3"
                className="cursor-pointer hover:stroke-2 transition-all duration-200"
                onClick={() => handleDeviceClick(node.device)}
              />
              
              {/* Status indicator */}
              <circle
                cx={node.x + node.radius - 5}
                cy={node.y - node.radius + 5}
                r="4"
                fill={statusColor}
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Device icon */}
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize="12"
                className="pointer-events-none"
              >
                {deviceIcon}
              </text>
              
              {/* Device label */}
              <text
                x={node.x}
                y={node.y + node.radius + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
                className="pointer-events-none font-medium"
              >
                {node.device.hostname || node.device.ip_address}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs">
        <div className="font-semibold mb-2">Device Status</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Offline</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Warning</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkMap; 