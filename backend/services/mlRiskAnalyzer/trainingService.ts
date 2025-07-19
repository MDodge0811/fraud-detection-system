import { prisma } from '../../prisma/client';
import { MLFeatures, TrainingDataService, ModelStats } from './types';
import { SimpleRiskModel } from './riskModel';

export class MLTrainingService implements TrainingDataService {
  async saveTrainingData(features: MLFeatures, label: number): Promise<void> {
    try {
      await prisma.training_data.create({
        data: {
          features: {
            amount: features.raw.amount,
            device_age: features.raw.deviceAge,
            merchant_risk: features.raw.merchantRisk,
            transaction_frequency: features.raw.recentTransactions,
            avg_user_amount: features.raw.avgUserAmount,
            normalized_amount: features.normalizedAmount,
            normalized_device_age: features.normalizedDeviceAge,
            normalized_merchant_risk: features.normalizedMerchantRisk,
            normalized_frequency: features.normalizedFrequency,
            normalized_avg_amount: features.normalizedAvgAmount,
          },
          label: label >= 75 ? 1 : 0, // 1 for high risk, 0 for low risk
        },
      });
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  }

  async getTrainingData(): Promise<any[]> {
    return await prisma.training_data.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async getTrainingDataCount(): Promise<number> {
    return await prisma.training_data.count();
  }

  // Train the model with collected data
  async trainModel(riskModel: SimpleRiskModel): Promise<void> {
    try {
      console.log('Training simple risk model...');

      // Get training data from database
      const trainingData = await this.getTrainingData();

      if (trainingData.length < 10) {
        console.log('Insufficient training data, skipping training');
        return;
      }

      console.log(`Training with ${trainingData.length} samples...`);

      // Prepare features and labels
      const features: number[][] = [];
      const labels: number[] = [];

      for (const data of trainingData) {
        const featureData = data.features as any;
        const featureVector = [
          featureData.normalized_amount || 0,
          featureData.normalized_device_age || 0,
          featureData.normalized_merchant_risk || 0,
          featureData.normalized_frequency || 0,
          featureData.normalized_avg_amount || 0,
        ];
        features.push(featureVector);
        labels.push(data.label * 100); // Convert back to 0-100 scale
      }

      // Train model
      riskModel.train(features, labels);

      // Save trained model
      const modelData = riskModel.save();
      if (modelData) {
        await prisma.ml_models.create({
          data: {
            model_type: 'risk_analyzer',
            model_data: modelData,
            version: '1.0.0',
            accuracy: this.calculateModelAccuracy(riskModel, features, labels),
          },
        });
        console.log('Simple risk model trained and saved');
      }
    } catch (error) {
      console.error('Error training model:', error);
    }
  }

  // Calculate model accuracy (simplified)
  private calculateModelAccuracy(riskModel: SimpleRiskModel, features: number[][], labels: number[]): number {
    if (features.length === 0) {
      return 0.5;
    }

    let correct = 0;
    for (let i = 0; i < features.length; i++) {
      const prediction = riskModel.predict(features[i]);
      const actual = labels[i] / 100; // Normalize to 0-1
      if (Math.abs(prediction - actual) < 0.2) { // Within 20% tolerance
        correct++;
      }
    }

    return correct / features.length;
  }

  // Get model statistics
  async getModelStats(riskModel: SimpleRiskModel | null): Promise<ModelStats> {
    try {
      const lastModel = await prisma.ml_models.findFirst({
        where: { model_type: 'risk_analyzer' },
        orderBy: { created_at: 'desc' },
      });

      const trainingSamples = await this.getTrainingDataCount();

      return {
        isTrained: riskModel ? true : false, // Simplified check
        lastTrained: lastModel?.created_at || null,
        accuracy: lastModel?.accuracy || null,
        trainingSamples,
      };
    } catch (error) {
      console.error('Error getting model stats:', error);
      return {
        isTrained: false,
        lastTrained: null,
        accuracy: null,
        trainingSamples: 0,
      };
    }
  }
}
