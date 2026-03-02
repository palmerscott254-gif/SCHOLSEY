import axios, { AxiosInstance } from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

// Environment configuration - update based on deployment
const API_CONFIG = {
  development: 'http://localhost:3000/v1',
  staging: 'https://staging-api.devicetracker.com/v1',
  production: 'https://api.devicetracker.com/v1',
};

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use environment variable or default to production
    const environment = process.env.NODE_ENV || 'production';
    this.baseURL = API_CONFIG[environment as keyof typeof API_CONFIG] || API_CONFIG.production;

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await EncryptedStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh or logout
          await this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleUnauthorized() {
    try {
      const refreshToken = await EncryptedStorage.getItem('refresh_token');
      if (refreshToken) {
        const response = await this.api.post('/auth/refresh', { refreshToken });
        await EncryptedStorage.setItem('access_token', response.data.accessToken);
      } else {
        store.dispatch(logout());
      }
    } catch (error) {
      store.dispatch(logout());
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: any) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async verify2FA(userId: string, code: string) {
    const response = await this.api.post('/auth/verify-2fa', { userId, code });
    return response.data;
  }

  // Device pairing
  async pairDevice(deviceData: any) {
    const response = await this.api.post('/devices/pair', deviceData);
    return response.data;
  }

  async verifyPairingCode(deviceId: string, pairingCode: string) {
    const response = await this.api.post(`/devices/pair/${deviceId}/verify`, {
      pairingCode: pairingCode.toUpperCase(),
    });
    return response.data;
  }

  async getDevices() {
    const response = await this.api.get('/devices');
    return response.data;
  }

  // Location updates
  async updateLocation(location: any) {
    const response = await this.api.post('/tracking/location', location);
    return response.data;
  }

  async batchUpdateLocation(locations: any[]) {
    const response = await this.api.post('/tracking/location/batch', { locations });
    return response.data;
  }

  // Security events
  async reportSecurityEvent(event: any) {
    const response = await this.api.post('/security/events', event);
    return response.data;
  }

  // Remote actions
  async getRemoteActions(deviceId: string) {
    const response = await this.api.get(`/actions/device/${deviceId}`);
    return response.data;
  }

  async acknowledgeAction(actionId: string, result: any) {
    const response = await this.api.patch(`/actions/${actionId}`, result);
    return response.data;
  }
}

export default new ApiService();
