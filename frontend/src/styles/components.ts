import styled from 'styled-components';

// Container components
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.md};
`;

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

export const Grid = styled.div<{ columns?: number; gap?: string }>`
  display: grid;
  grid-template-columns: repeat(${({ columns = 1 }) => columns}, 1fr);
  gap: ${({ gap, theme }) => gap || theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

export const Flex = styled.div<{
  direction?: 'row' | 'column';
  justify?: string;
  align?: string;
  gap?: string;
  wrap?: boolean;
}>`
  display: flex;
  flex-direction: ${({ direction = 'row' }) => direction};
  justify-content: ${({ justify = 'flex-start' }) => justify};
  align-items: ${({ align = 'stretch' }) => align};
  gap: ${({ gap, theme }) => gap || theme.spacing.md};
  flex-wrap: ${({ wrap }) => wrap ? 'wrap' : 'nowrap'};
`;

// Button components
export const Button = styled.button<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ size, theme }) => {
    switch (size) {
      case 'sm': return `${theme.spacing.sm} ${theme.spacing.md}`;
      case 'lg': return `${theme.spacing.md} ${theme.spacing.xl}`;
      default: return `${theme.spacing.md} ${theme.spacing.lg}`;
    }
  }};
  font-size: ${({ size, theme }) => {
    switch (size) {
      case 'sm': return theme.typography.fontSizes.sm;
      case 'lg': return theme.typography.fontSizes.lg;
      default: return theme.typography.fontSizes.base;
    }
  }};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid transparent;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all ${({ theme }) => theme.transitions.normal};
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  
  background-color: ${({ variant, theme }) => {
    switch (variant) {
      case 'secondary': return theme.colors.button.secondary;
      case 'danger': return theme.colors.button.danger;
      case 'success': return theme.colors.button.success;
      default: return theme.colors.button.primary;
    }
  }};
  
  color: ${({ theme }) => theme.colors.text.primary};
  
  &:hover:not(:disabled) {
    background-color: ${({ variant, theme }) => {
    switch (variant) {
      case 'secondary': return theme.colors.button.secondaryHover;
      case 'danger': return theme.colors.button.dangerHover;
      case 'success': return theme.colors.button.successHover;
      default: return theme.colors.button.primaryHover;
    }
  }};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

// Text components
export const Heading = styled.h1<{ level?: 1 | 2 | 3 | 4 | 5 | 6 }>`
  font-size: ${({ level, theme }) => {
    switch (level) {
      case 1: return theme.typography.fontSizes['4xl'];
      case 2: return theme.typography.fontSizes['3xl'];
      case 3: return theme.typography.fontSizes['2xl'];
      case 4: return theme.typography.fontSizes.xl;
      case 5: return theme.typography.fontSizes.lg;
      case 6: return theme.typography.fontSizes.base;
      default: return theme.typography.fontSizes['2xl'];
    }
  }};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
`;

export const Text = styled.p<{
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted';
}>`
  font-size: ${({ size, theme }) => theme.typography.fontSizes[size || 'base']};
  font-weight: ${({ weight, theme }) => theme.typography.fontWeights[weight || 'normal']};
  color: ${({ color, theme }) => {
    switch (color) {
      case 'secondary': return theme.colors.text.secondary;
      case 'muted': return theme.colors.text.muted;
      default: return theme.colors.text.primary;
    }
  }};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

// Badge component
export const Badge = styled.span<{
  variant?: 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}>`
  display: inline-flex;
  align-items: center;
  padding: ${({ size, theme }) => {
    switch (size) {
      case 'sm': return `${theme.spacing.xs} ${theme.spacing.sm}`;
      case 'lg': return `${theme.spacing.sm} ${theme.spacing.md}`;
      default: return `${theme.spacing.xs} ${theme.spacing.md}`;
    }
  }};
  font-size: ${({ size, theme }) => {
    switch (size) {
      case 'sm': return theme.typography.fontSizes.xs;
      case 'lg': return theme.typography.fontSizes.base;
      default: return theme.typography.fontSizes.sm;
    }
  }};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ variant, theme }) => {
    switch (variant) {
      case 'success': return theme.colors.status.success;
      case 'warning': return theme.colors.status.warning;
      case 'error': return theme.colors.status.error;
      case 'info': return theme.colors.status.info;
      default: return theme.colors.status.info;
    }
  }};
  color: ${({ theme }) => theme.colors.text.primary};
`;

// Table components
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: ${({ theme }) => theme.colors.background.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

export const TableHead = styled.thead`
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

export const TableBody = styled.tbody``;

export const TableRow = styled.tr<{ hover?: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  &:last-child {
    border-bottom: none;
  }
  
  ${({ hover, theme }) => hover && `
    &:hover {
      background-color: ${theme.colors.background.tertiary};
    }
  `}
`;

export const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  vertical-align: middle;
`;

export const TableHeader = styled.th`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

// Input components
export const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.base};
  transition: border-color ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.border.accent}20;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.base};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.border.accent}20;
  }
  
  option {
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;
