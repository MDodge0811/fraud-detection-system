import React from 'react';
import styled from 'styled-components';
import { Doughnut } from 'react-chartjs-2';
import { useDashboardStore } from '@/stores';

const RiskDistributionChart: React.FC = () => {
  const getRiskDistributionData = useDashboardStore(state => state.getRiskDistributionData);

  return (
    <ChartContainer>
      <ChartTitle>Risk Distribution (All Time)</ChartTitle>
      <Doughnut
        data={getRiskDistributionData()}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: {
                color: '#f8fafc',
                font: {
                  size: 12,
                },
              },
            },
          },
        }}
      />
    </ChartContainer>
  );
};

export default RiskDistributionChart;

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
