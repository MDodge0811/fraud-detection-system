import { prisma } from '../prisma/client';
import { PolynomialRegression } from 'ml-regression-polynomial';

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

// Polynomial Regression Model interface
interface RiskModel {
  predict: (features: number[]) => number;
  train: (features: number[][], labels: number[]) => void;
  save: () => any;
  load: (model: any) => void;
}

class PolynomialRiskModel implements RiskModel {
  private model: PolynomialRegression | null = null;
  private isTrained: boolean = false;
  private degree: number = 3; // Polynomial degree

  constructor() {
    // Model will be initialized when we have training data
  }

  train(features: number[][], labels: number[]): void {
    if (features.length === 0 || labels.length === 0) {
      console.warn('No training data provided');
      return;
    }

    try {
      // For polynomial regression, we need to flatten features into a single dimension
      // We'll use the first feature as x and create a composite score as y
      const x = features.map(f => f[0] || 0); // Use first feature (normalized amount)
      const y = labels.map(l => l / 100); // Normalize labels to 0-1 range

      this.model = new PolynomialRegression(x, y, this.degree);
      this.isTrained = true;
      console.log(`Trained polynomial model with ${features.length} samples, degree ${this.degree}`);
    } catch (error) {
      console.error('Error training polynomial model:', error);
      this.model = null;
    }
  }

  predict(features: number[]): number {
    if (!this.isTrained || !this.model) {
      return 0.5; // Default risk score
    }

    try {
      // Use the first feature for prediction (normalized amount)
      const x = features[0] || 0;
      const prediction = this.model.predict(x);
      return Math.max(0, Math.min(1, prediction)); // Ensure 0-1 range
    } catch (error) {
      console.error('Error predicting risk:', error);
      return 0.5;
    }
  }

  save(): any {
    if (!this.model) {
      return null;
    }
    return {
      coefficients: this.model.coefficients,
      degree: this.degree,
      isTrained: this.isTrained,
    };
  }

  load(modelData: any): void {
    try {
      if (modelData && modelData.coefficients) {
        // Create a new polynomial regression with the saved coefficients
        this.model = new PolynomialRegression([0], [0], modelData.degree);
        this.model.coefficients = modelData.coefficients;
        this.degree = modelData.degree;
        this.isTrained = modelData.isTrained;
        console.log('Loaded existing polynomial model');
      }
    } catch (error) {
      console.error('Error loading polynomial model:', error);
      this.model = null;
    }
  }
}

// Global model instance
let riskModel: PolynomialRiskModel | null = null;

// Initialize the ML model
async function initializeModel(): Promise<void> {
  if (riskModel) return;

  riskModel = new PolynomialRiskModel();
  
  // Try to load existing model from database
  try {
    const savedModel = await prisma.ml_models.findFirst({
      where: { model_type: 'risk_analyzer' },
      orderBy: { created_at: 'desc' },
    });

    if (savedModel && savedModel.model_data) {
      riskModel.load(savedModel.model_data);
      console.log('Loaded existing polynomial model');
    } else {
      console.log('No existing model found, will train new polynomial model');
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

    // Merchant category risk (simplified - category is a string in schema)
    const merchantCategoryRisk = 0.5; // Default risk for category

    // Transaction pattern risk
    const transactionPatternRisk = calculatePatternRisk(userTransactions, amount);

    // Normalize features
    const normalizedAmount = Math.min(amount / 10000, 1); // Cap at 10k
    const normalizedDeviceAge = Math.min(deviceAge / 24, 1); // Cap at 24 hours
    const normalizedMerchantRisk = merchantRisk / 100;
    const normalizedFrequency = Math.min(recentTransactions / 10, 1); // Cap at 10 transactions
    const normalizedAvgAmount = Math.min(avgUserAmount / 5000, 1); // Cap at 5k

    return {
      normalizedAmount,
      normalizedDeviceAge,
      normalizedMerchantRisk,
      normalizedFrequency,
      normalizedAvgAmount,
      timeOfDay,
      dayOfWeek,
      amountVelocity,
      locationAnomaly,
      deviceFingerprintRisk,
      userBehaviorScore,
      merchantCategoryRisk,
      transactionPatternRisk,
      raw: {
        amount,
        deviceAge,
        merchantRisk,
        recentTransactions,
        avgUserAmount,
        hour,
        day,
        userTransactionCount,
        userTotalSpent: Number(userTotalSpent._sum.amount) || 0,
        deviceTransactionCount: deviceTransactions,
        merchantTransactionCount: 0, // Placeholder
      },
    };
  } catch (error) {
    console.error('Error extracting features:', error);
    return getDefaultFeatures(amount);
  }
}

// Calculate pattern risk based on transaction history
function calculatePatternRisk(transactions: any[], currentAmount: number): number {
  if (transactions.length === 0) {
    return 0.5; // Default risk
  }

  const amounts = transactions.map(tx => Number(tx.amount));
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
  );

  // Higher risk if current amount deviates significantly from user's pattern
  const deviation = Math.abs(currentAmount - avgAmount) / (stdDev || 1);
  return Math.min(deviation / 3, 1); // Normalize to 0-1
}

