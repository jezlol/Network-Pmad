import React from 'react';
import { Device, DeviceStatus } from 'packages/shared-types';

interface DeviceDetailPanelProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

const DeviceDetailPanel: React.FC<DeviceDetailPanelProps> = ({ 
  device, 
  isOpen, 
  onClose 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case DeviceStatus.ONLINE:
        return 'text-green-600 bg-green-100';
      case DeviceStatus.OFFLINE:
        return 'text-red-600 bg-red-100';
      case DeviceStatus.WARNING:
        return 'text-amber-600 bg-amber-100';
      case DeviceStatus.CRITICAL:
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!device) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Side Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Device Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-full">
          {/* Device Header */}
          <div className="flex items-center mb-6">
            <div className="text-4xl mr-4">
              {getDeviceIcon(device.device_type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {device.hostname || 'Unknown Device'}
              </h3>
              <p className="text-sm text-gray-500">{device.ip_address}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <span className={`
              inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${getStatusColor(device.status)}
            `}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                device.status === DeviceStatus.ONLINE ? 'bg-green-500' :
                device.status === DeviceStatus.OFFLINE ? 'bg-red-500' :
                device.status === DeviceStatus.WARNING ? 'bg-amber-500' :
                'bg-gray-500'
              }`}></span>
              {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
            </span>
          </div>

          {/* Device Information */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Device Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Device Type:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {device.device_type || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">MAC Address:</span>
                  <span className="text-sm font-medium text-gray-900 font-mono">
                    {device.mac_address || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monitored:</span>
                  <span className={`text-sm font-medium ${
                    device.is_monitored ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {device.is_monitored ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Timestamps
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">First Discovered:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(device.first_discovered)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Seen:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(device.last_seen)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(device.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Updated:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(device.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Response Time (if available) */}
            {device.last_response_time && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Performance
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Response Time:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {device.last_response_time}ms
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes (if available) */}
            {device.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Notes
                </h4>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {device.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors">
                View Metrics
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
                Edit Device
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeviceDetailPanel; 