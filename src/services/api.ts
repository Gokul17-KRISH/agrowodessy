import {
  Bin,
  Truck,
  Route,
  WasteHistory,
  Campaign,
  AgentEvent,
  TrafficEvent,
  RoadClosure,
  SystemAlert,
  AgentStatus,
  User
} from '../types.js';

const API_BASE = '/api';

const TOKEN_KEY = 'wastewise_token';

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Server network error.' };
    }
  },

  async loginWithGoogle(email: string, name?: string, avatar?: string): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatar })
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Google SSO authentication error.' };
    }
  },

  async getMe(): Promise<{ success: boolean; user?: User; message?: string }> {
    const token = this.getToken();
    if (!token) return { success: false, message: 'No token stored' };
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders()
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to authenticate session' };
    }
  },

  async logout(): Promise<{ success: boolean }> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders()
      });
    } catch {
      // Ignore network errors on logout
    }
    this.removeToken();
    return { success: true };
  },

  // Bins
  async getBins(): Promise<{ success: boolean; data: Bin[] }> {
    const res = await fetch(`${API_BASE}/bins`, { headers: getHeaders() });
    return await res.json();
  },

  async getBin(id: string): Promise<{ success: boolean; data: Bin }> {
    const res = await fetch(`${API_BASE}/bins/${id}`);
    return await res.json();
  },

  async simulateBinFill(binId?: string, delta?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/bins/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ binId, delta })
    });
    return await res.json();
  },

  async scanBinImage(binId: string, imageDescription: string): Promise<any> {
    const res = await fetch(`${API_BASE}/bins/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ binId, imageDescription })
    });
    return await res.json();
  },

  async updateBinWasteType(binId: string, wasteType: string, isMixed?: boolean, contaminationDetails?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/bins/update-waste-type`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ binId, wasteType, isMixed, contaminationDetails })
    });
    return await res.json();
  },

  // Trucks
  async getTrucks(): Promise<{ success: boolean; data: Truck[] }> {
    const res = await fetch(`${API_BASE}/trucks`);
    return await res.json();
  },

  // Routes
  async getRoutes(): Promise<{ success: boolean; data: Route[] }> {
    const res = await fetch(`${API_BASE}/routes`);
    return await res.json();
  },

  async optimizeRoutes(targetBinIds?: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/routes/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetBinIds })
    });
    return await res.json();
  },

  async approveRoute(routeId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/routes/${routeId}/approve`, {
      method: 'POST'
    });
    return await res.json();
  },

  async rejectRoute(routeId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/routes/${routeId}/reject`, {
      method: 'POST'
    });
    return await res.json();
  },

  async modifyRoute(routeId: string, newBinSequence?: string[], newTruckId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/routes/${routeId}/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newBinSequence, newTruckId })
    });
    return await res.json();
  },

  async reoptimizeRoute(routeId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/routes/${routeId}/reoptimize`, {
      method: 'POST'
    });
    return await res.json();
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics`);
    return await res.json();
  },

  // Campaigns
  async getCampaigns(): Promise<{ success: boolean; data: Campaign[] }> {
    const res = await fetch(`${API_BASE}/campaigns`);
    return await res.json();
  },

  async generateCampaign(neighborhood: string, wasteIssue?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/campaigns/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ neighborhood, wasteIssue })
    });
    return await res.json();
  },

  async getWorkflows(): Promise<{ success: boolean; data: any[] }> {
    const res = await fetch(`${API_BASE}/agents/workflows`);
    return await res.json();
  },

  async getWorkflow(id: string): Promise<{ success: boolean; data: any }> {
    const res = await fetch(`${API_BASE}/agents/workflows/${id}`);
    return await res.json();
  },

  async getAgentMessages(): Promise<{ success: boolean; data: any[] }> {
    const res = await fetch(`${API_BASE}/agents/messages`);
    return await res.json();
  },

  async getToolCalls(): Promise<{ success: boolean; data: any[] }> {
    const res = await fetch(`${API_BASE}/agents/tool-calls`);
    return await res.json();
  },

  async triggerWorkflowDemo(): Promise<any> {
    const res = await fetch(`${API_BASE}/agents/workflows/demo`, {
      method: 'POST'
    });
    return await res.json();
  },

  async approveCampaign(campaignId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/campaigns/${campaignId}/approve`, {
      method: 'POST'
    });
    return await res.json();
  },

  async publishCampaign(campaignId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/campaigns/${campaignId}/publish`, {
      method: 'POST'
    });
    return await res.json();
  },

  // Agent Status & Events
  async getAgentStatuses(): Promise<{ success: boolean; data: AgentStatus[] }> {
    const res = await fetch(`${API_BASE}/agents/status`);
    return await res.json();
  },

  async getAgentEvents(): Promise<{ success: boolean; data: AgentEvent[] }> {
    const res = await fetch(`${API_BASE}/agents/events`);
    return await res.json();
  },

  // Simulation & Traffic
  async simulateOverflow(binId = 'BIN-005'): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/overflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ binId })
    });
    return await res.json();
  },

  async simulateTraffic(neighborhood = 'Gandhipuram'): Promise<any> {
    const res = await fetch(`${API_BASE}/traffic/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ neighborhood, severity: 'HEAVY' })
    });
    return await res.json();
  },

  async closeRoad(neighborhood = 'RS Puram', roadName = 'DB Road North Axis'): Promise<any> {
    const res = await fetch(`${API_BASE}/road-closures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ neighborhood, roadName })
    });
    return await res.json();
  },

  async resetSimulation(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/reset`, {
      method: 'POST'
    });
    return await res.json();
  },

  async executeDemoStep(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/demo-step`, {
      method: 'POST'
    });
    return await res.json();
  },

  async triggerOrchestration(triggerType = 'MANUAL_OPTIMIZE'): Promise<any> {
    const res = await fetch(`${API_BASE}/orchestration/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggerType })
    });
    return await res.json();
  },

  // Alerts
  async getAlerts(): Promise<{ success: boolean; data: SystemAlert[] }> {
    const res = await fetch(`${API_BASE}/alerts`);
    return await res.json();
  },

  // Traffic & Road Closures
  async getTraffic(): Promise<{ success: boolean; data: TrafficEvent[] }> {
    const res = await fetch(`${API_BASE}/traffic`);
    return await res.json();
  },

  async getRoadClosures(): Promise<{ success: boolean; data: RoadClosure[] }> {
    const res = await fetch(`${API_BASE}/road-closures`);
    return await res.json();
  },

  // Citizen Reports
  async getCitizenReports(): Promise<{ success: boolean; data: any[] }> {
    const res = await fetch(`${API_BASE}/citizen-reports`);
    return await res.json();
  },

  async createCitizenReport(reportData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/citizen-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    return await res.json();
  },

  async voteCitizenReport(id: string, direction: 'up' | 'down'): Promise<any> {
    const res = await fetch(`${API_BASE}/citizen-reports/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction })
    });
    return await res.json();
  },

  async updateCitizenReportStatus(id: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE}/citizen-reports/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await res.json();
  }
};
