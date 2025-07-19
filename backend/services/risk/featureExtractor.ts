import { prisma } from '../../prisma/client';
import { RiskConfig } from './config';
import { TransactionFeatures } from './types';

export class RuleBasedFeatureExtractor {
  async extractFeatures(
    transactionId: string,
    userId: string,
    deviceId: string,
    merchantId: string,
    amount: number,
  ): Promise<TransactionFeatures> {
    try {
      // Validate inputs
      this.validateInputs(transactionId, userId, deviceId, merchantId, amount);

      // Extract features in parallel for better performance
      const [merchant, device, recentTransactions, userTransactions] = await Promise.all([
        this.getMerchantRisk(merchantId),
        this.getDeviceAge(deviceId),
        this.getRecentTransactionCount(userId),
        this.getUserTransactionHistory(userId),
      ]);

      // Calculate average user amount
      const avgUserAmount = this.calculateAverageAmount(userTransactions);

      // Normalize features
      const normalizedAmount = amount / RiskConfig.MAX_AMOUNT;
      const normalizedDeviceAge = Math.min(device.deviceAge / RiskConfig.DEVICE_AGE_NORMALIZATION_HOURS, 1);
      const normalizedMerchantRisk = merchant.riskLevel / RiskConfig.MAX_MERCHANT_RISK;
      const normalizedFrequency = Math.min(recentTransactions / RiskConfig.MAX_TRANSACTION_FREQUENCY, 1);
      const normalizedAvgAmount = Math.min(avgUserAmount / RiskConfig.MAX_AVG_AMOUNT, 1);

      return {
        normalizedAmount,
        normalizedDeviceAge,
        normalizedMerchantRisk,
        normalizedFrequency,
        normalizedAvgAmount,
        raw: {
          amount,
          deviceAge: device.deviceAge,
          merchantRisk: merchant.riskLevel,
          recentTransactions,
          avgUserAmount,
        },
      };
    } catch (error) {
      console.error('Error extracting transaction features:', error);
      return this.getDefaultFeatures(amount);
    }
  }

  private validateInputs(
    transactionId: string,
    userId: string,
    deviceId: string,
    merchantId: string,
    amount: number,
  ): void {
    if (!transactionId || !userId || !deviceId || !merchantId) {
      throw new Error('Missing required transaction parameters');
    }
    if (amount <= 0 || !Number.isFinite(amount)) {
      throw new Error('Invalid transaction amount');
    }
  }

  private async getMerchantRisk(merchantId: string): Promise<{ riskLevel: number }> {
    const merchant = await prisma.merchants.findUnique({
      where: { merchant_id: merchantId },
      select: { risk_level: true },
    });
    return { riskLevel: merchant?.risk_level || 50 };
  }

  private async getDeviceAge(deviceId: string): Promise<{ deviceAge: number }> {
    const device = await prisma.devices.findUnique({
      where: { device_id: deviceId },
      select: { last_seen: true },
    });

    const deviceAge = device?.last_seen ?
      Math.floor((Date.now() - new Date(device.last_seen).getTime()) / (1000 * 60 * 60)) :
      0;

    return { deviceAge };
  }

  private async getRecentTransactionCount(userId: string): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - RiskConfig.RECENT_TRANSACTIONS_WINDOW_MINUTES * 60 * 1000);
    return await prisma.transactions.count({
      where: {
        user_id: userId,
        timestamp: { gte: fiveMinutesAgo },
      },
    });
  }

  private async getUserTransactionHistory(userId: string): Promise<{ amount: any; timestamp: Date | null }[]> {
    const twentyFourHoursAgo = new Date(Date.now() - RiskConfig.USER_HISTORY_WINDOW_HOURS * 60 * 60 * 1000);
    return await prisma.transactions.findMany({
      where: {
        user_id: userId,
        timestamp: { gte: twentyFourHoursAgo },
      },
      select: { amount: true, timestamp: true },
    });
  }

  private calculateAverageAmount(transactions: { amount: any; timestamp: Date | null }[]): number {
    if (transactions.length === 0) {
      return 0;
    }
    const total = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    return total / transactions.length;
  }

  private getDefaultFeatures(amount: number): TransactionFeatures {
    return {
      normalizedAmount: amount / RiskConfig.MAX_AMOUNT,
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
