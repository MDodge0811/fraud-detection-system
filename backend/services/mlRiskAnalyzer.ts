import { prisma } from '../prisma/client';
import * as ML from 'ml';

// Enhanced feature extraction with more sophisticated patterns
interface MLFeatures {
  // Basic features
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

// ML Model interface
interface RiskModel {
  predict: (features: number[]) => number;
  train: (features: number[][], labels: number[]) => void;
  save: () => any;
  load: (model: any) => void;
}

class EnhancedRiskModel implements RiskModel {
  private model: any;
  private isTrained: boolean = false;

  constructor() {
    this.model = new ML.Classification.LogisticRegression({
      numSteps: 1000,
      learningRate: 0.1,
      regularization: 0.01,
    });
  }

  train(features: number[][], labels: number[]): void {
    if (features.length === 0 || labels.length === 0) {
      console.warn('No training data provided');
      return;
    }

    try {
      this.model.train(features, labels);
      this.isTrained = true;
      console.log(`Trained model with ${features.length} samples`);
    } catch (error) {
      console.error('Error training model:', error);
    }
  }

  predict(features: number[]): number {
    if (!this.isTrained) {
      return 0.5; // Default risk score
    }

    try {
      const prediction = this.model.predict(features);
      return Math.max(0, Math.min(1, prediction)); // Ensure 0-1 range
    } catch (error) {
      console.error('Error predicting risk:', error);
      return 0.5;
    }
  }

  save(): any {
    return this.model.toJSON();
  }

  load(model: any): void {
    try {
      this.model = ML.Classification.LogisticRegression.load(model);
      this.isTrained = true;
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }
}

// Global model instance
let riskModel: EnhancedRiskModel | null = null;

// Initialize the ML model
async function initializeModel(): Promise<void> {
  if (riskModel) return;

  riskModel = new EnhancedRiskModel();
  
  // Try to load existing model from database
  try {
    const savedModel = await prisma.ml_models.findFirst({
      where: { model_type: 'risk_analyzer' },
      orderBy: { created_at: 'desc' },
    });

    if (savedModel && savedModel.model_data) {
      riskModel.load(savedModel.model_data);
      console.log('Loaded existing ML model');
    } else {
      console.log('No existing model found, will train new model');
    }
  } catch (error) {
    console.error('Error loading model:', error);
  }
}

// Enhanced feature extraction
async function extractMLFeatures(
  transactionId: string,
  userId: string,
  deviceId: string,
  merchantId: string,
  amount: number,
): Promise<MLFeatures> {
  try {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Basic features (existing logic)
    const merchant = await prisma.merchants.findUnique({
      where: { merchant_id: merchantId },
      include: { category: true },
    });
    const merchantRisk = merchant?.risk_level || 50;

    const device = await prisma.devices.findUnique({
      where: { device_id: deviceId },
    });
    const deviceAge = device ?
      Math.floor((Date.now() - new Date(device.last_seen || Date.now()).getTime()) / (1000 * 60 * 60)) :
      0;

    // Transaction frequency
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTransactions = await prisma.transactions.count({
      where: {
        user_id: userId,
        timestamp: { gte: fiveMinutesAgo },
      },
    });

    // User behavior analysis
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const userTransactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        timestamp: { gte: twentyFourHoursAgo },
      },
      orderBy: { timestamp: 'desc' },
    });

    const avgUserAmount = userTransactions.length > 0 ?
      userTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0) / userTransactions.length :
      0;

    // Advanced features
    const timeOfDay = hour / 24; // Normalize to 0-1
    const dayOfWeek = day / 7; // Normalize to 0-1

    // Amount velocity (rate of change)
    const recentAmounts = userTransactions.slice(0, 5).map(tx => Number(tx.amount));
    const amountVelocity = recentAmounts.length > 1 ?
      Math.abs(recentAmounts[0] - recentAmounts[recentAmounts.length - 1]) / recentAmounts[recentAmounts.length - 1] :
      0;

    // Location anomaly (simplified - in real app, would use IP geolocation)
    const locationAnomaly = 0.1; // Placeholder

    // Device fingerprint risk
    const deviceTransactions = await prisma.transactions.count({
      where: { device_id: deviceId },
    });
    const deviceFingerprintRisk = deviceTransactions < 5 ? 0.8 : 0.2;

    // User behavior score
    const userTransactionCount = await prisma.transactions.count({
      where: { user_id: userId },
    });
    const userTotalSpent = await prisma.transactions.aggregate({
      where: { user_id: userId },
      _sum: { amount: true },
    });
    const userBehaviorScore = userTransactionCount < 10 ? 0.7 : 0.3;

    // Merchant category risk
    const merchantCategoryRisk = merchant?.category?.risk_level || 0.5;

    // Transaction pattern risk
    const patternRisk = calculatePatternRisk(userTransactions, amount);

    // Normalize all features
    const normalizedAmount = Math.min(amount / 10000, 1);
    const normalizedDeviceAge = Math.min(deviceAge / 24, 1);
    const normalizedMerchantRisk = merchantRisk / 100;
    const normalizedFrequency = Math.min(recentTransactions / 10, 1);
    const normalizedAvgAmount = Math.min(avgUserAmount / 5000, 1);
    const normalizedAmountVelocity = Math.min(amountVelocity, 1);
    const normalizedDeviceFingerprintRisk = deviceFingerprintRisk;
    const normalizedUserBehaviorScore = userBehaviorScore;
    const normalizedMerchantCategoryRisk = merchantCategoryRisk / 100;
    const normalizedTransactionPatternRisk = patternRisk;

    return {
      normalizedAmount,
      normalizedDeviceAge,
      normalizedMerchantRisk,
      normalizedFrequency,
      normalizedAvgAmount,
      timeOfDay,
      dayOfWeek,
      amountVelocity: normalizedAmountVelocity,
      locationAnomaly,
      deviceFingerprintRisk: normalizedDeviceFingerprintRisk,
      userBehaviorScore: normalizedUserBehaviorScore,
      merchantCategoryRisk: normalizedMerchantCategoryRisk,
      transactionPatternRisk: normalizedTransactionPatternRisk,
      raw: {
        amount,
        deviceAge,
        merchantRisk,
        recentTransactions,
        avgUserAmount,
        hour,
        day,
        userTransactionCount,
        userTotalSpent: userTotalSpent._sum.amount || 0,
        deviceTransactionCount: deviceTransactions,
        merchantTransactionCount: 0, // Would need to calculate
      },
    };
  } catch (error) {
    console.error('Error extracting ML features:', error);
    return getDefaultFeatures(amount);
  }
}

