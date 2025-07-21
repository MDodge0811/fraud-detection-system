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
  totalAlerts: number;
  openAlerts: number;
  totalTransactions: number;
  highRiskTransactions: number;
  todayTransactions: number;
  todayAlerts: number;
  alertResolutionRate: string;
  avgRiskScore: string;
}

export interface AlertTrendsData {
  hour_bucket: string;
  alert_count: number;
  open_alerts: number;
  high_risk_alerts: number;
}

export interface RiskDistributionData {
  risk_level: 'low' | 'medium' | 'high';
  count: number;
  percentage: string;
}

export interface TransactionVolumeData {
  hour_bucket: string;
  transaction_count: number;
  total_amount: string;
  avg_amount: string;
}

export interface RecentActivityData {
  type: 'transaction' | 'alert';
  id: string;
  created_at: string;
  amount: string;
  status: string;
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

  // New aggregated chart endpoints
  async getAlertTrends(timeframe: string = '24h', limit: number = 100): Promise<AlertTrendsData[]> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    if (limit !== 100) params.append('limit', limit.toString());
    const response = await this.request<{ success: boolean; data: AlertTrendsData[] }>(
      `/dashboard/alert-trends?${params.toString()}`,
    );
    return response.data;
  }

  async getRiskDistribution(timeframe: string = 'all'): Promise<RiskDistributionData[]> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    const response = await this.request<{ success: boolean; data: RiskDistributionData[] }>(
      `/dashboard/risk-distribution?${params.toString()}`,
    );
    return response.data;
  }

  async getTransactionVolume(timeframe: string = '24h', limit: number = 100): Promise<TransactionVolumeData[]> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    if (limit !== 100) params.append('limit', limit.toString());
    const response = await this.request<{ success: boolean; data: TransactionVolumeData[] }>(
      `/dashboard/transaction-volume?${params.toString()}`,
    );
    return response.data;
  }

  async getRecentActivity(limit: number = 50): Promise<RecentActivityData[]> {
    const params = new URLSearchParams();
    if (limit !== 50) params.append('limit', limit.toString());
    const response = await this.request<{ success: boolean; data: RecentActivityData[] }>(
      `/dashboard/recent-activity?${params.toString()}`,
    );
    return response.data;
  }

  // Transaction endpoints
  async getTransactions(limit: number = 100, timeframe: string = 'all'): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (limit !== 100) params.append('limit', limit.toString());
    if (timeframe !== 'all') params.append('timeframe', timeframe);
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
  async getAlerts(limit: number = 50, timeframe: string = 'all'): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (limit !== 50) params.append('limit', limit.toString());
    if (timeframe !== 'all') params.append('timeframe', timeframe);
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
