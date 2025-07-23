import { create } from 'zustand';
import { Device } from 'packages/shared-types';
import { getDevices } from '../services/api';

interface DeviceState {
  devices: Device[];
  loading: boolean;
  error: string | null;
  fetchDevices: () => Promise<void>;
  clearError: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  loading: false,
  error: null,
  
  fetchDevices: async () => {
    set({ loading: true, error: null });
    try {
      const devices = await getDevices();
      set({ devices, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch devices';
      set({ error: errorMessage, loading: false });
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
})); 