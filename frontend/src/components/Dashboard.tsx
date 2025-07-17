import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subHours } from 'date-fns';
import apiService, { type DashboardStats } from '../services/api';
import websocketService, { type RealtimeEvent, type Alert, type Transaction } from '../services/websocket';

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
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [transactionVolumeData, setTransactionVolumeData] = useState<number[]>([]);
  const [alertTrendsData, setAlertTrendsData] = useState<number[]>([]);

  // Fetch initial dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const dashboardData = await apiService.getDashboardStats();
      setData(dashboardData);
      
      // Fetch recent alerts and transactions
      const alerts = await apiService.getAlerts(10);
      const transactions = await apiService.getTransactions(10);
      setRecentAlerts(alerts);
      setRecentTransactions(transactions);
      
      // Initialize chart data
      initializeChartData();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize chart data with historical data
  const initializeChartData = useCallback(() => {
    const hours = [];
    const volumes = [];
    const alerts = [];
    
    for (let i = 23; i >= 0; i--) {
      const hour = subHours(new Date(), i);
      hours.push(format(hour, 'HH:mm'));
      
      // Simulate initial data (will be updated with real data)
      volumes.push(Math.floor(Math.random() * 50) + 10);
      alerts.push(Math.floor(Math.random() * 10) + 1);
    }

    setTransactionVolumeData(volumes);
    setAlertTrendsData(alerts);
  }, []);

  // Handle real-time updates
  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Set up event listeners
    const handleNewTransaction = (data: unknown) => {
      const event = data as RealtimeEvent;
      const transaction = event.data as Transaction;
      setRecentTransactions(prev => [transaction, ...prev.slice(0, 9)]);
      
      // Update transaction volume chart
      setTransactionVolumeData(prev => {
        const newData = [...prev];
        const currentHour = new Date().getHours();
        newData[currentHour] = (newData[currentHour] || 0) + 1;
        return newData;
      });
    };

    const handleNewAlert = (data: unknown) => {
      const event = data as RealtimeEvent;
      const alert = event.data as Alert;
      setRecentAlerts(prev => [alert, ...prev.slice(0, 9)]);
      
      // Update alert trends chart
      setAlertTrendsData(prev => {
        const newData = [...prev];
        const currentHour = new Date().getHours();
        newData[currentHour] = (newData[currentHour] || 0) + 1;
        return newData;
      });
    };

    const handleDashboardStats = (data: unknown) => {
      const event = data as RealtimeEvent;
      const stats = event.data as DashboardStats;
      setData(prev => prev ? { ...prev, ...stats } : stats);
    };

    const handleConnectionStatus = () => {
      setConnectionStatus(websocketService.connected ? 'connected' : 'disconnected');
    };

    // Subscribe to events
    websocketService.on('transaction:new', handleNewTransaction);
    websocketService.on('alert:new', handleNewAlert);
    websocketService.on('dashboard:stats', handleDashboardStats);

    // Check connection status periodically
    const statusInterval = setInterval(handleConnectionStatus, 1000);

    // Initial data fetch
    fetchDashboardData();

    // Cleanup
    return () => {
      websocketService.off('transaction:new', handleNewTransaction);
      websocketService.off('alert:new', handleNewAlert);
      websocketService.off('dashboard:stats', handleDashboardStats);
      clearInterval(statusInterval);
      websocketService.disconnect();
    };
  }, [fetchDashboardData]);

  // Generate transaction volume data for the last 24 hours
  const generateTransactionVolumeData = () => {
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const hour = subHours(new Date(), i);
      hours.push(format(hour, 'HH:mm'));
    }

    return {
      labels: hours,
      datasets: [
        {
          label: 'Transactions per Hour',
          data: transactionVolumeData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    };
  };

  // Generate risk distribution data
  const generateRiskDistributionData = () => {
    const highRisk = recentTransactions.filter(t => 
      t.merchants?.risk_level && t.merchants.risk_level >= 75
    ).length;
    const mediumRisk = recentTransactions.filter(t => 
      t.merchants?.risk_level && t.merchants.risk_level >= 50 && t.merchants.risk_level < 75
    ).length;
    const lowRisk = recentTransactions.length - highRisk - mediumRisk;

    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [
        {
          data: [lowRisk, mediumRisk, highRisk],
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
  };

  // Generate alert trends data
  const generateAlertTrendsData = () => {
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const hour = subHours(new Date(), i);
      hours.push(format(hour, 'HH:mm'));
    }

    return {
      labels: hours,
      datasets: [
        {
          label: 'Alerts per Hour',
          data: alertTrendsData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
      ],
    };
  };

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
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600 capitalize">
                {connectionStatus === 'connected' ? 'Live' : connectionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{data?.totalTransactions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">{data?.totalAlerts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-semibold text-gray-900">{data?.highRiskTransactions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{data?.alertResolutionRate || '0'}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Transaction Volume Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume (24h)</h3>
            <Line
              data={generateTransactionVolumeData()}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>

          {/* Risk Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <Doughnut
              data={generateRiskDistributionData()}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Alert Trends Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Trends (24h)</h3>
          <Bar
            data={generateAlertTrendsData()}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {/* Recent Alerts Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAlerts.map((alert) => (
                  <tr key={alert.alert_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {alert.alert_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.risk_score >= 90 ? 'bg-red-100 text-red-800' :
                        alert.risk_score >= 75 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.risk_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                      {alert.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(alert.created_at), 'MMM dd, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 