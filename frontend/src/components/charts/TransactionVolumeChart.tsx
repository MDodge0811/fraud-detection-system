import React from 'react';
import styled from 'styled-components';
import { Line } from 'react-chartjs-2';
import { useDashboardStore } from '@/stores';

interface TransactionVolumeChartProps {
  loading?: boolean;
}

const TransactionVolumeChart: React.FC<TransactionVolumeChartProps> = ({ loading = false }) => {
  const { getTransactionVolumeChartData, timeframe } = useDashboardStore();

  if (loading) {
    return (
      <ChartContainer>
        <ChartTitle>Transaction Volume ({timeframe})</ChartTitle>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading transaction data...</LoadingText>
        </LoadingContainer>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer>
      <ChartTitle>Transaction Volume ({timeframe})</ChartTitle>
      <Line
        data={getTransactionVolumeChartData()}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top' as const,
              labels: {
                color: '#f8fafc',
                font: {
                  size: 12,
                },
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: '#cbd5e1',
              },
              grid: {
                color: '#334155',
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#cbd5e1',
              },
              grid: {
                color: '#334155',
              },
            },
          },
        }}
      />
    </ChartContainer>
  );
};

export default TransactionVolumeChart;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ChartContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: ${({ theme }) => theme.spacing.md};
`;

const LoadingSpinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 2px solid ${({ theme }) => theme.colors.border.primary};
  border-top: 2px solid ${({ theme }) => theme.colors.status.info};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;
