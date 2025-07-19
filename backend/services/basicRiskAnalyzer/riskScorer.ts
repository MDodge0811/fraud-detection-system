import { RiskConfig } from './config';
import { TransactionFeatures, RiskMultiplier, RiskLevel } from './types';

export class RuleBasedRiskScorer {
  calculateRiskScore(features: TransactionFeatures): number {
    // Calculate weighted risk components
    const amountRisk = features.normalizedAmount * RiskConfig.WEIGHTS.amount;
    const deviceRisk = features.normalizedDeviceAge * RiskConfig.WEIGHTS.deviceAge;
    const merchantRisk = features.normalizedMerchantRisk * RiskConfig.WEIGHTS.merchantRisk;
    const frequencyRisk = features.normalizedFrequency * RiskConfig.WEIGHTS.frequency;
    const avgAmountRisk = features.normalizedAvgAmount * RiskConfig.WEIGHTS.avgAmount;

    // Combine risk factors
    let totalRisk = amountRisk + deviceRisk + merchantRisk + frequencyRisk + avgAmountRisk;

    // Apply risk multipliers for suspicious patterns
    const riskMultipliers = this.calculateRiskMultipliers(features);

    // Apply multipliers
    if (riskMultipliers.length > 0) {
      const avgMultiplier = riskMultipliers.reduce((sum, m) => sum + m.value, 0) / riskMultipliers.length;
      totalRisk *= avgMultiplier;
    }

    // Ensure risk score is between 0 and 100
    return Math.min(Math.max(Math.round(totalRisk * 100), 0), 100);
  }

  private calculateRiskMultipliers(features: TransactionFeatures): RiskMultiplier[] {
    const multipliers: RiskMultiplier[] = [];

    // High amount relative to user's average
    if (features.normalizedAmount > features.normalizedAvgAmount * RiskConfig.AMOUNT_MULTIPLIER) {
      multipliers.push({
        name: 'High Amount Multiplier',
        value: RiskConfig.AMOUNT_MULTIPLIER,
        reason: 'Amount significantly higher than user average',
      });
    }

    // High frequency transactions
    if (features.raw.recentTransactions > RiskConfig.HIGH_TRANSACTION_FREQUENCY) {
      multipliers.push({
        name: 'High Frequency Multiplier',
        value: RiskConfig.FREQUENCY_MULTIPLIER,
        reason: 'Unusual transaction frequency',
      });
    }

    // Very new device
    if (features.raw.deviceAge < RiskConfig.NEW_DEVICE_HOURS) {
      multipliers.push({
        name: 'New Device Multiplier',
        value: RiskConfig.NEW_DEVICE_MULTIPLIER,
        reason: 'Transaction from new device',
      });
    }

    // High-risk merchant
    if (features.raw.merchantRisk > RiskConfig.HIGH_RISK_MERCHANT_THRESHOLD) {
      multipliers.push({
        name: 'High Risk Merchant Multiplier',
        value: RiskConfig.HIGH_MERCHANT_MULTIPLIER,
        reason: 'High-risk merchant category',
      });
    }

    return multipliers;
  }

  generateRiskReasons(features: TransactionFeatures): string[] {
    const reasons: string[] = [];

    if (features.raw.merchantRisk > RiskConfig.HIGH_RISK_MERCHANT_THRESHOLD) {
      reasons.push(`High-risk merchant (${features.raw.merchantRisk}%)`);
    }

    if (features.raw.recentTransactions > RiskConfig.HIGH_TRANSACTION_FREQUENCY) {
      reasons.push(`High transaction frequency (${features.raw.recentTransactions} in ${RiskConfig.RECENT_TRANSACTIONS_WINDOW_MINUTES} min)`);
    }

    if (features.raw.deviceAge < RiskConfig.NEW_DEVICE_HOURS) {
      reasons.push(`New device (${features.raw.deviceAge} hours old)`);
    }

    if (features.normalizedAmount > features.normalizedAvgAmount * RiskConfig.AMOUNT_MULTIPLIER) {
      reasons.push('Amount significantly higher than average');
    }

    if (features.normalizedAmount > 0.8) {
      reasons.push(`High transaction amount ($${features.raw.amount})`);
    }

    return reasons.length > 0 ? reasons : ['Low risk transaction'];
  }

  getRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= RiskConfig.CRITICAL_RISK) {
      return 'Critical';
    }
    if (riskScore >= RiskConfig.HIGH_RISK) {
      return 'High';
    }
    if (riskScore >= RiskConfig.MEDIUM_RISK) {
      return 'Medium';
    }
    if (riskScore >= RiskConfig.LOW_RISK) {
      return 'Low';
    }
    return 'Very Low';
  }

  getRiskColor(riskScore: number): string {
    if (riskScore >= RiskConfig.CRITICAL_RISK) {
      return RiskConfig.COLORS.critical;
    }
    if (riskScore >= RiskConfig.HIGH_RISK) {
      return RiskConfig.COLORS.high;
    }
    if (riskScore >= RiskConfig.MEDIUM_RISK) {
      return RiskConfig.COLORS.medium;
    }
    if (riskScore >= RiskConfig.LOW_RISK) {
      return RiskConfig.COLORS.low;
    }
    return RiskConfig.COLORS.veryLow;
  }
}
