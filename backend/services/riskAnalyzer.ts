import { prisma } from '@/prisma/client';

// Feature extraction functions
async function getTransactionFeatures(transactionId: string, userId: string, deviceId: string, merchantId: string, amount: number) {
  try {
    // Get merchant risk level
    const merchant = await prisma.merchants.findUnique({
      where: { merchant_id: merchantId }
    });
    const merchantRisk = merchant?.risk_level || 50;

    // Calculate device age in hours
    const device = await prisma.devices.findUnique({
      where: { device_id: deviceId }
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
          gte: fiveMinutesAgo
        }
      }
    });

    // Get average user amount in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const userTransactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        timestamp: {
          gte: twentyFourHoursAgo
        }
      },
      select: { amount: true }
    });

    const avgUserAmount = userTransactions.length > 0 ? 
      userTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0) / userTransactions.length : 
      0;

    // Normalize features
    const normalizedAmount = amount / 10000; // Normalize to 0-1 range
    const normalizedDeviceAge = Math.min(deviceAge / 24, 1); // Normalize to 0-1 (max 24 hours)
    const normalizedMerchantRisk = merchantRisk / 100; // Already 0-1
    const normalizedFrequency = Math.min(recentTransactions / 10, 1); // Normalize to 0-1 (max 10 transactions)
    const normalizedAvgAmount = Math.min(avgUserAmount / 5000, 1); // Normalize to 0-1 (max $5000)

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
        avgUserAmount
      }
    };
  } catch (error) {
    console.error('Error extracting transaction features:', error);
    // Return default features if extraction fails
    return {
      normalizedAmount: amount / 10000,
      normalizedDeviceAge: 0,
      normalizedMerchantRisk: 0.5,
      normalizedFrequency: 0,
      normalizedAvgAmount: 0,
      raw: {
        amount,
        deviceAge: 0,
        merchantRisk: 50,
        recentTransactions: 0,
        avgUserAmount: 0
      }
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
    avgAmount: 0.10
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
  if (features.normalizedAmount > features.normalizedAvgAmount * 3) {
    riskMultipliers.push(1.5);
  }

  // High frequency transactions
  if (features.raw.recentTransactions > 5) {
    riskMultipliers.push(1.3);
  }

  // Very new device
  if (features.raw.deviceAge < 1) {
    riskMultipliers.push(1.4);
  }

  // High-risk merchant
  if (features.raw.merchantRisk > 80) {
    riskMultipliers.push(1.6);
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
  amount: number
): Promise<{ riskScore: number; features: any; reasons: string[] }> {
  try {
    // Extract features
    const features = await getTransactionFeatures(transactionId, userId, deviceId, merchantId, amount);
    
    // Calculate risk score
    const riskScore = calculateRiskScore(features);
    
    // Generate risk reasons
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
    
    if (features.normalizedAmount > features.normalizedAvgAmount * 3) {
      reasons.push(`Amount significantly higher than average`);
    }
    
    if (features.normalizedAmount > 0.8) {
      reasons.push(`High transaction amount ($${amount})`);
    }

    return {
      riskScore,
      features,
      reasons
    };
  } catch (error) {
    console.error('Error analyzing transaction risk:', error);
    // Return default risk score if analysis fails
    return {
      riskScore: 50,
      features: { normalizedAmount: amount / 10000 },
      reasons: ['Risk analysis failed - using default score']
    };
  }
}

// Get risk level description
export function getRiskLevel(riskScore: number): string {
  if (riskScore >= 90) return 'Critical';
  if (riskScore >= 75) return 'High';
  if (riskScore >= 50) return 'Medium';
  if (riskScore >= 25) return 'Low';
  return 'Very Low';
}

// Get risk color for UI
export function getRiskColor(riskScore: number): string {
  if (riskScore >= 90) return '#dc2626'; // Red
  if (riskScore >= 75) return '#ea580c'; // Orange
  if (riskScore >= 50) return '#d97706'; // Amber
  if (riskScore >= 25) return '#65a30d'; // Green
  return '#16a34a'; // Dark green
} 