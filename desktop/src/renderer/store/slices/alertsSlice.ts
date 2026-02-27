import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  deviceId: string;
  timestamp: string;
  isRead: boolean;
}

interface AlertsState {
  alerts: Alert[];
  unreadCount: number;
}

const initialState: AlertsState = {
  alerts: [],
  unreadCount: 0,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
      state.unreadCount = action.payload.filter(a => !a.isRead).length;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.isRead) {
        alert.isRead = true;
        state.unreadCount -= 1;
      }
    },
  },
});

export const { setAlerts, addAlert, markAsRead } = alertsSlice.actions;
export default alertsSlice.reducer;