// Calculate pattern-based risk
function calculatePatternRisk(transactions: any[], currentAmount: number): number {
  if (transactions.length < 3) return 0.5;

  // Check for unusual patterns
  const amounts = transactions.map(tx => Number(tx.amount));
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
  );

  // Z-score for current amount
  const zScore = Math.abs((currentAmount - avgAmount) / stdDev);
  
  // High z-score indicates unusual amount
  if (zScore > 2) return 0.8;
  if (zScore > 1.5) return 0.6;
  return 0.3;
}

// Get default features for error cases
function getDefaultFeatures(amount: number): MLFeatures {
  return {
    normalizedAmount: Math.min(amount / 10000, 1),
    normalizedDeviceAge: 0,
    normalizedMerchantRisk: 0.5,
    normalizedFrequency: 0,
    normalizedAvgAmount: 0,
    timeOfDay: 0.5,
    dayOfWeek: 0.5,
    amountVelocity: 0,
    locationAnomaly: 0.1,
    deviceFingerprintRisk: 0.5,
    userBehaviorScore: 0.5,
    merchantCategoryRisk: 0.5,
    transactionPatternRisk: 0.5,
    raw: {
      amount,
      deviceAge: 0,
      merchantRisk: 50,
      recentTransactions: 0,
      avgUserAmount: 0,
      hour: 12,
      day: 0,
      userTransactionCount: 0,
      userTotalSpent: 0,
      deviceTransactionCount: 0,
      merchantTransactionCount: 0,
    },
  };
}

// Convert features to ML input array
function featuresToMLInput(features: MLFeatures): number[] {
  return [
    features.normalizedAmount,
    features.normalizedDeviceAge,
    features.normalizedMerchantRisk,
    features.normalizedFrequency,
    features.normalizedAvgAmount,
    features.timeOfDay,
    features.dayOfWeek,
    features.amountVelocity,
    features.locationAnomaly,
    features.deviceFingerprintRisk,
    features.userBehaviorScore,
    features.merchantCategoryRisk,
    features.transactionPatternRisk,
  ];
}

// Enhanced risk analysis with ML
export async function analyzeTransactionRiskML(
  transactionId: string,
  userId: string,
  deviceId: string,
  merchantId: string,
  amount: number,
): Promise<{ riskScore: number; features: MLFeatures; reasons: string[]; mlConfidence: number }> {
  try {
    // Initialize model if needed
    await initializeModel();

    // Extract features
    const features = await extractMLFeatures(transactionId, userId, deviceId, merchantId, amount);

    // Get ML prediction
    const mlInput = featuresToMLInput(features);
    const mlPrediction = riskModel?.predict(mlInput) || 0.5;

    // Combine ML prediction with rule-based scoring
    const ruleBasedScore = calculateRuleBasedScore(features);
    const mlConfidence = calculateMLConfidence(features);
    
    // Weighted combination (ML gets higher weight if confident)
    const finalScore = (mlPrediction * mlConfidence + ruleBasedScore * (1 - mlConfidence)) * 100;

    // Generate risk reasons
    const reasons = generateRiskReasons(features, mlPrediction);

    // Save training data for future model updates
    await saveTrainingData(features, mlPrediction > 0.7 ? 1 : 0);

    return {
      riskScore: Math.round(finalScore),
      features,
      reasons,
      mlConfidence: Math.round(mlConfidence * 100),
    };
  } catch (error) {
    console.error('Error in ML risk analysis:', error);
    return {
      riskScore: 50,
      features: getDefaultFeatures(amount),
      reasons: ['ML analysis failed - using fallback'],
      mlConfidence: 0,
    };
  }
}

