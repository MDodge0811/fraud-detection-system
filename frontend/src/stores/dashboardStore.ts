import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type DashboardStats } from '@/services/api';
import { type Alert, type Transaction } from '@/services/websocket';
import { type ChartData } from '@/services/dashboardData';
import dashboardDataService from '@/services/dashboardData';

interface DashboardState {
  // Connection state
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  
  // Data state
  stats: DashboardStats | null;
  recentAlerts: Alert[];
  loading: boolean;
  
  // Pagination state
  alertsPage: number;
  alertsPerPage: number;
  
  // Actions
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
  setStats: (stats: DashboardStats) => void;
  setRecentAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  setLoading: (loading: boolean) => void;
  
  // Pagination actions
  setAlertsPage: (page: number) => void;
  nextAlertsPage: () => void;
  prevAlertsPage: () => void;
  
  // Chart data actions
  initializeChartData: (transactions: Transaction[], alerts: Alert[]) => void;
  updateTransactionData: (transaction: Transaction) => void;
  updateAlertData: (alert: Alert) => void;
  
  // Chart data getters
  getTransactionVolumeData: () => ChartData;
  getRiskDistributionData: () => ChartData;
  getAlertTrendsData: () => ChartData;
  
  // Pagination getters
  getPaginatedAlerts: () => Alert[];
  getAlertsPageInfo: () => { currentPage: number; totalPages: number; totalAlerts: number };
  
  // Data fetching
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // Initial state
      connectionStatus: 'connecting',
      stats: null,
      recentAlerts: [],
      loading: true,
      
      // Pagination state
      alertsPage: 1,
      alertsPerPage: 10,

      // Connection actions
      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },

      // Data actions
      setStats: (stats) => {
        set({ stats });
      },

      setRecentAlerts: (alerts) => {
        set({ recentAlerts: alerts });
      },

      addAlert: (alert) => {
        set((state) => ({
          recentAlerts: [alert, ...state.recentAlerts.slice(0, 49)]
        }));
      },

      setLoading: (loading) => {
        set({ loading });
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

      // Chart data actions
      initializeChartData: (transactions, alerts) => {
        dashboardDataService.initializeChartData(transactions, alerts);
      },

      updateTransactionData: (transaction) => {
        dashboardDataService.updateTransactionData(transaction);
      },

      updateAlertData: (alert) => {
        dashboardDataService.updateAlertData(alert);
      },

      // Chart data getters
      getTransactionVolumeData: () => {
        return dashboardDataService.generateTransactionVolumeData();
      },

      getRiskDistributionData: () => {
        return dashboardDataService.generateRiskDistributionData();
      },

      getAlertTrendsData: () => {
        return dashboardDataService.generateAlertTrendsData();
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
          totalAlerts
        };
      },

      // Data fetching
      fetchDashboardData: async () => {
        try {
          set({ loading: true });
          const { stats, alerts, transactions } = await dashboardDataService.fetchDashboardData();
          
          set({ 
            stats, 
            recentAlerts: alerts,
            loading: false 
          });
          
          // Initialize chart data
          dashboardDataService.initializeChartData(transactions, alerts);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          set({ loading: false });
        }
      },
    }),
    {
      name: 'dashboard-store',
    }
  )
); 