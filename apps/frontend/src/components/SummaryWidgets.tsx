import React from 'react';
import { Device, DeviceStatus } from 'packages/shared-types';

interface SummaryWidgetsProps {
  devices: Device[];
  loading?: boolean;
  error?: string | null;
}

interface WidgetData {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  activeAlerts: number;
  criticalAlerts: number;
  networkTraffic: string;
}

const SummaryWidgets: React.FC<SummaryWidgetsProps> = ({ 
  devices, 
  loading = false, 
  error = null 
}) => {
  const calculateWidgetData = (): WidgetData => {
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === DeviceStatus.ONLINE).length;
    const offlineDevices = devices.filter(d => d.status === DeviceStatus.OFFLINE).length;
    
    // TODO: These will be replaced with real data from API
    const activeAlerts = 0; // Placeholder
    const criticalAlerts = 0; // Placeholder
    const networkTraffic = '--'; // Placeholder for last hour average
    
    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      activeAlerts,
      criticalAlerts,
      networkTraffic
    };
  };

  const widgetData = calculateWidgetData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-3 bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Data</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Devices Widget */}
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Devices</h3>
            <p className="text-3xl font-bold text-primary-600">{widgetData.totalDevices}</p>
            <p className="text-sm text-gray-500 mt-1">
              Online: {widgetData.onlineDevices} | Offline: {widgetData.offlineDevices}
            </p>
          </div>
          <div className="text-4xl text-primary-400">🖥️</div>
        </div>
      </div>

      {/* Active Alerts Widget */}
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Alerts</h3>
            <p className="text-3xl font-bold text-red-600">{widgetData.activeAlerts}</p>
            <p className="text-sm text-gray-500 mt-1">
              Critical: {widgetData.criticalAlerts} | Warning: {widgetData.activeAlerts - widgetData.criticalAlerts}
            </p>
          </div>
          <div className="text-4xl text-red-400">🚨</div>
        </div>
      </div>

      {/* Network Traffic Widget */}
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Network Traffic</h3>
            <p className="text-3xl font-bold text-green-600">{widgetData.networkTraffic}</p>
            <p className="text-sm text-gray-500 mt-1">Last hour average</p>
          </div>
          <div className="text-4xl text-green-400">📊</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryWidgets; 