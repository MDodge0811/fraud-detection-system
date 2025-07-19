import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import Dashboard from '@/components/Dashboard';

// Mock all child components
vi.mock('@/components/StatsCards', () => ({
  default: () => <div data-testid="stats-cards">Stats Cards</div>,
}));

vi.mock('@/components/ConnectionStatus', () => ({
  default: () => <div data-testid="connection-status">Connection Status</div>,
}));

vi.mock('@/components/AlertsTable', () => ({
  default: () => <div data-testid="alerts-table">Alerts Table</div>,
}));

vi.mock('@/components/charts', () => ({
  TransactionVolumeChart: () => <div data-testid="transaction-volume-chart">Transaction Volume Chart</div>,
  RiskDistributionChart: () => <div data-testid="risk-distribution-chart">Risk Distribution Chart</div>,
  AlertTrendsChart: () => <div data-testid="alert-trends-chart">Alert Trends Chart</div>,
}));

// Mock the stores
vi.mock('@/stores', () => ({
  useDashboardStore: vi.fn((selector) => {
    const state = {
      connectionStatus: 'connected',
      stats: null,
      recentAlerts: [],
      loading: false,
      alertsPage: 1,
      alertsPerPage: 10,
      setConnectionStatus: vi.fn(),
      setStats: vi.fn(),
      setRecentAlerts: vi.fn(),
      addAlert: vi.fn(),
      setLoading: vi.fn(),
      setAlertsPage: vi.fn(),
      nextAlertsPage: vi.fn(),
      prevAlertsPage: vi.fn(),
      initializeChartData: vi.fn(),
      updateTransactionData: vi.fn(),
      updateAlertData: vi.fn(),
      getTransactionVolumeData: vi.fn(() => ({ labels: [], datasets: [] })),
      getRiskDistributionData: vi.fn(() => ({ labels: [], datasets: [] })),
      getAlertTrendsData: vi.fn(() => ({ labels: [], datasets: [] })),
      getPaginatedAlerts: vi.fn(() => []),
      getAlertsPageInfo: vi.fn(() => ({ currentPage: 1, totalPages: 1, totalAlerts: 0 })),
      fetchDashboardData: vi.fn(),
    };

    // If selector is provided, call it with the state
    if (typeof selector === 'function') {
      return selector(state);
    }

    // Otherwise return the state object
    return state;
  }),
  useWebSocketStore: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribeToEvents: vi.fn(),
    unsubscribeFromEvents: vi.fn(),
  }),
}));

// Test wrapper with theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />, { wrapper: TestWrapper });
    expect(screen.getByText('Fraud Detection Dashboard')).toBeInTheDocument();
  });

  it('renders dashboard subtitle', () => {
    render(<Dashboard />, { wrapper: TestWrapper });
    expect(screen.getByText('Real-time monitoring of transactions and fraud alerts')).toBeInTheDocument();
  });

  it('renders all dashboard components', () => {
    render(<Dashboard />, { wrapper: TestWrapper });

    expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    expect(screen.getByTestId('alerts-table')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-volume-chart')).toBeInTheDocument();
    expect(screen.getByTestId('risk-distribution-chart')).toBeInTheDocument();
    expect(screen.getByTestId('alert-trends-chart')).toBeInTheDocument();
  });
});
