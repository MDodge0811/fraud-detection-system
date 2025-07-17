import React, { useEffect } from 'react';
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Chart as ChartJS } from 'chart.js';

// Import stores
import { useDashboardStore, useWebSocketStore } from '../stores';

// Import components
import StatsCards from './StatsCards';
import ConnectionStatus from './ConnectionStatus';
import AlertsTable from './AlertsTable';
import { TransactionVolumeChart, RiskDistributionChart, AlertTrendsChart } from './charts';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  // Dashboard store
  const { loading, fetchDashboardData } = useDashboardStore();

  // WebSocket store
  const { connect, disconnect, subscribeToEvents, unsubscribeFromEvents } = useWebSocketStore();

  // Initialize dashboard
  useEffect(() => {
    // Fetch initial data
    fetchDashboardData();
    
    // Connect to WebSocket
    connect();
    
    // Subscribe to real-time events
    subscribeToEvents();

    // Cleanup on unmount
    return () => {
      unsubscribeFromEvents();
      disconnect();
    };
  }, [fetchDashboardData, connect, disconnect, subscribeToEvents, unsubscribeFromEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with connection status */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fraud Detection Dashboard</h1>
              <p className="text-gray-600 mt-2">Real-time monitoring of transactions and fraud alerts</p>
            </div>
            <ConnectionStatus />
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TransactionVolumeChart />
          <RiskDistributionChart />
        </div>

        {/* Alert Trends Chart */}
        <AlertTrendsChart />

        {/* Recent Alerts Table */}
        <AlertsTable />
      </div>
    </div>
  );
};

export default Dashboard; 