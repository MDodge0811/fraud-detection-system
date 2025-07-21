import React from 'react';
import styled from 'styled-components';
import { Bar } from 'react-chartjs-2';
import { useDashboardStore } from '@/stores';

const AlertTrendsChart: React.FC = () => {
  const { getAlertTrendsChartData, timeframe } = useDashboardStore();

  return (
    <ChartContainer>
      <ChartTitle>Alert Trends ({timeframe})</ChartTitle>
      <Bar
        data={getAlertTrendsChartData()}
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

export default AlertTrendsChart;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ChartContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;
