import React from 'react';
import styled from 'styled-components';
import { useDashboardStore } from '@/stores';

// Styled components
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
`;

const StatCard = styled.div`
  background-color: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: transform ${({ theme }) => theme.transitions.normal};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
`;

const IconContainer = styled.div<{ color: string }>`
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ color }) => color}20;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-right: ${({ theme }) => theme.spacing.md};
`;

const Icon = styled.svg<{ color: string }>`
  width: 1.5rem;
  height: 1.5rem;
  color: ${({ color }) => color};
`;

const StatInfo = styled.div``;

const StatLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatValue = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StatsCards: React.FC = () => {
  const stats = useDashboardStore(state => state.stats);

  return (
    <StatsGrid>
      <StatCard>
        <StatContent>
          <IconContainer color="#3b82f6">
            <Icon color="#3b82f6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </Icon>
          </IconContainer>
          <StatInfo>
            <StatLabel>Total Transactions</StatLabel>
            <StatValue>{stats?.totalTransactions || 0}</StatValue>
          </StatInfo>
        </StatContent>
      </StatCard>

      <StatCard>
        <StatContent>
          <IconContainer color="#ef4444">
            <Icon color="#ef4444" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </Icon>
          </IconContainer>
          <StatInfo>
            <StatLabel>Active Alerts</StatLabel>
            <StatValue>{stats?.totalAlerts || 0}</StatValue>
          </StatInfo>
        </StatContent>
      </StatCard>

      <StatCard>
        <StatContent>
          <IconContainer color="#f59e0b">
            <Icon color="#f59e0b" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </Icon>
          </IconContainer>
          <StatInfo>
            <StatLabel>High Risk</StatLabel>
            <StatValue>{stats?.highRiskTransactions || 0}</StatValue>
          </StatInfo>
        </StatContent>
      </StatCard>

      <StatCard>
        <StatContent>
          <IconContainer color="#10b981">
            <Icon color="#10b981" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </Icon>
          </IconContainer>
          <StatInfo>
            <StatLabel>Resolution Rate</StatLabel>
            <StatValue>{stats?.alertResolutionRate || '0'}%</StatValue>
          </StatInfo>
        </StatContent>
      </StatCard>
    </StatsGrid>
  );
};

export default StatsCards; 