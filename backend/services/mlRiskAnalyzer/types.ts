// ML Feature interfaces
export interface MLFeatures {
  // Basic features (normalized 0-1)
  normalizedAmount: number;
  normalizedDeviceAge: number;
  normalizedMerchantRisk: number;
  normalizedFrequency: number;
  normalizedAvgAmount: number;

  // Advanced features
  timeOfDay: number; // 0-23 hour
  dayOfWeek: number; // 0-6 (Sunday = 0)
  amountVelocity: number; // Rate of change in transaction amounts
  locationAnomaly: number; // Geographic risk (0-1)
  deviceFingerprintRisk: number; // Device reputation (0-1)
  userBehaviorScore: number; // Historical user patterns (0-1)
  merchantCategoryRisk: number; // Category-based risk (0-1)
  transactionPatternRisk: number; // Pattern matching (0-1)

  // Raw values for debugging
  raw: {
    amount: number;
    deviceAge: number;
    merchantRisk: number;
    recentTransactions: number;
    avgUserAmount: number;
    hour: number;
    day: number;
    userTransactionCount: number;
    userTotalSpent: number;
    deviceTransactionCount: number;
    merchantTransactionCount: number;
  };
}

export interface RiskAnalysisResult {
  riskScore: number;
  features: MLFeatures;
  reasons: string[];
  mlConfidence: number;
}

export interface ModelStats {
  isTrained: boolean;
  lastTrained: Date | null;
  accuracy: number | null;
  trainingSamples: number;
}

export interface RiskModel {
  train(features: number[][], labels: number[]): void;
  predict(features: number[]): number;
  save(): any;
  load(modelData: any): void;
}

export interface FeatureExtractor {
  extractFeatures(
    transactionId: string,
    userId: string,
    deviceId: string,
    merchantId: string,
    amount: number,
  ): Promise<MLFeatures>;
}

export interface TrainingDataService {
  saveTrainingData(features: MLFeatures, label: number): Promise<void>;
  getTrainingData(): Promise<any[]>;
  getTrainingDataCount(): Promise<number>;
}
