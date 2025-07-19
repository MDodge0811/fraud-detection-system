import { prisma } from '../../prisma/client';
import { SimulationConfig } from './config';
import { User, Device, Merchant, FraudPattern, isValidUser, isValidDevice, isValidMerchant } from './types';

export class TransactionGenerator {
  generateRandomAmount(): number {
    const patterns = [
      // Normal transactions
      () => Math.random() * (SimulationConfig.PATTERNS.NORMAL.maxAmount - SimulationConfig.PATTERNS.NORMAL.minAmount) + SimulationConfig.PATTERNS.NORMAL.minAmount,
      // High-value transactions
      () => Math.random() * (SimulationConfig.PATTERNS.HIGH_VALUE.maxAmount - SimulationConfig.PATTERNS.HIGH_VALUE.minAmount) + SimulationConfig.PATTERNS.HIGH_VALUE.minAmount,
      // Micro-transactions
      () => Math.random() * (SimulationConfig.PATTERNS.MICRO.maxAmount - SimulationConfig.PATTERNS.MICRO.minAmount) + SimulationConfig.PATTERNS.MICRO.minAmount,
      // Suspicious round amounts
      () => SimulationConfig.PATTERNS.SUSPICIOUS_ROUND.amounts![Math.floor(Math.random() * SimulationConfig.PATTERNS.SUSPICIOUS_ROUND.amounts!.length)],
    ];

    const patternWeights = [
      SimulationConfig.PATTERNS.NORMAL.weight,
      SimulationConfig.PATTERNS.HIGH_VALUE.weight,
      SimulationConfig.PATTERNS.MICRO.weight,
      SimulationConfig.PATTERNS.SUSPICIOUS_ROUND.weight,
    ];

    const random = Math.random();
    let cumulativeWeight = 0;

    for (let i = 0; i < patterns.length; i++) {
      cumulativeWeight += patternWeights[i];
      if (random <= cumulativeWeight) {
        return patterns[i]();
      }
    }

    return patterns[0](); // Fallback to normal transaction
  }

  async getRandomUser(): Promise<User | null> {
    const users = await prisma.users.findMany({
      include: {
        transactions: true,
      },
    });

    if (users.length === 0) {
      return null;
    }

    const isSuspicious = Math.random() < (1 - SimulationConfig.USER_SELECTION.NORMAL_USER_PROBABILITY);

    if (isSuspicious) {
      // Select users with fewer transactions (new accounts - higher fraud risk)
      const suspiciousUsers = users.filter(user =>
        user.transactions && user.transactions.length < SimulationConfig.USER_SELECTION.SUSPICIOUS_USER_THRESHOLD,
      );
      if (suspiciousUsers.length > 0) {
        const selectedUser = suspiciousUsers[Math.floor(Math.random() * suspiciousUsers.length)];
        return isValidUser(selectedUser) ? selectedUser as User : null;
      }
    }

    const selectedUser = users[Math.floor(Math.random() * users.length)];
    return isValidUser(selectedUser) ? selectedUser as User : null;
  }

  async getRandomDevice(): Promise<Device | null> {
    const devices = await prisma.devices.findMany();
    if (devices.length === 0) {
      return null;
    }

    const isSuspicious = Math.random() < (1 - SimulationConfig.DEVICE_SELECTION.NORMAL_DEVICE_PROBABILITY);

    if (isSuspicious) {
      // Select newer devices (higher fraud risk)
      const suspiciousDevices = devices.filter(device => {
        const deviceAge = Math.floor((Date.now() - new Date(device.last_seen || Date.now()).getTime()) / (1000 * 60 * 60));
        return deviceAge < SimulationConfig.DEVICE_SELECTION.SUSPICIOUS_DEVICE_AGE_HOURS;
      });
      if (suspiciousDevices.length > 0) {
        const selectedDevice = suspiciousDevices[Math.floor(Math.random() * suspiciousDevices.length)];
        return isValidDevice(selectedDevice) ? selectedDevice as Device : null;
      }
    }

    const selectedDevice = devices[Math.floor(Math.random() * devices.length)];
    return isValidDevice(selectedDevice) ? selectedDevice as Device : null;
  }

