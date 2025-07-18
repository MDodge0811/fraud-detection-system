import React from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { useDashboardStore } from '@/stores';

const AlertsTable: React.FC = () => {
  const {
    getPaginatedAlerts,
    getAlertsPageInfo,
    nextAlertsPage,
    prevAlertsPage,
    setAlertsPage,
  } = useDashboardStore();

  const paginatedAlerts = getPaginatedAlerts();
  const { currentPage, totalPages, totalAlerts } = getAlertsPageInfo();

  const getRiskLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 90) return 'high';
    if (score >= 75) return 'medium';
    return 'low';
  };

  return (
    <TableContainer>
      <TableHeader>
        <HeaderContent>
          <TableTitle>Recent Alerts</TableTitle>
          <TableInfo>
              Showing {((currentPage - 1) * 10) + 1} to{' '}
            {Math.min(currentPage * 10, totalAlerts)} of {totalAlerts} alerts
          </TableInfo>
        </HeaderContent>
      </TableHeader>

      <TableWrapper>
        <StyledTable>
          <TableHead>
            <tr>
              <TableHeaderCell>Alert ID</TableHeaderCell>
              <TableHeaderCell>Risk Score</TableHeaderCell>
              <TableHeaderCell>Reason</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {paginatedAlerts.map((alert) => (
              <TableRow key={alert.alert_id}>
                <TableCell>
                  {alert.alert_id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <RiskBadge riskLevel={getRiskLevel(alert.risk_score)}>
                    {alert.risk_score}%
                  </RiskBadge>
                </TableCell>
                <TableCellText>
                  {alert.reason}
                </TableCellText>
                <TableCell>
                  <StatusBadge status={alert.status}>
                    {alert.status}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  {format(new Date(alert.created_at), 'MMM dd, HH:mm')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableWrapper>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <PaginationContainer>
          <PaginationContent>
            <PaginationInfo>
              Page {currentPage} of {totalPages}
            </PaginationInfo>
            <PaginationControls>
              <PaginationButton
                variant="secondary"
                onClick={prevAlertsPage}
                disabled={currentPage === 1}
              >
                Previous
              </PaginationButton>

              {/* Page numbers */}
              <PageNumbers>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationButton
                      key={pageNum}
                      variant={pageNum === currentPage ? 'primary' : undefined}
                      onClick={() => setAlertsPage(pageNum)}
                    >
                      {pageNum}
                    </PaginationButton>
                  );
                })}
                {totalPages > 5 && (
                  <Ellipsis>...</Ellipsis>
                )}
              </PageNumbers>

              <PaginationButton
                variant="secondary"
                onClick={nextAlertsPage}
                disabled={currentPage === totalPages}
              >
                Next
              </PaginationButton>
            </PaginationControls>
          </PaginationContent>
        </PaginationContainer>
      )}
    </TableContainer>
  );
};

export default AlertsTable;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const TableContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TableTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TableInfo = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

const TableHeaderCell = styled.th`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  text-align: left;
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.tertiary};
  }
`;

const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
`;

const TableCellText = styled.td`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RiskBadge = styled.span<{ riskLevel: 'high' | 'medium' | 'low' }>`
  display: inline-flex;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ riskLevel, theme }) => {
    switch (riskLevel) {
      case 'high': return `${theme.colors.risk.high}20`;
      case 'medium': return `${theme.colors.risk.medium}20`;
      default: return `${theme.colors.risk.low}20`;
    }
  }};
  color: ${({ riskLevel, theme }) => {
    switch (riskLevel) {
      case 'high': return theme.colors.risk.high;
      case 'medium': return theme.colors.risk.medium;
      default: return theme.colors.risk.low;
    }
  }};
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-flex;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ status, theme }) =>
    status === 'open' ? `${theme.colors.status.error}20` : `${theme.colors.status.success}20`
};
  color: ${({ status, theme }) =>
    status === 'open' ? theme.colors.status.error : theme.colors.status.success
};
`;

const PaginationContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const PaginationContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PaginationInfo = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PaginationButton = styled.button<{ variant?: 'primary' | 'secondary'; disabled?: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: none;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  background-color: ${({ variant, theme }) => {
    switch (variant) {
      case 'primary': return theme.colors.status.success;
      case 'secondary': return theme.colors.status.error;
      default: return theme.colors.button.primary;
    }
  }};
  color: ${({ theme }) => theme.colors.text.primary};
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const PageNumbers = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Ellipsis = styled.span`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;
