import { RiskAnalysisResult, TransactionFeatures } from './types';
import { RuleBasedFeatureExtractor } from './featureExtractor';
import { RuleBasedRiskScorer } from './riskScorer';

export class RuleBasedRiskAnalyzer {
  private featureExtractor: RuleBasedFeatureExtractor;
  private riskScorer: RuleBasedRiskScorer;

  constructor() {
    this.featureExtractor = new RuleBasedFeatureExtractor();
    this.riskScorer = new RuleBasedRiskScorer();
  }

  async analyzeTransactionRisk(
    transactionId: string,
    userId: string,
    deviceId: string,
    merchantId: string,
    amount: number,
  ): Promise<RiskAnalysisResult> {
    try {
      // Extract features
      const features = await this.featureExtractor.extractFeatures(
        transactionId,
        userId,
        deviceId,
        merchantId,
        amount,
      );

      // Calculate risk score
      const riskScore = this.riskScorer.calculateRiskScore(features);

      // Generate risk reasons
      const reasons = this.riskScorer.generateRiskReasons(features);

      // Get risk level and color
      const riskLevel = this.riskScorer.getRiskLevel(riskScore);
      const riskColor = this.riskScorer.getRiskColor(riskScore);

      return {
        riskScore,
        features,
        reasons,
        riskLevel,
        riskColor,
      };
    } catch (error) {
      console.error('Error analyzing transaction risk:', error);
      return this.getDefaultResult(amount);
    }
  }

  private getDefaultResult(amount: number): RiskAnalysisResult {
    const features: TransactionFeatures = {
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
        avgUserAmount: 0,
      },
    };

    return {
      riskScore: 50,
      features,
      reasons: ['Risk analysis failed - using default score'],
      riskLevel: 'Medium',
      riskColor: '#d97706',
    };
  }
}

// Create singleton instance
const ruleBasedRiskAnalyzer = new RuleBasedRiskAnalyzer();

// Export public API functions
export const analyzeTransactionRisk = ruleBasedRiskAnalyzer.analyzeTransactionRisk.bind(ruleBasedRiskAnalyzer);

// Export utility functions for backward compatibility
export const getRiskLevel = (riskScore: number): string => {
  const scorer = new RuleBasedRiskScorer();
  return scorer.getRiskLevel(riskScore);
};

export const getRiskColor = (riskScore: number): string => {
  const scorer = new RuleBasedRiskScorer();
  return scorer.getRiskColor(riskScore);
};

// Export types for external use
export * from './types';
