import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiService, {
  type DashboardStats,
  type AlertTrendsData,
  type RiskDistributionData,
  type TransactionVolumeData,
  type RecentActivityData,
} from '@/services/api';
import { type Alert } from '@/services/websocket';
import { type ChartData } from '@/services/dashboardData';

export type Timeframe = '1h' | '6h' | '12h' | '24h' | '7d' | '30d' | 'all';

interface DashboardState {
  // Connection state
  connectionStatus: 'connecting' | 'connected' | 'disconnected';

  // Data state
  stats: DashboardStats | null;
  recentAlerts: Alert[];
  loading: boolean;

  // Timeframe state
  timeframe: Timeframe;

  // Chart data state
  alertTrends: AlertTrendsData[];
  riskDistribution: RiskDistributionData[];
  transactionVolume: TransactionVolumeData[];
  recentActivity: RecentActivityData[];

  // Pagination state
  alertsPage: number;
  alertsPerPage: number;

  // Loading states for different components
  statsLoading: boolean;
  alertsLoading: boolean;
  chartsLoading: boolean;

  // Cache for different timeframes
  timeframeCache: Record<Timeframe, {
    stats: DashboardStats | null;
    alerts: Alert[];
    alertTrends: AlertTrendsData[];
    riskDistribution: RiskDistributionData[];
    transactionVolume: TransactionVolumeData[];
    timestamp: number;
  }>;

  // Actions
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
  setStats: (stats: DashboardStats) => void;
  setRecentAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  setLoading: (loading: boolean) => void;
  setTimeframe: (timeframe: Timeframe) => void;

  // Loading state actions
  setStatsLoading: (loading: boolean) => void;
  setAlertsLoading: (loading: boolean) => void;
  setChartsLoading: (loading: boolean) => void;

  // Chart data actions
  setAlertTrends: (data: AlertTrendsData[]) => void;
  setRiskDistribution: (data: RiskDistributionData[]) => void;
  setTransactionVolume: (data: TransactionVolumeData[]) => void;
  setRecentActivity: (data: RecentActivityData[]) => void;

  // Pagination actions
  setAlertsPage: (page: number) => void;
  nextAlertsPage: () => void;
  prevAlertsPage: () => void;

  // Chart data getters
  getTransactionVolumeChartData: () => ChartData;
  getRiskDistributionChartData: () => ChartData;
  getAlertTrendsChartData: () => ChartData;

  // Pagination getters
  getPaginatedAlerts: () => Alert[];
  getAlertsPageInfo: () => { currentPage: number; totalPages: number; totalAlerts: number };

  // Data fetching
  fetchDashboardData: (timeframe?: Timeframe) => Promise<void>;
  fetchChartData: (timeframe?: Timeframe) => Promise<void>;
  changeTimeframe: (newTimeframe: Timeframe) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // Initial state
      connectionStatus: 'connecting',
      stats: null,
      recentAlerts: [],
      loading: true,

      // Timeframe state
      timeframe: '24h' as Timeframe,

      // Chart data state
      alertTrends: [],
      riskDistribution: [],
      transactionVolume: [],
      recentActivity: [],

      // Pagination state
      alertsPage: 1,
      alertsPerPage: 10,

      // Loading states for different components
      statsLoading: false,
      alertsLoading: false,
      chartsLoading: false,

      // Cache for different timeframes
      timeframeCache: {},

