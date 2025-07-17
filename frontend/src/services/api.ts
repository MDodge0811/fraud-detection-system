const API_BASE_URL = 'http://localhost:3000/api';

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
    return this.request<DashboardStats>('/dashboard/stats');
  }

  // Transaction endpoints
  async getTransactions(limit: number = 100): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/transactions?limit=${limit}`);
  }

  async getTransactionById(id: string): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`);
  }

  // Alert endpoints
  async getAlerts(limit: number = 50): Promise<Alert[]> {
    return this.request<Alert[]>(`/alerts?limit=${limit}`);
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