// Rule-based scoring as fallback
function calculateRuleBasedScore(features: MLFeatures): number {
  const weights = {
    amount: 0.25,
    deviceAge: 0.15,
    merchantRisk: 0.30,
    frequency: 0.20,
    avgAmount: 0.10,
  };

  let score = 
    features.normalizedAmount * weights.amount +
    features.normalizedDeviceAge * weights.deviceAge +
    features.normalizedMerchantRisk * weights.merchantRisk +
    features.normalizedFrequency * weights.frequency +
    features.normalizedAvgAmount * weights.avgAmount;

  // Apply risk multipliers
  if (features.deviceFingerprintRisk > 0.7) score *= 1.3;
  if (features.userBehaviorScore > 0.7) score *= 1.2;
  if (features.transactionPatternRisk > 0.7) score *= 1.4;

  return Math.min(score, 1);
}

// Calculate ML confidence based on feature quality
function calculateMLConfidence(features: MLFeatures): number {
  let confidence = 0.5; // Base confidence

  // Higher confidence if we have good user history
  if (features.raw.userTransactionCount > 20) confidence += 0.2;
  if (features.raw.deviceTransactionCount > 10) confidence += 0.1;
  if (features.raw.userTransactionCount > 50) confidence += 0.1;

  // Lower confidence for new users/devices
  if (features.raw.userTransactionCount < 5) confidence -= 0.2;
  if (features.raw.deviceTransactionCount < 3) confidence -= 0.1;

  return Math.max(0.1, Math.min(1, confidence));
}

// Generate risk reasons
function generateRiskReasons(features: MLFeatures, mlPrediction: number): string[] {
  const reasons: string[] = [];

  if (features.raw.merchantRisk > 80) {
    reasons.push(`High-risk merchant (${features.raw.merchantRisk}%)`);
  }

  if (features.raw.recentTransactions > 5) {
    reasons.push(`High transaction frequency (${features.raw.recentTransactions} in 5 min)`);
  }

  if (features.raw.deviceAge < 1) {
    reasons.push(`New device (${features.raw.deviceAge} hours old)`);
  }

  if (features.deviceFingerprintRisk > 0.7) {
    reasons.push('Suspicious device fingerprint');
  }

  if (features.userBehaviorScore > 0.7) {
    reasons.push('Unusual user behavior pattern');
  }

  if (features.transactionPatternRisk > 0.7) {
    reasons.push('Unusual transaction pattern detected');
  }

  if (mlPrediction > 0.8) {
    reasons.push('ML model indicates high fraud probability');
  }

  if (features.normalizedAmount > 0.8) {
    reasons.push(`High transaction amount ($${features.raw.amount})`);
  }

  return reasons;
}

// Save training data for model updates
async function saveTrainingData(features: MLFeatures, label: number): Promise<void> {
  try {
    await prisma.training_data.create({
      data: {
        features: featuresToMLInput(features),
        label,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error saving training data:', error);
  }
}

// Train model with accumulated data
export async function trainModel(): Promise<void> {
  try {
    await initializeModel();
    if (!riskModel) return;

    // Get training data
    const trainingData = await prisma.training_data.findMany({
      orderBy: { created_at: 'desc' },
      take: 1000, // Use last 1000 samples
    });

    if (trainingData.length < 100) {
      console.log('Insufficient training data, need at least 100 samples');
      return;
    }

    const features = trainingData.map(td => td.features as number[]);
    const labels = trainingData.map(td => td.label);

    // Train model
    riskModel.train(features, labels);

    // Save updated model
    const modelData = riskModel.save();
    await prisma.ml_models.create({
      data: {
        model_type: 'risk_analyzer',
        model_data: modelData,
        version: '1.0',
        accuracy: calculateModelAccuracy(features, labels),
        created_at: new Date(),
      },
    });

    console.log(`Model trained successfully with ${trainingData.length} samples`);
  } catch (error) {
    console.error('Error training model:', error);
  }
}

// Calculate model accuracy
function calculateModelAccuracy(features: number[][], labels: number[]): number {
  if (!riskModel || features.length === 0) return 0;

  let correct = 0;
  for (let i = 0; i < features.length; i++) {
    const prediction = riskModel.predict(features[i]);
    const predictedLabel = prediction > 0.5 ? 1 : 0;
    if (predictedLabel === labels[i]) correct++;
  }

  return correct / features.length;
}

// Get model statistics
export async function getModelStats(): Promise<{
  isTrained: boolean;
  lastTrained: Date | null;
  accuracy: number | null;
  trainingSamples: number;
}> {
  try {
    const latestModel = await prisma.ml_models.findFirst({
      where: { model_type: 'risk_analyzer' },
      orderBy: { created_at: 'desc' },
    });

    const trainingSamples = await prisma.training_data.count();

    return {
      isTrained: !!latestModel,
      lastTrained: latestModel?.created_at || null,
      accuracy: latestModel?.accuracy || null,
      trainingSamples,
    };
  } catch (error) {
    console.error('Error getting model stats:', error);
    return {
      isTrained: false,
      lastTrained: null,
      accuracy: null,
      trainingSamples: 0,
    };
  }
} 