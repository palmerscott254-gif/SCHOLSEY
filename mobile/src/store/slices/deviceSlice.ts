import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DeviceState {
  status: {
    batteryLevel: number;
    isCharging: boolean;
    networkType: string;
    isOnline: boolean;
  };
  settings: {
    stealthMode: boolean;
    trackingEnabled: boolean;
    locationUpdateInterval: number;
  };
}

const initialState: DeviceState = {
  status: {
    batteryLevel: 100,
    isCharging: false,
    networkType: 'unknown',
    isOnline: true,
  },
  settings: {
    stealthMode: false,
    trackingEnabled: true,
    locationUpdateInterval: 60, // seconds
  },
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    updateDeviceStatus: (state, action: PayloadAction<Partial<DeviceState['status']>>) => {
      state.status = { ...state.status, ...action.payload };
    },
    updateSettings: (state, action: PayloadAction<Partial<DeviceState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    toggleStealthMode: (state) => {
      state.settings.stealthMode = !state.settings.stealthMode;
    },
    toggleTracking: (state) => {
      state.settings.trackingEnabled = !state.settings.trackingEnabled;
    },
  },
});

export const { updateDeviceStatus, updateSettings, toggleStealthMode, toggleTracking } =
  deviceSlice.actions;
export default deviceSlice.reducer;
