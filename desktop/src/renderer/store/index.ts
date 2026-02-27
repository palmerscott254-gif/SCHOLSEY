import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import devicesReducer from './slices/devicesSlice';
import alertsReducer from './slices/alertsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    devices: devicesReducer,
    alerts: alertsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
