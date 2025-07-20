import React from 'react';
import styled from 'styled-components';

export type Timeframe = '1h' | '6h' | '12h' | '24h' | '7d' | '30d' | 'all';

interface TimeframeSelectorProps {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  disabled?: boolean;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe,
  onTimeframeChange,
  disabled = false,
}) => {
  const timeframes: Array<{ value: Timeframe; label: string }> = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '12h', label: '12 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <Container>
      <Label>Timeframe:</Label>
      <ButtonGroup>
        {timeframes.map((tf) => (
          <TimeframeButton
            key={tf.value}
            $active={timeframe === tf.value}
            $disabled={disabled}
            onClick={() => !disabled && onTimeframeChange(tf.value)}
            disabled={disabled}
          >
            {tf.label}
          </TimeframeButton>
        ))}
      </ButtonGroup>
    </Container>
  );
};

export default TimeframeSelector;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  white-space: nowrap;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const TimeframeButton = styled.button<{ $active: boolean; $disabled: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border: 1px solid ${({ theme, $active }) =>
    $active ? theme.colors.status.info : theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme, $active, $disabled }) => {
    if ($disabled) return theme.colors.background.secondary;
    return $active ? theme.colors.status.info : theme.colors.background.primary;
  }};
  color: ${({ theme, $active, $disabled }) => {
    if ($disabled) return theme.colors.text.secondary;
    return $active ? theme.colors.text.inverse : theme.colors.text.primary;
  }};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.typography.fontWeights.semibold : theme.typography.fontWeights.normal};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: ${({ theme, $active }) =>
      $active ? theme.colors.status.info : theme.colors.background.secondary};
    border-color: ${({ theme, $active }) =>
      $active ? theme.colors.status.info : theme.colors.border.secondary};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.status.info};
    outline-offset: 2px;
  }
`; 
