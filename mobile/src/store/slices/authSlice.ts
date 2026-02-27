import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  deviceId: string | null;
  isPaired: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  deviceId: null,
  isPaired: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: any; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setDevicePaired: (state, action: PayloadAction<{ deviceId: string }>) => {
      state.isPaired = true;
      state.deviceId = action.payload.deviceId;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.deviceId = null;
      state.isPaired = false;
    },
  },
});

export const { setAuth, setDevicePaired, logout } = authSlice.actions;
export default authSlice.reducer;
