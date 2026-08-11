import { User, DemandContract, CropCommitment, QualityReport, Delivery, Notification, DistrictSaturationIntelligence, SystemMetrics } from '../types';

const BASE_URL = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('agrilink_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

// ==========================================
// AUTH
// ==========================================

export const api = {
  auth: {
    register: async (payload: {
      name: string;
      email: string;
      password: string;
      confirmPassword?: string;
      phone?: string;
      district?: string;
      role?: string;
    }) => {
      const res = await request<{ success: boolean; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.token) localStorage.setItem('agrilink_token', res.token);
      return res;
    },

    login: async (email: string, password: string) => {
      const res = await request<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.token) localStorage.setItem('agrilink_token', res.token);
      return res;
    },

    googleSSO: async (googleData: { email: string; name: string; avatar?: string }) => {
      const res = await request<{ success: boolean; token: string; user: User }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify(googleData)
      });
      if (res.token) localStorage.setItem('agrilink_token', res.token);
      return res;
    },

    getMe: async () => {
      return request<{ success: boolean; user: User }>('/auth/me');
    },

    logout: async () => {
      localStorage.removeItem('agrilink_token');
      return request<{ success: boolean }>('/auth/logout', { method: 'POST' });
    },

    getUsers: async () => {
      return request<{ success: boolean; data: User[] }>('/auth/users');
    }
  },

  // ==========================================
  // DEMANDS
  // ==========================================

  demands: {
    list: async (filters?: { district?: string; status?: string; cropName?: string }) => {
      const params = new URLSearchParams();
      if (filters?.district) params.set('district', filters.district);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.cropName) params.set('cropName', filters.cropName);
      const qs = params.toString();
      return request<{ success: boolean; count: number; data: DemandContract[] }>(`/demands${qs ? `?${qs}` : ''}`);
    },

    get: async (id: string) => {
      return request<{ success: boolean; data: DemandContract & { commitments: CropCommitment[] } }>(`/demands/${id}`);
    },

    create: async (payload: Partial<DemandContract>) => {
      return request<{ success: boolean; data: DemandContract }>('/demands', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    update: async (id: string, updates: Partial<DemandContract>) => {
      return request<{ success: boolean; data: DemandContract }>(`/demands/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }
  },

  // ==========================================
  // COMMITMENTS
  // ==========================================

  commitments: {
    list: async (filters?: { farmerId?: string; demandContractId?: string; district?: string }) => {
      const params = new URLSearchParams();
      if (filters?.farmerId) params.set('farmerId', filters.farmerId);
      if (filters?.demandContractId) params.set('demandContractId', filters.demandContractId);
      if (filters?.district) params.set('district', filters.district);
      const qs = params.toString();
      return request<{ success: boolean; count: number; data: CropCommitment[] }>(`/commitments${qs ? `?${qs}` : ''}`);
    },

    create: async (payload: { demandContractId: string; quantityKg: number; plantingDate?: string; harvestDateAvailable?: string }) => {
      return request<{ success: boolean; data: CropCommitment }>('/commitments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    update: async (id: string, updates: Partial<CropCommitment>) => {
      return request<{ success: boolean; data: CropCommitment }>(`/commitments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }
  },

  // ==========================================
  // QUALITY REPORTS
  // ==========================================

  qualityReports: {
    list: async () => {
      return request<{ success: boolean; count: number; data: QualityReport[] }>('/quality-reports');
    },

    create: async (payload: Partial<QualityReport>) => {
      return request<{ success: boolean; data: QualityReport }>('/quality-reports', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },

  // ==========================================
  // DELIVERIES & ESCROW
  // ==========================================

  deliveries: {
    list: async (filters?: { buyerId?: string; farmerId?: string; demandContractId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.buyerId) params.set('buyerId', filters.buyerId);
      if (filters?.farmerId) params.set('farmerId', filters.farmerId);
      if (filters?.demandContractId) params.set('demandContractId', filters.demandContractId);
      const qs = params.toString();
      return request<{ success: boolean; count: number; data: Delivery[] }>(`/deliveries${qs ? `?${qs}` : ''}`);
    },

    get: async (id: string) => {
      return request<{ success: boolean; data: Delivery }>(`/deliveries/${id}`);
    },

    create: async (payload: { demandContractId: string; cropCommitmentId: string; quantityDeliveredKg?: number }) => {
      return request<{ success: boolean; data: Delivery }>('/deliveries', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    escrowAction: async (deliveryId: string, action: 'deposit' | 'release' | 'refund') => {
      return request<{ success: boolean; data: Delivery }>(`/deliveries/${deliveryId}/escrow`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
    },

    update: async (id: string, updates: Partial<Delivery>) => {
      return request<{ success: boolean; data: Delivery }>(`/deliveries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  notifications: {
    list: async () => {
      return request<{ success: boolean; count: number; data: Notification[] }>('/notifications');
    },

    markRead: async (id: string) => {
      return request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' });
    }
  },

  // ==========================================
  // INTELLIGENCE & METRICS
  // ==========================================

  saturation: {
    get: async (district?: string) => {
      const qs = district ? `?district=${encodeURIComponent(district)}` : '';
      return request<{ success: boolean; count: number; data: DistrictSaturationIntelligence[] }>(`/saturation${qs}`);
    }
  },

  metrics: {
    get: async () => {
      return request<{ success: boolean; data: SystemMetrics }>('/metrics');
    }
  },

  // ==========================================
  // HEALTH
  // ==========================================

  health: {
    check: async () => {
      return request<{ status: string; service: string }>('/health');
    }
  }
};

export default api;
