import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SecurityState {
  events: Array<{
    id: string;
    type: string;
    severity: string;
    timestamp: string;
    data: any;
  }>;
  failedLoginAttempts: number;
  lastSecurityCheck: string | null;
}

const initialState: SecurityState = {
  events: [],
  failedLoginAttempts: 0,
  lastSecurityCheck: null,
};

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    addSecurityEvent: (state, action: PayloadAction<{
      type: string;
      severity: string;
      data: any;
    }>) => {
      const event = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: new Date().toISOString(),
      };
      state.events.unshift(event);
      // Keep only last 50 events in memory
      if (state.events.length > 50) {
        state.events = state.events.slice(0, 50);
      }
    },
    incrementFailedLogin: (state) => {
      state.failedLoginAttempts += 1;
    },
    resetFailedLogin: (state) => {
      state.failedLoginAttempts = 0;
    },
    updateSecurityCheck: (state) => {
      state.lastSecurityCheck = new Date().toISOString();
    },
  },
});

export const { addSecurityEvent, incrementFailedLogin, resetFailedLogin, updateSecurityCheck } =
  securitySlice.actions;
export default securitySlice.reducer;
