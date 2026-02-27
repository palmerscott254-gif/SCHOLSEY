import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Device {
  id: string;
  name: string;
  model: string;
  isOnline: boolean;
  battery: number;
  lastSeen: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

interface DevicesState {
  devices: Device[];
  selected: string | null;
}

const initialState: DevicesState = {
  devices: [],
  selected: null,
};

const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    setDevices: (state, action: PayloadAction<Device[]>) => {
      state.devices = action.payload;
    },
    updateDevice: (state, action: PayloadAction<Device>) => {
      const index = state.devices.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.devices[index] = action.payload;
      }
    },
    selectDevice: (state, action: PayloadAction<string>) => {
      state.selected = action.payload;
    },
  },
});

export const { setDevices, updateDevice, selectDevice } = devicesSlice.actions;
export default devicesSlice.reducer;
