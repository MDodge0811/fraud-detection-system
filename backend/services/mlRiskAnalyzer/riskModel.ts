import { RiskModel } from './types';

// Simple but effective risk scoring system
export class SimpleRiskModel implements RiskModel {
  private isTrained: boolean = false;
  private riskThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  } = {
      low: 30,
      medium: 50,
      high: 75,
      critical: 90,
    };

  constructor() {
    this.isTrained = true; // Always ready to use
  }

  train(features: number[][], _labels: number[]): void {
    // Simple model doesn't need complex training
    console.log(`Simple risk model ready with ${features.length} samples`);
    this.isTrained = true;
  }

  predict(features: number[]): number {
    if (!this.isTrained) {
      return 0.5; // Default risk score
    }

    try {
      // Use a weighted combination of features for prediction
      const weights = [0.3, 0.2, 0.25, 0.15, 0.1]; // Amount, device, merchant, frequency, avg
      let prediction = 0;

      for (let i = 0; i < Math.min(features.length, weights.length); i++) {
        prediction += (features[i] || 0) * weights[i];
      }

      // Add some randomness for diversity
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      prediction = prediction * randomFactor;

      return Math.max(0, Math.min(1, prediction));
    } catch (error) {
      console.error('Error predicting risk:', error);
      return 0.5;
    }
  }

  save(): any {
    return {
      isTrained: this.isTrained,
      riskThresholds: this.riskThresholds,
      type: 'simple_risk_model',
    };
  }

  load(modelData: any): void {
    try {
      if (modelData && modelData.type === 'simple_risk_model') {
        this.isTrained = modelData.isTrained;
        this.riskThresholds = modelData.riskThresholds || this.riskThresholds;
        console.log('Loaded existing simple risk model');
      }
    } catch (error) {
      console.error('Error loading simple risk model:', error);
    }
  }
}