  async getRandomMerchant(): Promise<Merchant | null> {
    const merchants = await prisma.merchants.findMany();
    if (merchants.length === 0) {
      return null;
    }

    const isHighRisk = Math.random() < (1 - SimulationConfig.MERCHANT_SELECTION.NORMAL_MERCHANT_PROBABILITY);

    if (isHighRisk) {
      // Select merchants with higher risk levels
      const highRiskMerchants = merchants.filter(merchant =>
        (merchant.risk_level || 50) > SimulationConfig.MERCHANT_SELECTION.HIGH_RISK_THRESHOLD,
      );
      if (highRiskMerchants.length > 0) {
        const selectedMerchant = highRiskMerchants[Math.floor(Math.random() * highRiskMerchants.length)];
        return isValidMerchant(selectedMerchant) ? selectedMerchant as Merchant : null;
      }
    }

    const selectedMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    return isValidMerchant(selectedMerchant) ? selectedMerchant as Merchant : null;
  }

  generateSuspiciousPattern(): FraudPattern {
    const patterns: FraudPattern[] = [
      {
        type: 'rapid_succession',
        multiplier: SimulationConfig.FRAUD_PATTERNS.RAPID_SUCCESSION.multiplier,
        reason: 'Rapid successive transactions detected',
      },
      {
        type: 'off_hours',
        multiplier: SimulationConfig.FRAUD_PATTERNS.OFF_HOURS.multiplier,
        reason: 'Off-hours transaction',
      },
      {
        type: 'unusual_amount',
        multiplier: SimulationConfig.FRAUD_PATTERNS.UNUSUAL_AMOUNT.multiplier,
        reason: 'Unusual amount for user',
      },
      {
        type: 'new_combination',
        multiplier: SimulationConfig.FRAUD_PATTERNS.NEW_COMBINATION.multiplier,
        reason: 'New user-device combination',
      },
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  async applySuspiciousPattern(
    pattern: FraudPattern,
    user: User,
    device: Device,
    amount: number,
  ): Promise<{ finalAmount: number; notes: string }> {
    let finalAmount = amount;
    let notes = '';

    switch (pattern.type) {
      case 'rapid_succession': {
        const recentTransactions = await prisma.transactions.count({
          where: {
            user_id: user.user_id,
            timestamp: { gte: new Date(Date.now() - SimulationConfig.TIME_WINDOWS.RAPID_SUCCESSION_MINUTES * 60 * 1000) },
          },
        });
        if (recentTransactions > SimulationConfig.TIME_WINDOWS.RAPID_SUCCESSION_THRESHOLD) {
          finalAmount *= pattern.multiplier;
          notes = pattern.reason;
        }
        break;
      }

      case 'off_hours': {
        const hour = new Date().getHours();
        if (hour < SimulationConfig.TIME_WINDOWS.OFF_HOURS_START || hour > SimulationConfig.TIME_WINDOWS.OFF_HOURS_END) {
          finalAmount *= pattern.multiplier;
          notes = pattern.reason;
        }
        break;
      }

      case 'unusual_amount': {
        const userAvg = await prisma.transactions.aggregate({
          where: { user_id: user.user_id },
          _avg: { amount: true },
        });
        const avgAmount = Number(userAvg._avg.amount) || 1000;
        if (Math.abs(finalAmount - avgAmount) > avgAmount * 2) {
          finalAmount *= pattern.multiplier;
          notes = pattern.reason;
        }
        break;
      }

      case 'new_combination': {
        const existingTransactions = await prisma.transactions.count({
          where: {
            user_id: user.user_id,
            device_id: device.device_id,
          },
        });
        if (existingTransactions === 0) {
          finalAmount *= pattern.multiplier;
          notes = pattern.reason;
        }
        break;
      }
    }

    return { finalAmount, notes };
  }
}
