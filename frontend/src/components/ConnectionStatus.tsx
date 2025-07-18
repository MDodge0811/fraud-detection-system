import React from 'react';
import styled from 'styled-components';
import { useDashboardStore } from '@/stores';

const ConnectionStatus: React.FC = () => {
  const connectionStatus = useDashboardStore(state => state.connectionStatus);

  return (
    <StatusContainer>
      <StatusDot status={connectionStatus} />
      <StatusText>
        {connectionStatus === 'connected' ? 'Live' : connectionStatus}
      </StatusText>
    </StatusContainer>
  );
};

export default ConnectionStatus;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StatusDot = styled.div<{ status: string }>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: ${({ status, theme }) => {
    switch (status) {
      case 'connected': return theme.colors.status.success;
      case 'connecting': return theme.colors.status.warning;
      default: return theme.colors.status.error;
    }
  }};
`;

const StatusText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: capitalize;
`;
