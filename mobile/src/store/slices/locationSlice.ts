import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LocationState {
  current: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string | null;
  } | null;
  history: Array<any>;
  isTracking: boolean;
  offlineQueue: Array<any>;
}

const initialState: LocationState = {
  current: null,
  history: [],
  isTracking: false,
  offlineQueue: [],
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    updateLocation: (state, action: PayloadAction<{
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: string;
    }>) => {
      state.current = action.payload;
      state.history.push(action.payload);
      // Keep only last 100 locations in memory
      if (state.history.length > 100) {
        state.history = state.history.slice(-100);
      }
    },
    addToOfflineQueue: (state, action: PayloadAction<any>) => {
      state.offlineQueue.push(action.payload);
    },
    clearOfflineQueue: (state) => {
      state.offlineQueue = [];
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
  },
});

export const { updateLocation, addToOfflineQueue, clearOfflineQueue, setTracking } =
  locationSlice.actions;
export default locationSlice.reducer;
