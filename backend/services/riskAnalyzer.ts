import { prisma } from '../prisma/client';

// Constants for risk analysis
const MAX_AMOUNT = 10000; // Maximum transaction amount for normalization
const DEVICE_AGE_NORMALIZATION_HOURS = 24; // Max device age for normalization
const MAX_MERCHANT_RISK = 100; // Merchant risk is 0-100
const MAX_TRANSACTION_FREQUENCY = 10; // Max transactions in 5 min for normalization
const MAX_AVG_AMOUNT = 5000; // Max average user amount for normalization
const HIGH_RISK_MERCHANT_THRESHOLD = 80; // Merchant risk > 80 is high
const HIGH_TRANSACTION_FREQUENCY = 5; // More than 5 transactions in 5 min is high
const NEW_DEVICE_HOURS = 1; // Device age < 1 hour is new
const AMOUNT_MULTIPLIER = 1.5; // Multiplier for high amount
const FREQUENCY_MULTIPLIER = 1.3; // Multiplier for high frequency
const NEW_DEVICE_MULTIPLIER = 1.4; // Multiplier for new device
const HIGH_MERCHANT_MULTIPLIER = 1.6; // Multiplier for high-risk merchant
const CRITICAL_RISK = 90;
const HIGH_RISK = 75;
const MEDIUM_RISK = 50;
const LOW_RISK = 25;

// Feature extraction functions
async function getTransactionFeatures(transactionId: string, userId: string, deviceId: string, merchantId: string, amount: number) {
  try {
    // Get merchant risk level
    const merchant = await prisma.merchants.findUnique({
      where: { merchant_id: merchantId },
    });
    const merchantRisk = merchant?.risk_level || 50;

    // Calculate device age in hours
    const device = await prisma.devices.findUnique({
      where: { device_id: deviceId },
    });
    const deviceAge = device ?
      Math.floor((Date.now() - new Date(device.last_seen || Date.now()).getTime()) / (1000 * 60 * 60)) :
      0;

    // Get transaction frequency in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTransactions = await prisma.transactions.count({
      where: {
        user_id: userId,
        timestamp: {
          gte: fiveMinutesAgo,
        },
      },
    });

    // Get average user amount in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const userTransactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      select: { amount: true },
    });

    const avgUserAmount = userTransactions.length > 0 ?
      userTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0) / userTransactions.length :
      0;

    // Normalize features
    const normalizedAmount = amount / MAX_AMOUNT; // Normalize to 0-1 range
    const normalizedDeviceAge = Math.min(deviceAge / DEVICE_AGE_NORMALIZATION_HOURS, 1); // Normalize to 0-1 (max 24 hours)
    const normalizedMerchantRisk = merchantRisk / MAX_MERCHANT_RISK; // Already 0-1
    const normalizedFrequency = Math.min(recentTransactions / MAX_TRANSACTION_FREQUENCY, 1); // Normalize to 0-1 (max 10 transactions)
    const normalizedAvgAmount = Math.min(avgUserAmount / MAX_AVG_AMOUNT, 1); // Normalize to 0-1 (max $5000)

    return {
      normalizedAmount,
      normalizedDeviceAge,
      normalizedMerchantRisk,
      normalizedFrequency,
      normalizedAvgAmount,
      raw: {
        amount,
        deviceAge,
        merchantRisk,
        recentTransactions,
        avgUserAmount,
      },
    };
  } catch (error) {
    console.error('Error extracting transaction features:', error);
    // Return default features if extraction fails
    return {
      normalizedAmount: amount / MAX_AMOUNT,
      normalizedDeviceAge: 0,
      normalizedMerchantRisk: 0.5,
      normalizedFrequency: 0,
      normalizedAvgAmount: 0,
      raw: {
        amount,
        deviceAge: 0,
        merchantRisk: 50,
        recentTransactions: 0,
        avgUserAmount: 0,
      },
    };
  }
}

