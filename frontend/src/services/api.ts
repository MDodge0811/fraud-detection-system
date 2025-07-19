const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Transaction {
  transaction_id: string;
  amount: number;
  timestamp: string;
  status: string;
  user_id: string;
  device_id?: string;
  merchant_id?: string;
}

export interface Alert {
  alert_id: string;
  transaction_id: string;
  risk_score: number;
  reason: string;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  transactions: Transaction[];
  alerts: Alert[];
  totalTransactions: number;
  totalAlerts: number;
  highRiskTransactions: number;
  averageAmount: number;
  alertResolutionRate: string;
}

export interface RiskSignal {
  signal_id: string;
  transaction_id: string;
  signal_type: string;
  risk_score: number;
  created_at: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<{ success: boolean; data: DashboardStats }>(
      '/dashboard/stats',
    );
    return response.data;
  }

  // Transaction endpoints
  async getTransactions(limit: number = 100, allTime: boolean = false): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (limit !== 100) params.append('limit', limit.toString());
    if (allTime) params.append('allTime', 'true');
    const response = await this.request<{ success: boolean; data: Transaction[]; count: number }>(
      `/transactions?${params.toString()}`,
    );
    return response.data;
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const response = await this.request<{ success: boolean; data: Transaction }>(
      `/transactions/${id}`,
    );
    return response.data;
  }

  // Alert endpoints
  async getAlerts(limit: number = 50, allTime: boolean = false): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (limit !== 50) params.append('limit', limit.toString());
    if (allTime) params.append('allTime', 'true');
    const response = await this.request<{ success: boolean; data: Alert[]; count: number }>(
      `/alerts?${params.toString()}`,
    );
    return response.data;
  }

  async resolveAlert(alertId: string): Promise<void> {
    return this.request<void>(`/alerts/${alertId}/resolve`, {
      method: 'PUT',
    });
  }

  // Risk analysis endpoints
  async getRiskAnalysis(transactionId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/risk-analysis/${transactionId}`);
  }

  async getRiskSignals(limit: number = 100): Promise<RiskSignal[]> {
    return this.request<RiskSignal[]>(`/risk-signals?limit=${limit}`);
  }

  // Simulation control
  async getSimulationStatus(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/simulation/status');
  }

  // Health check
  async getHealth(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/health');
  }
}

export const apiService = new ApiService();
export default apiService;
