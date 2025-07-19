// Risk analysis types
export interface TransactionFeatures {
  normalizedAmount: number;
  normalizedDeviceAge: number;
  normalizedMerchantRisk: number;
  normalizedFrequency: number;
  normalizedAvgAmount: number;
  raw: {
    amount: number;
    deviceAge: number;
    merchantRisk: number;
    recentTransactions: number;
    avgUserAmount: number;
  };
}

export interface RiskAnalysisResult {
  riskScore: number;
  features: TransactionFeatures;
  reasons: string[];
  riskLevel: string;
  riskColor: string;
}

export interface RiskMultiplier {
  name: string;
  value: number;
  reason: string;
}

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Very Low';

// Database interfaces for better type safety
export interface Merchant {
  merchant_id: string;
  risk_level: number;
}

export interface Device {
  device_id: string;
  last_seen: Date | null;
}

export interface Transaction {
  amount: string;
  timestamp: Date;
}