// Get default features when extraction fails
function getDefaultFeatures(amount: number): MLFeatures {
  return {
    normalizedAmount: Math.min(amount / 10000, 1),
    normalizedDeviceAge: 0.5,
    normalizedMerchantRisk: 0.5,
    normalizedFrequency: 0.5,
    normalizedAvgAmount: 0.5,
    timeOfDay: 0.5,
    dayOfWeek: 0.5,
    amountVelocity: 0.5,
    locationAnomaly: 0.1,
    deviceFingerprintRisk: 0.5,
    userBehaviorScore: 0.5,
    merchantCategoryRisk: 0.5,
    transactionPatternRisk: 0.5,
    raw: {
      amount,
      deviceAge: 12,
      merchantRisk: 50,
      recentTransactions: 1,
      avgUserAmount: amount,
      hour: 12,
      day: 1,
      userTransactionCount: 1,
      userTotalSpent: amount,
      deviceTransactionCount: 1,
      merchantTransactionCount: 1,
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

// Main ML risk analysis function
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
    let mlPrediction = 0.5; // Default
    let mlConfidence = 0.5; // Default confidence

    if (riskModel) {
      const mlInput = featuresToMLInput(features);
      mlPrediction = riskModel.predict(mlInput);
      mlConfidence = calculateMLConfidence(features);
    }

    // Combine ML prediction with rule-based scoring
    const ruleBasedScore = calculateRuleBasedScore(features);
    const combinedScore = (mlPrediction * 0.7) + (ruleBasedScore * 0.3);

    // Convert to 0-100 scale
    const riskScore = Math.round(combinedScore * 100);

    // Generate risk reasons
    const reasons = generateRiskReasons(features, mlPrediction);

    // Save training data for future model updates
    await saveTrainingData(features, riskScore);

    return {
      riskScore,
      features,
      reasons,
      mlConfidence,
    };
  } catch (error) {
    console.error('Error in ML risk analysis:', error);
    // Return default risk assessment
    const features = getDefaultFeatures(amount);
    return {
      riskScore: 50,
      features,
      reasons: ['Analysis failed - using default risk'],
      mlConfidence: 0.1,
    };
  }
}

// Calculate rule-based risk score
function calculateRuleBasedScore(features: MLFeatures): number {
  let score = 0.5; // Base score

  // Amount-based rules
  if (features.normalizedAmount > 0.8) score += 0.2;
  if (features.amountVelocity > 0.5) score += 0.1;

  // Device-based rules
  if (features.deviceFingerprintRisk > 0.7) score += 0.15;
  if (features.normalizedDeviceAge > 0.8) score += 0.1;

  // Frequency-based rules
  if (features.normalizedFrequency > 0.7) score += 0.15;

  // Time-based rules
  if (features.timeOfDay < 0.2 || features.timeOfDay > 0.8) score += 0.1; // Off-hours

  return Math.min(score, 1);
}

// Calculate ML confidence based on feature quality
function calculateMLConfidence(features: MLFeatures): number {
  let confidence = 0.5; // Base confidence

  // Higher confidence with more data
  if (features.raw.userTransactionCount > 10) confidence += 0.2;
  if (features.raw.deviceTransactionCount > 5) confidence += 0.1;

  // Lower confidence with anomalies
  if (features.amountVelocity > 0.5) confidence -= 0.1;
  if (features.deviceFingerprintRisk > 0.7) confidence -= 0.1;

  return Math.max(0.1, Math.min(confidence, 1));
}

// Generate human-readable risk reasons
function generateRiskReasons(features: MLFeatures, mlPrediction: number): string[] {
  const reasons: string[] = [];

  if (features.normalizedAmount > 0.8) {
    reasons.push('High transaction amount');
  }

  if (features.deviceFingerprintRisk > 0.7) {
    reasons.push('New or suspicious device');
  }

  if (features.normalizedFrequency > 0.7) {
    reasons.push('Unusual transaction frequency');
  }

  if (features.amountVelocity > 0.5) {
    reasons.push('Rapid change in transaction amounts');
  }

  if (features.normalizedMerchantRisk > 0.8) {
    reasons.push('High-risk merchant');
  }

  if (features.timeOfDay < 0.2 || features.timeOfDay > 0.8) {
    reasons.push('Transaction during off-hours');
  }

  if (mlPrediction > 0.7) {
    reasons.push('ML model indicates high risk');
  }

  return reasons.length > 0 ? reasons : ['Low risk transaction'];
}

// Save training data for model updates
async function saveTrainingData(features: MLFeatures, label: number): Promise<void> {
  try {
    await prisma.training_data.create({
      data: {
        features: {
          amount: features.raw.amount,
          device_age: features.raw.deviceAge,
          merchant_risk: features.raw.merchantRisk,
          transaction_frequency: features.raw.recentTransactions,
          avg_user_amount: features.raw.avgUserAmount,
          normalized_amount: features.normalizedAmount,
          normalized_device_age: features.normalizedDeviceAge,
          normalized_merchant_risk: features.normalizedMerchantRisk,
          normalized_frequency: features.normalizedFrequency,
          normalized_avg_amount: features.normalizedAvgAmount,
        },
        label: label >= 75 ? 1 : 0, // 1 for high risk, 0 for low risk
      },
    });
  } catch (error) {
    console.error('Error saving training data:', error);
  }
}

// Train the model with collected data
export async function trainModel(): Promise<void> {
  try {
    console.log('Training polynomial regression model...');

    // Get training data from database
    const trainingData = await prisma.training_data.findMany({
      take: 1000, // Limit to recent data
      orderBy: { created_at: 'desc' },
    });

    if (trainingData.length < 10) {
      console.log('Insufficient training data, skipping training');
      return;
    }

    // Prepare features and labels
    const features: number[][] = [];
    const labels: number[] = [];

    for (const data of trainingData) {
      const featureData = data.features as any;
      const featureVector = [
        featureData.normalized_amount || 0,
        featureData.normalized_device_age || 0,
        featureData.normalized_merchant_risk || 0,
        featureData.normalized_frequency || 0,
        featureData.normalized_avg_amount || 0,
      ];
      features.push(featureVector);
      labels.push(data.label * 100); // Convert back to 0-100 scale
    }

    // Initialize and train model
    await initializeModel();
    if (riskModel) {
      riskModel.train(features, labels);

      // Save trained model
      const modelData = riskModel.save();
      if (modelData) {
        await prisma.ml_models.create({
          data: {
            model_type: 'risk_analyzer',
            model_data: modelData,
            version: '1.0.0',
            accuracy: calculateModelAccuracy(features, labels),
          },
        });
        console.log('Polynomial regression model trained and saved');
      }
    }
  } catch (error) {
    console.error('Error training model:', error);
  }
}

// Calculate model accuracy (simplified)
function calculateModelAccuracy(features: number[][], labels: number[]): number {
  if (!riskModel || features.length === 0) {
    return 0.5;
  }

  let correct = 0;
  for (let i = 0; i < features.length; i++) {
    const prediction = riskModel.predict(features[i]);
    const actual = labels[i] / 100; // Normalize to 0-1
    if (Math.abs(prediction - actual) < 0.2) { // Within 20% tolerance
      correct++;
    }
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
    const lastModel = await prisma.ml_models.findFirst({
      where: { model_type: 'risk_analyzer' },
      orderBy: { created_at: 'desc' },
    });

    const trainingSamples = await prisma.training_data.count();

          return {
        isTrained: riskModel ? true : false, // Simplified check
        lastTrained: lastModel?.created_at || null,
        accuracy: lastModel?.accuracy || null,
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