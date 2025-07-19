import { RiskAnalysisResult, MLFeatures } from './types';
import { TransactionFeatureExtractor, featuresToMLInput } from './featureExtractor';
import { RiskScorer } from './riskScorer';
import { MLTrainingService } from './trainingService';
import { ModelManager } from './modelManager';
import { SimpleRiskModel } from './riskModel';

export class MLRiskAnalyzer {
  private featureExtractor: TransactionFeatureExtractor;
  private trainingService: MLTrainingService;
  private modelManager: ModelManager;

  constructor() {
    this.featureExtractor = new TransactionFeatureExtractor();
    this.trainingService = new MLTrainingService();
    this.modelManager = new ModelManager();
  }

  // Main ML risk analysis function
  async analyzeTransactionRiskML(
    transactionId: string,
    userId: string,
    deviceId: string,
    merchantId: string,
    amount: number,
  ): Promise<RiskAnalysisResult> {
    try {
      // Initialize model if needed
      await this.modelManager.initializeModel();

      // Extract features
      const features = await this.featureExtractor.extractFeatures(
        transactionId,
        userId,
        deviceId,
        merchantId,
        amount,
      );

      // Get ML prediction
      let mlPrediction = 0.5; // Default
      let mlConfidence = 0.5; // Default confidence

      const riskModel = this.modelManager.getModel();
      if (riskModel) {
        const mlInput = featuresToMLInput(features);
        mlPrediction = riskModel.predict(mlInput);
        mlConfidence = RiskScorer.calculateMLConfidence(features);
      }

      // Combine ML prediction with rule-based scoring (more diverse)
      const ruleBasedScore = RiskScorer.calculateRuleBasedScore(features);

      // Add some randomness for more diverse scores
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const combinedScore = (mlPrediction * 0.6 + ruleBasedScore * 0.4) * randomFactor;

      // Convert to 0-100 scale with more spread
      const riskScore = Math.round(Math.max(0, Math.min(100, combinedScore * 100)));

      // Generate risk reasons
      const reasons = RiskScorer.generateRiskReasons(features, mlPrediction);

      // Save training data for future model updates
      await this.trainingService.saveTrainingData(features, riskScore);

      return {
        riskScore,
        features,
        reasons,
        mlConfidence,
      };
    } catch (error) {
      console.error('Error in ML risk analysis:', error);
      // Return default risk assessment
      const features = this.getDefaultFeatures(amount);
      return {
        riskScore: 50,
        features,
        reasons: ['Analysis failed - using default risk'],
        mlConfidence: 0.1,
      };
    }
  }

  // Train the model with collected data
  async trainModel(): Promise<void> {
    const riskModel = this.modelManager.getModel();
    if (!riskModel) {
      await this.modelManager.initializeModel();
    }

    const model = this.modelManager.getModel();
    if (model && model instanceof SimpleRiskModel) {
      await this.trainingService.trainModel(model);
    }
  }

  // Get model statistics
  async getModelStats(): Promise<{
    isTrained: boolean;
    lastTrained: Date | null;
    accuracy: number | null;
    trainingSamples: number;
  }> {
    const riskModel = this.modelManager.getModel();
    return await this.trainingService.getModelStats(riskModel as SimpleRiskModel | null);
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

// Create singleton instance
const mlRiskAnalyzer = new MLRiskAnalyzer();

// Export public API functions
export const analyzeTransactionRiskML = mlRiskAnalyzer.analyzeTransactionRiskML.bind(mlRiskAnalyzer);
export const trainModel = mlRiskAnalyzer.trainModel.bind(mlRiskAnalyzer);
export const getModelStats = mlRiskAnalyzer.getModelStats.bind(mlRiskAnalyzer);

// Export types for external use
export * from './types';