      // Connection actions
      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },

      // Data actions
      setStats: (stats) => {
        set({ stats });
      },

      setRecentAlerts: (alerts) => {
        // Remove duplicates based on alert_id to prevent React key conflicts
        const uniqueAlerts = alerts.filter((alert, index, self) => 
          index === self.findIndex(a => a.alert_id === alert.alert_id)
        );
        set({ recentAlerts: uniqueAlerts });
      },

      addAlert: (alert) => {
        set((state) => {
          // Check if alert already exists to prevent duplicates
          const alertExists = state.recentAlerts.some(existingAlert => 
            existingAlert.alert_id === alert.alert_id
          );
          
          if (alertExists) {
            return state; // Don't add duplicate
          }
          
          return {
            recentAlerts: [alert, ...state.recentAlerts.slice(0, 49)],
          };
        });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setTimeframe: (timeframe) => {
        set({ timeframe });
      },

      // Loading state actions
      setStatsLoading: (loading) => {
        set({ statsLoading: loading });
      },

      setAlertsLoading: (loading) => {
        set({ alertsLoading: loading });
      },

      setChartsLoading: (loading) => {
        set({ chartsLoading: loading });
      },

      // Chart data actions
      setAlertTrends: (data) => {
        set({ alertTrends: data });
      },

      setRiskDistribution: (data) => {
        set({ riskDistribution: data });
      },

      setTransactionVolume: (data) => {
        set({ transactionVolume: data });
      },

      setRecentActivity: (data) => {
        set({ recentActivity: data });
      },

      // Pagination actions
      setAlertsPage: (page) => {
        set({ alertsPage: page });
      },

      nextAlertsPage: () => {
        const state = get();
        const totalPages = Math.ceil(state.recentAlerts.length / state.alertsPerPage);
        if (state.alertsPage < totalPages) {
          set({ alertsPage: state.alertsPage + 1 });
        }
      },

      prevAlertsPage: () => {
        const state = get();
        if (state.alertsPage > 1) {
          set({ alertsPage: state.alertsPage - 1 });
        }
      },

      // Chart data getters
      getTransactionVolumeChartData: () => {
        const state = get();
        // Reverse the array to show chronological order (oldest to newest)
        const sortedData = [...state.transactionVolume].reverse();
        const labels = sortedData.map(item => {
          const date = new Date(item.hour_bucket);
          return date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit',
            minute: '2-digit'
          });
        });
        
        const data = sortedData.map(item => item.transaction_count);
        
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
      },

      getRiskDistributionChartData: () => {
        const state = get();
        const labels = state.riskDistribution.map(item => 
          `${item.risk_level.charAt(0).toUpperCase() + item.risk_level.slice(1)} Risk`
        );
        
        const data = state.riskDistribution.map(item => item.count);
        
        // Create a color mapping based on risk level
        const colorMap = {
          low: {
            backgroundColor: 'rgba(34, 197, 94, 0.8)', // Green
            borderColor: 'rgb(34, 197, 94)',
          },
          medium: {
            backgroundColor: 'rgba(251, 191, 36, 0.8)', // Yellow/Orange
            borderColor: 'rgb(251, 191, 36)',
          },
          high: {
            backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
            borderColor: 'rgb(239, 68, 68)',
          },
        };
        
        return {
          labels,
          datasets: [
            {
              label: 'Risk Distribution',
              data,
              backgroundColor: state.riskDistribution.map(item => colorMap[item.risk_level].backgroundColor),
              borderColor: state.riskDistribution.map(item => colorMap[item.risk_level].borderColor),
              borderWidth: 2,
            },
          ],
        };
      },

      getAlertTrendsChartData: () => {
        const state = get();
        // Reverse the array to show chronological order (oldest to newest)
        const sortedData = [...state.alertTrends].reverse();
        const labels = sortedData.map(item => {
          const date = new Date(item.hour_bucket);
          return date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit',
            minute: '2-digit'
          });
        });
        
        const data = sortedData.map(item => item.alert_count);
        
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
      },

      // Pagination getters
      getPaginatedAlerts: () => {
        const state = get();
        const startIndex = (state.alertsPage - 1) * state.alertsPerPage;
        const endIndex = startIndex + state.alertsPerPage;
        return state.recentAlerts.slice(startIndex, endIndex);
      },

      getAlertsPageInfo: () => {
        const state = get();
        const totalAlerts = state.recentAlerts.length;
        const totalPages = Math.ceil(totalAlerts / state.alertsPerPage);
        return {
          currentPage: state.alertsPage,
          totalPages,
          totalAlerts,
        };
      },

      // Data fetching
      fetchDashboardData: async (timeframe?: Timeframe) => {
        try {
          set({ loading: true });
          const tf = timeframe || get().timeframe;
          
          const [stats, alerts] = await Promise.all([
            apiService.getDashboardStats(),
            apiService.getAlerts(50, tf),
          ]);

          set({
            stats,
            recentAlerts: alerts,
            loading: false,
          });
        } catch {
          set({ loading: false });
        }
      },

      fetchChartData: async (timeframe?: Timeframe) => {
        try {
          const tf = timeframe || get().timeframe;
          
          const [alertTrends, riskDistribution, transactionVolume, recentActivity] = await Promise.all([
            apiService.getAlertTrends(tf, 100),
            apiService.getRiskDistribution(tf),
            apiService.getTransactionVolume(tf, 100),
            apiService.getRecentActivity(50),
          ]);

          set({
            alertTrends,
            riskDistribution,
            transactionVolume,
            recentActivity,
          });
        } catch (error) {
          console.error('Error fetching chart data:', error);
        }
      },

      changeTimeframe: async (newTimeframe) => {
        const state = get();
        const cache = state.timeframeCache;
        const cachedData = cache[newTimeframe];

        // Check if we have cached data that's less than 5 minutes old
        if (cachedData && Date.now() - cachedData.timestamp < 300000) {
          set({
            timeframe: newTimeframe,
            stats: cachedData.stats,
            recentAlerts: cachedData.alerts,
            alertTrends: cachedData.alertTrends,
            riskDistribution: cachedData.riskDistribution,
            transactionVolume: cachedData.transactionVolume,
            loading: false,
          });
          return;
        }

        // Set loading states for different components
        set({ 
          timeframe: newTimeframe,
          statsLoading: true,
          alertsLoading: true,
          chartsLoading: true,
        });

        try {
          const [stats, alerts, alertTrends, riskDistribution, transactionVolume] = await Promise.all([
            apiService.getDashboardStats(),
            apiService.getAlerts(50, newTimeframe),
            apiService.getAlertTrends(newTimeframe, 100),
            apiService.getRiskDistribution(newTimeframe),
            apiService.getTransactionVolume(newTimeframe, 100),
          ]);

          set({
            stats,
            recentAlerts: alerts,
            alertTrends,
            riskDistribution,
            transactionVolume,
            statsLoading: false,
            alertsLoading: false,
            chartsLoading: false,
          });

          // Update cache
          set((currentState) => ({
            timeframeCache: {
              ...currentState.timeframeCache,
              [newTimeframe]: {
                stats,
                alerts,
                alertTrends,
                riskDistribution,
                transactionVolume,
                timestamp: Date.now(),
              },
            },
          }));
        } catch (error) {
          console.error('Error fetching data for new timeframe:', error);
          set({ 
            statsLoading: false,
            alertsLoading: false,
            chartsLoading: false,
          });
        }
      },
    }),
    {
      name: 'dashboard-store',
    },
  ),
);
