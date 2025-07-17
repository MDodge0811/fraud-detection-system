import { format, startOfHour } from 'date-fns';
import apiService, { type DashboardStats } from '@/services/api';
import { type Alert, type Transaction } from '@/services/websocket';

export interface HourlyData {
  [key: string]: number; // hour key -> count
}

export interface RiskDistributionData {
  low: number;
  medium: number;
  high: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string | string[];
    backgroundColor?: string | string[];
    tension?: number;
    borderWidth?: number;
  }>;
}

export interface DashboardData {
  stats: DashboardStats | null;
  recentAlerts: Alert[];
  recentTransactions: Transaction[];
  transactionVolumeData: HourlyData;
  alertTrendsData: HourlyData;
  riskDistributionData: RiskDistributionData;
}

class DashboardDataService {
  private transactionVolumeData: HourlyData = {};
  private alertTrendsData: HourlyData = {};
  private riskDistributionData: RiskDistributionData = { low: 0, medium: 0, high: 0 };

  // Initialize chart data with historical data
  initializeChartData(transactions: Transaction[], alerts: Alert[]): void {
    this.transactionVolumeData = {};
    this.alertTrendsData = {};
    this.riskDistributionData = { low: 0, medium: 0, high: 0 };

    // Process transactions for volume and risk distribution
    transactions.forEach(transaction => {
      const timestamp = new Date(transaction.timestamp);
      const hourKey = startOfHour(timestamp).toISOString();
      
      // Transaction volume
      this.transactionVolumeData[hourKey] = (this.transactionVolumeData[hourKey] || 0) + 1;
      
      // Risk distribution - use calculated risk score from risk_signals
      const riskScore = transaction.risk_signals?.[0]?.risk_score || 50;
      if (riskScore >= 75) {
        this.riskDistributionData.high++;
      } else if (riskScore >= 50) {
        this.riskDistributionData.medium++;
      } else {
        this.riskDistributionData.low++;
      }
    });

    // Process alerts for trends
    alerts.forEach(alert => {
      const timestamp = new Date(alert.created_at);
      const hourKey = startOfHour(timestamp).toISOString();
      this.alertTrendsData[hourKey] = (this.alertTrendsData[hourKey] || 0) + 1;
    });
  }

  // Update data with new transaction
  updateTransactionData(transaction: Transaction): void {
    const timestamp = new Date(transaction.timestamp);
    const hourKey = startOfHour(timestamp).toISOString();
    
    // Update transaction volume
    this.transactionVolumeData[hourKey] = (this.transactionVolumeData[hourKey] || 0) + 1;

    // Update risk distribution - use calculated risk score from risk_signals
    const riskScore = transaction.risk_signals?.[0]?.risk_score || 50;
    if (riskScore >= 75) {
      this.riskDistributionData.high++;
    } else if (riskScore >= 50) {
      this.riskDistributionData.medium++;
    } else {
      this.riskDistributionData.low++;
    }
  }

  // Update data with new alert
  updateAlertData(alert: Alert): void {
    const timestamp = new Date(alert.created_at);
    const hourKey = startOfHour(timestamp).toISOString();
    this.alertTrendsData[hourKey] = (this.alertTrendsData[hourKey] || 0) + 1;
  }

  // Generate transaction volume chart data
  generateTransactionVolumeData(): ChartData {
    const sortedHours = Object.keys(this.transactionVolumeData)
      .map(key => new Date(key))
      .sort((a, b) => a.getTime() - b.getTime());

    const labels = sortedHours.map(hour => format(hour, 'MMM dd, HH:mm'));
    const data = sortedHours.map(hour => {
      const hourKey = startOfHour(hour).toISOString();
      return this.transactionVolumeData[hourKey] || 0;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Transactions per Hour',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    };
  }

  // Generate risk distribution chart data
  generateRiskDistributionData(): ChartData {
    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [
        {
          label: 'Risk Distribution',
          data: [
            this.riskDistributionData.low,
            this.riskDistributionData.medium,
            this.riskDistributionData.high
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(251, 191, 36)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }

  // Generate alert trends chart data
  generateAlertTrendsData(): ChartData {
    const sortedHours = Object.keys(this.alertTrendsData)
      .map(key => new Date(key))
      .sort((a, b) => a.getTime() - b.getTime());

    const labels = sortedHours.map(hour => format(hour, 'MMM dd, HH:mm'));
    const data = sortedHours.map(hour => {
      const hourKey = startOfHour(hour).toISOString();
      return this.alertTrendsData[hourKey] || 0;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Alerts per Hour',
          data,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
      ],
    };
  }

  // Fetch initial dashboard data
  async fetchDashboardData(): Promise<{
    stats: DashboardStats;
    alerts: Alert[];
    transactions: Transaction[];
  }> {
    const [stats, alerts, transactions] = await Promise.all([
      apiService.getDashboardStats(),
      apiService.getAlerts(50, true), // Get all-time alerts for charts
      apiService.getTransactions(100, true) // Get all-time transactions for charts
    ]);

    return { stats, alerts, transactions };
  }

  // Get current data state
  getCurrentData(): {
    transactionVolumeData: HourlyData;
    alertTrendsData: HourlyData;
    riskDistributionData: RiskDistributionData;
  } {
    return {
      transactionVolumeData: { ...this.transactionVolumeData },
      alertTrendsData: { ...this.alertTrendsData },
      riskDistributionData: { ...this.riskDistributionData }
    };
  }
}

export const dashboardDataService = new DashboardDataService();
export default dashboardDataService; 