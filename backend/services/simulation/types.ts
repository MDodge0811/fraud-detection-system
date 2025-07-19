// Transaction simulation types
export interface TransactionPattern {
  weight: number;
  minAmount?: number;
  maxAmount?: number;
  amounts?: number[];
}

export interface FraudPattern {
  type: string;
  multiplier: number;
  reason: string;
}

export interface SimulationResult {
  transaction: any;
  riskAnalysis: any;
  riskSignal: any;
  alert?: any;
  transactionNotes: string;
}

export interface SimulationStatus {
  isRunning: boolean;
  interval: number;
  description: string;
}

export interface DashboardStats {
  totalAlerts: number;
  openAlerts: number;
  totalTransactions: number;
  highRiskTransactions: number;
  alertResolutionRate: string;
}

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

// Database entity types that match Prisma's actual return types
export interface User {
  user_id: string;
  name: string;
  email: string;
  created_at?: Date | null;
  transactions?: Transaction[];
}

export interface Device {
  device_id: string;
  user_id: string | null;
  fingerprint: string;
  last_seen: Date | null;
}

export interface Merchant {
  merchant_id: string;
  name: string;
  category: string | null;
  risk_level: number | null;
}

export interface Transaction {
  transaction_id: string;
  user_id: string | null;
  device_id: string | null;
  merchant_id: string | null;
  amount: any; // Prisma Decimal type
  status: string | null;
  timestamp: Date | null;
  users?: User | null;
  merchants?: Merchant | null;
  devices?: Device | null;
}

export interface RiskSignal {
  signal_id: string;
  transaction_id: string | null;
  signal_type: string;
  risk_score: number;
  transactions?: Transaction | null;
}

export interface Alert {
  alert_id: string;
  transaction_id: string | null;
  risk_score: number;
  reason: string;
  status: string;
  transactions?: Transaction | null;
}

export interface TrainingData {
  data_id: string;
  transaction_id: string | null;
  features: Record<string, any>;
  label: number;
  created_at: Date | null;
}

// Type guards for safer type checking
export function isValidUser(user: any): user is User {
  return user && typeof user.user_id === 'string';
}

export function isValidDevice(device: any): device is Device {
  return device && typeof device.device_id === 'string';
}

export function isValidMerchant(merchant: any): merchant is Merchant {
  return merchant && typeof merchant.merchant_id === 'string';
}
