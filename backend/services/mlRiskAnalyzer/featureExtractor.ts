import { prisma } from '../../prisma/client';
import { MLFeatures, FeatureExtractor } from './types';

export class TransactionFeatureExtractor implements FeatureExtractor {
  async extractFeatures(
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
      const transactionPatternRisk = this.calculatePatternRisk(userTransactions, amount);

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
      return this.getDefaultFeatures(amount);
    }
  }

  private calculatePatternRisk(transactions: any[], currentAmount: number): number {
    if (transactions.length === 0) {
      return 0.5; // Default risk
    }

    const amounts = transactions.map(tx => Number(tx.amount));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length,
    );

    // Higher risk if current amount deviates significantly from user's pattern
    const deviation = Math.abs(currentAmount - avgAmount) / (stdDev || 1);
    return Math.min(deviation / 3, 1); // Normalize to 0-1
  }

  private getDefaultFeatures(amount: number): MLFeatures {
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
}

// Convert features to ML input array
export function featuresToMLInput(features: MLFeatures): number[] {
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
