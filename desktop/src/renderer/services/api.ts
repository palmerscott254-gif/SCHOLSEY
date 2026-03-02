const API_BASE_URL = 'http://localhost:3000/v1';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export const api = {
  auth: {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Login failed');
      }

      return response.json() as Promise<AuthResponse>;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Registration failed');
      }

      return response.json() as Promise<AuthResponse>;
    },
  },

  devices: {
    getAll: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/devices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      return data.devices || [];
    },

    getById: async (id: string, token: string) => {
      const response = await fetch(`${API_BASE_URL}/devices/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch device');
      }

      return response.json();
    },

    initiatePairing: async (deviceData: any, token: string) => {
      const response = await fetch(`${API_BASE_URL}/devices/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deviceData),
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to initiate device pairing');
      }

      return response.json();
    },

    unpairDevice: async (deviceId: string, token: string) => {
      const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/unpair`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unpair device');
      }

      return response.json();
    },
  },

  alerts: {
    getAll: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/alerts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();
      return data.alerts || [];
    },

    markAsRead: async (id: string, token: string) => {
      const response = await fetch(`${API_BASE_URL}/alerts/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark alert as read');
      }

      return response.json();
    },
  },

  tracking: {
    getHistory: async (deviceId: string, token: string) => {
      const response = await fetch(
        `${API_BASE_URL}/tracking/device/${deviceId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tracking history');
      }

      return response.json();
    },
  },

  security: {
    analyze: async (deviceId: string, token: string) => {
      const response = await fetch(
        `${API_BASE_URL}/security/analyze/${deviceId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze device security');
      }

      return response.json();
    },

    getReport: async (deviceId: string, token: string) => {
      const response = await fetch(
        `${API_BASE_URL}/security/report/${deviceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch security report');
      }

      return response.json();
    },
  },

  ai: {
    analyzeImage: async (file: File, token: string) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to analyze image');
      }

      return response.json();
    },
  },

  users: {
    getProfile: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return response.json();
    },

    updateProfile: async (data: any, token: string) => {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update profile');
      }

      return response.json();
    },

    changePassword: async (currentPassword: string, newPassword: string, token: string) => {
      const response = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error: any = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to change password');
      }

      return response.json();
    },

    deleteAccount: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      return response.status === 204 || response.json();
    },
  },
};
