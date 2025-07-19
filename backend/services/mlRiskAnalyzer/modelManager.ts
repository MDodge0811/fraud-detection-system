import { prisma } from '../../prisma/client';
import { RiskModel } from './types';
import { SimpleRiskModel } from './riskModel';

export class ModelManager {
  private riskModel: RiskModel | null = null;

  async initializeModel(): Promise<void> {
    if (this.riskModel) {
      return;
    }

    this.riskModel = new SimpleRiskModel();

    // Try to load existing model from database
    try {
      const savedModel = await prisma.ml_models.findFirst({
        where: { model_type: 'risk_analyzer' },
        orderBy: { created_at: 'desc' },
      });

      if (savedModel && savedModel.model_data) {
        this.riskModel.load(savedModel.model_data);
        console.log('Loaded existing simple risk model');
      } else {
        console.log('No existing model found, will use new simple risk model');
      }
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }

  getModel(): RiskModel | null {
    return this.riskModel;
  }

  setModel(model: RiskModel): void {
    this.riskModel = model;
  }
}
