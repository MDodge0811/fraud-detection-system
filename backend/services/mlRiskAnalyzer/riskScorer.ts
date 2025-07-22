import { MLFeatures } from './types';

export class RiskScorer {
  // Calculate rule-based risk score
  static calculateRuleBasedScore(features: MLFeatures): number {
    let score = 0.2; // Lower base score for more conservative scoring

    // Amount-based rules (more conservative)
    if (features.normalizedAmount > 0.95) {
      score += 0.3; // Very high amounts
    } else if (features.normalizedAmount > 0.8) {
      score += 0.2; // High amounts
    } else if (features.normalizedAmount > 0.6) {
      score += 0.1; // Medium amounts
    }

    if (features.amountVelocity > 0.8) {
      score += 0.15; // High velocity
    } else if (features.amountVelocity > 0.5) {
      score += 0.05; // Medium velocity
    }

    // Device-based rules
    if (features.deviceFingerprintRisk > 0.9) {
      score += 0.2; // Very suspicious device
    } else if (features.deviceFingerprintRisk > 0.7) {
      score += 0.1; // Suspicious device
    }

    if (features.normalizedDeviceAge > 0.95) {
      score += 0.15; // Very new device
    } else if (features.normalizedDeviceAge > 0.8) {
      score += 0.05; // New device
    }

    // Frequency-based rules
    if (features.normalizedFrequency > 0.9) {
      score += 0.2; // Very high frequency
    } else if (features.normalizedFrequency > 0.7) {
      score += 0.1; // High frequency
    }

    // Merchant risk rules
    if (features.normalizedMerchantRisk > 0.9) {
      score += 0.25; // Very high risk merchant
    } else if (features.normalizedMerchantRisk > 0.7) {
      score += 0.15; // High risk merchant
    }

    // Time-based rules
    if (features.timeOfDay < 0.1 || features.timeOfDay > 0.9) {
      score += 0.1; // Very off-hours
    } else if (features.timeOfDay < 0.2 || features.timeOfDay > 0.8) {
      score += 0.05; // Off-hours
    }

    // Pattern-based rules
    if (features.transactionPatternRisk > 0.8) {
      score += 0.15;
    }
    if (features.userBehaviorScore > 0.8) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  // Calculate ML confidence based on feature quality
  static calculateMLConfidence(features: MLFeatures): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence with more data
    if (features.raw.userTransactionCount > 10) {
      confidence += 0.2;
    }
    if (features.raw.deviceTransactionCount > 5) {
      confidence += 0.1;
    }

    // Lower confidence with anomalies
    if (features.amountVelocity > 0.5) {
      confidence -= 0.1;
    }
    if (features.deviceFingerprintRisk > 0.7) {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(confidence, 1));
  }

  // Generate human-readable risk reasons
  static generateRiskReasons(features: MLFeatures, mlPrediction: number): string[] {
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
}
