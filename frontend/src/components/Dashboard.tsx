import React, { useEffect } from 'react';
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Chart as ChartJS,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import styled from 'styled-components';

// Import stores
import { useDashboardStore, useWebSocketStore } from '@/stores';

// Import components
import StatsCards from '@/components/StatsCards';
import ConnectionStatus from '@/components/ConnectionStatus';
import AlertsTable from '@/components/AlertsTable';
import TimeframeSelector from '@/components/TimeframeSelector';
import { TransactionVolumeChart, RiskDistributionChart, AlertTrendsChart } from '@/components/charts';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
);

const Dashboard: React.FC = () => {
  // Dashboard store
  const {
    loading,
    statsLoading,
    alertsLoading,
    chartsLoading,
    timeframe,
    changeTimeframe,
    fetchDashboardData,
    fetchChartData,
  } = useDashboardStore();

  // WebSocket store
  const { connect, disconnect, subscribeToEvents, unsubscribeFromEvents } = useWebSocketStore();

  // Handle timeframe change
  const handleTimeframeChange = async (newTimeframe: string) => {
    await changeTimeframe(newTimeframe as any);
  };

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      // Fetch initial data
      await Promise.all([
        fetchDashboardData(),
        fetchChartData(),
      ]);

      // Connect to WebSocket (will fallback to polling if WebSocket fails)
      await connect();

      // Subscribe to real-time events
      subscribeToEvents();
    };

    initializeDashboard();

    // Cleanup on unmount
    return () => {
      unsubscribeFromEvents();
      disconnect();
    };
  }, [fetchDashboardData, fetchChartData, connect, disconnect, subscribeToEvents, unsubscribeFromEvents]);

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardContent>
        {/* Header with connection status and timeframe selector */}
        <Header>
          <HeaderContent>
            <HeaderText>
              <Title>Fraud Detection Dashboard</Title>
              <Subtitle>Real-time monitoring of transactions and fraud alerts</Subtitle>
            </HeaderText>
            <HeaderControls>
              <TimeframeSelector
                timeframe={timeframe}
                onTimeframeChange={handleTimeframeChange}
                disabled={loading}
              />
              <ConnectionStatus />
            </HeaderControls>
          </HeaderContent>
        </Header>

        {/* Stats Cards */}
        <StatsCards loading={statsLoading} />

        {/* Charts Grid */}
        <ChartsGrid>
          <TransactionVolumeChart loading={chartsLoading} />
          <RiskDistributionChart loading={chartsLoading} />
        </ChartsGrid>

        {/* Alert Trends Chart */}
        <AlertTrendsChart loading={chartsLoading} />

        {/* Recent Alerts Table */}
        <AlertsTable loading={alertsLoading} />
      </DashboardContent>
    </DashboardContainer>
  );
};

export default Dashboard;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const DashboardContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const HeaderText = styled.div``;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const LoadingSpinner = styled.div`
  width: 8rem;
  height: 8rem;
  border: 2px solid ${({ theme }) => theme.colors.border.primary};
  border-top: 2px solid ${({ theme }) => theme.colors.status.info};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