// Risk scoring algorithm
function calculateRiskScore(features: any): number {
  // Weighted risk factors
  const weights = {
    amount: 0.25,
    deviceAge: 0.15,
    merchantRisk: 0.30,
    frequency: 0.20,
    avgAmount: 0.10,
  };

  // Calculate individual risk components
  const amountRisk = features.normalizedAmount * weights.amount;
  const deviceRisk = features.normalizedDeviceAge * weights.deviceAge;
  const merchantRisk = features.normalizedMerchantRisk * weights.merchantRisk;
  const frequencyRisk = features.normalizedFrequency * weights.frequency;
  const avgAmountRisk = features.normalizedAvgAmount * weights.avgAmount;

  // Combine risk factors
  let totalRisk = amountRisk + deviceRisk + merchantRisk + frequencyRisk + avgAmountRisk;

  // Apply risk multipliers for suspicious patterns
  const riskMultipliers = [];

  // High amount relative to user's average
  if (features.normalizedAmount > features.normalizedAvgAmount * AMOUNT_MULTIPLIER) {
    riskMultipliers.push(AMOUNT_MULTIPLIER);
  }

  // High frequency transactions
  if (features.raw.recentTransactions > HIGH_TRANSACTION_FREQUENCY) {
    riskMultipliers.push(FREQUENCY_MULTIPLIER);
  }

  // Very new device
  if (features.raw.deviceAge < NEW_DEVICE_HOURS) {
    riskMultipliers.push(NEW_DEVICE_MULTIPLIER);
  }

  // High-risk merchant
  if (features.raw.merchantRisk > HIGH_RISK_MERCHANT_THRESHOLD) {
    riskMultipliers.push(HIGH_MERCHANT_MULTIPLIER);
  }

  // Apply multipliers
  if (riskMultipliers.length > 0) {
    const avgMultiplier = riskMultipliers.reduce((sum, m) => sum + m, 0) / riskMultipliers.length;
    totalRisk *= avgMultiplier;
  }

  // Ensure risk score is between 0 and 100
  return Math.min(Math.max(Math.round(totalRisk * 100), 0), 100);
}

// Main risk analysis function
export async function analyzeTransactionRisk(
  transactionId: string,
  userId: string,
  deviceId: string,
  merchantId: string,
  amount: number,
): Promise<{ riskScore: number; features: any; reasons: string[] }> {
  try {
    // Extract features
    const features = await getTransactionFeatures(transactionId, userId, deviceId, merchantId, amount);

    // Calculate risk score
    const riskScore = calculateRiskScore(features);

    // Generate risk reasons
    const reasons: string[] = [];

    if (features.raw.merchantRisk > HIGH_RISK_MERCHANT_THRESHOLD) {
      reasons.push(`High-risk merchant (${features.raw.merchantRisk}%)`);
    }

    if (features.raw.recentTransactions > HIGH_TRANSACTION_FREQUENCY) {
      reasons.push(`High transaction frequency (${features.raw.recentTransactions} in 5 min)`);
    }

    if (features.raw.deviceAge < NEW_DEVICE_HOURS) {
      reasons.push(`New device (${features.raw.deviceAge} hours old)`);
    }

    if (features.normalizedAmount > features.normalizedAvgAmount * AMOUNT_MULTIPLIER) {
      reasons.push('Amount significantly higher than average');
    }

    if (features.normalizedAmount > 0.8) {
      reasons.push(`High transaction amount ($${amount})`);
    }

    return {
      riskScore,
      features,
      reasons,
    };
  } catch (error) {
    console.error('Error analyzing transaction risk:', error);
    // Return default risk score if analysis fails
    return {
      riskScore: 50,
      features: { normalizedAmount: amount / MAX_AMOUNT },
      reasons: ['Risk analysis failed - using default score'],
    };
  }
}

// Get risk level description
export function getRiskLevel(riskScore: number): string {
  if (riskScore >= CRITICAL_RISK) {return 'Critical';}
  if (riskScore >= HIGH_RISK) {return 'High';}
  if (riskScore >= MEDIUM_RISK) {return 'Medium';}
  if (riskScore >= LOW_RISK) {return 'Low';}
  return 'Very Low';
}

// Get risk color for UI
export function getRiskColor(riskScore: number): string {
  if (riskScore >= CRITICAL_RISK) {return '#dc2626';} // Red
  if (riskScore >= HIGH_RISK) {return '#ea580c';} // Orange
  if (riskScore >= MEDIUM_RISK) {return '#d97706';} // Amber
  if (riskScore >= LOW_RISK) {return '#65a30d';} // Green
  return '#16a34a'; // Dark green
}
