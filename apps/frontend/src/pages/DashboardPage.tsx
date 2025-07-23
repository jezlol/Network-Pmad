import React, { useEffect, useState } from 'react';
import { Device } from 'packages/shared-types';
import { useDeviceStore } from '../store/useDeviceStore';
import NetworkMap from '../components/NetworkMap';
import SummaryWidgets from '../components/SummaryWidgets';
import DeviceDetailPanel from '../components/DeviceDetailPanel';

const DashboardPage: React.FC = () => {
  const { devices, loading, error, fetchDevices } = useDeviceStore();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  useEffect(() => {
    console.log('DashboardPage: Component mounted, fetching devices...');
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    console.log('DashboardPage: Devices updated:', devices);
    console.log('DashboardPage: Loading:', loading);
    console.log('DashboardPage: Error:', error);
  }, [devices, loading, error]);

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedDevice(null);
  };

  console.log('DashboardPage: Rendering with devices:', devices.length);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Network Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor your network health and device status at a glance
        </p>
      </div>
      
      {/* Summary Widgets Section */}
      <SummaryWidgets 
        devices={devices}
        loading={loading}
        error={error}
      />

      {/* Network Map Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Network Map</h2>
          <p className="text-gray-600 mt-1">
            Visual representation of your network devices and their connections
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading devices...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <p className="text-gray-500 text-lg">Error loading devices</p>
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <NetworkMap
              devices={devices}
              onDeviceClick={handleDeviceClick}
              selectedDeviceId={selectedDevice?.id}
            />
          )}
        </div>
      </div>

      {/* Device Detail Panel */}
      <DeviceDetailPanel
        device={selectedDevice}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
      />
    </main>
  );
};

export default DashboardPage; 