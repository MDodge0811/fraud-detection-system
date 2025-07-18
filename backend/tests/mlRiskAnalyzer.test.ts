import { analyzeTransactionRiskML, trainModel, getModelStats } from '../services/mlRiskAnalyzer';
import { prisma } from '../prisma/client';

describe('ML Risk Analyzer', () => {
  let user: any, device: any, merchant: any;

  beforeAll(async () => {
    // Create test data
    user = await prisma.users.create({
      data: { name: 'ML Test User', email: 'mltest@example.com' },
    });
    device = await prisma.devices.create({
      data: { user_id: user.user_id, fingerprint: 'ml-test-device' },
    });
    merchant = await prisma.merchants.create({
      data: { name: 'ML Test Merchant', category: 'Test', risk_level: 85 },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.ml_models.deleteMany({ where: { model_type: 'risk_analyzer' } });
    await prisma.training_data.deleteMany({ where: { transaction_id: { not: undefined } } });
    await prisma.alerts.deleteMany({ where: { transaction_id: { not: undefined } } });
    await prisma.risk_signals.deleteMany({ where: { transaction_id: { not: undefined } } });
    await prisma.transactions.deleteMany({ where: { user_id: user.user_id } });
    await prisma.devices.deleteMany({ where: { user_id: user.user_id } });
    await prisma.users.delete({ where: { user_id: user.user_id } });
    await prisma.merchants.delete({ where: { merchant_id: merchant.merchant_id } });
    await prisma.$disconnect();
  });

  describe('analyzeTransactionRiskML', () => {
    it('should return risk analysis with ML features', async () => {
      const amount = 5000;
      const result = await analyzeTransactionRiskML(
        'test-tx-1',
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        amount,
      );

      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('mlConfidence');

      expect(typeof result.riskScore).toBe('number');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);

      expect(result.features).toHaveProperty('normalizedAmount');
      expect(result.features).toHaveProperty('timeOfDay');
      expect(result.features).toHaveProperty('dayOfWeek');
      expect(result.features).toHaveProperty('deviceFingerprintRisk');
      expect(result.features).toHaveProperty('userBehaviorScore');
      expect(result.features).toHaveProperty('transactionPatternRisk');

      expect(Array.isArray(result.reasons)).toBe(true);
      expect(typeof result.mlConfidence).toBe('number');
      expect(result.mlConfidence).toBeGreaterThanOrEqual(0);
      expect(result.mlConfidence).toBeLessThanOrEqual(100);
    });

    it('should handle high-risk transactions correctly', async () => {
      const amount = 15000; // High amount
      const result = await analyzeTransactionRiskML(
        'test-tx-2',
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        amount,
      );

      expect(result.riskScore).toBeGreaterThan(50); // Should be high risk
      expect(result.reasons).toContainEqual(expect.stringContaining('High transaction amount'));
    });

    it('should handle new device risk', async () => {
      const newDevice = await prisma.devices.create({
        data: { user_id: user.user_id, fingerprint: 'brand-new-device' },
      });

      const result = await analyzeTransactionRiskML(
        'test-tx-3',
        user.user_id,
        newDevice.device_id,
        merchant.merchant_id,
        100,
      );

      expect(result.reasons).toContainEqual(expect.stringContaining('New device'));
      expect(result.features.deviceFingerprintRisk).toBeGreaterThan(0.5);

      // Clean up
      await prisma.devices.delete({ where: { device_id: newDevice.device_id } });
    });

    it('should handle missing data gracefully', async () => {
      const result = await analyzeTransactionRiskML(
        'test-tx-4',
        'non-existent-user',
        'non-existent-device',
        'non-existent-merchant',
        100,
      );

      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('reasons');
      expect(result.reasons).toContainEqual(expect.stringContaining('ML analysis failed'));
    });
  });

  describe('Model Training', () => {
    beforeEach(async () => {
      // Clear existing models
      await prisma.ml_models.deleteMany({ where: { model_type: 'risk_analyzer' } });
    });

    it('should train model with sufficient data', async () => {
      // Create training data
      const trainingData = [];
      for (let i = 0; i < 150; i++) {
        trainingData.push({
          features: [0.5, 0.3, 0.7, 0.2, 0.4, 0.5, 0.3, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5],
          label: i < 50 ? 1 : 0, // 50 fraud, 100 legitimate
          created_at: new Date(),
        });
      }

      await prisma.training_data.createMany({ data: trainingData });

      // Train model
      await trainModel();

      // Check model stats
      const stats = await getModelStats();
      expect(stats.isTrained).toBe(true);
      expect(stats.trainingSamples).toBeGreaterThanOrEqual(150);
      expect(stats.accuracy).toBeGreaterThan(0);
      expect(stats.accuracy).toBeLessThanOrEqual(1);
    });

    it('should not train with insufficient data', async () => {
      // Clear all training data
      await prisma.training_data.deleteMany();

      // Try to train with no data
      await trainModel();

      const stats = await getModelStats();
      expect(stats.isTrained).toBe(false);
    });
  });

  describe('Model Statistics', () => {
    it('should return model statistics', async () => {
      const stats = await getModelStats();

      expect(stats).toHaveProperty('isTrained');
      expect(stats).toHaveProperty('lastTrained');
      expect(stats).toHaveProperty('accuracy');
      expect(stats).toHaveProperty('trainingSamples');

      expect(typeof stats.isTrained).toBe('boolean');
      expect(typeof stats.trainingSamples).toBe('number');
      expect(stats.trainingSamples).toBeGreaterThanOrEqual(0);

      if (stats.isTrained) {
        expect(stats.lastTrained).toBeInstanceOf(Date);
        expect(typeof stats.accuracy).toBe('number');
        expect(stats.accuracy).toBeGreaterThanOrEqual(0);
        expect(stats.accuracy).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Feature Extraction', () => {
    it('should extract comprehensive features', async () => {
      const result = await analyzeTransactionRiskML(
        'test-tx-5',
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        1000,
      );

      const features = result.features;

      // Check basic features
      expect(features.normalizedAmount).toBeGreaterThanOrEqual(0);
      expect(features.normalizedAmount).toBeLessThanOrEqual(1);
      expect(features.normalizedDeviceAge).toBeGreaterThanOrEqual(0);
      expect(features.normalizedDeviceAge).toBeLessThanOrEqual(1);
      expect(features.normalizedMerchantRisk).toBeGreaterThanOrEqual(0);
      expect(features.normalizedMerchantRisk).toBeLessThanOrEqual(1);

      // Check advanced features
      expect(features.timeOfDay).toBeGreaterThanOrEqual(0);
      expect(features.timeOfDay).toBeLessThanOrEqual(1);
      expect(features.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(features.dayOfWeek).toBeLessThanOrEqual(1);
      expect(features.deviceFingerprintRisk).toBeGreaterThanOrEqual(0);
      expect(features.deviceFingerprintRisk).toBeLessThanOrEqual(1);
      expect(features.userBehaviorScore).toBeGreaterThanOrEqual(0);
      expect(features.userBehaviorScore).toBeLessThanOrEqual(1);
      expect(features.transactionPatternRisk).toBeGreaterThanOrEqual(0);
      expect(features.transactionPatternRisk).toBeLessThanOrEqual(1);

      // Check raw data
      expect(features.raw).toHaveProperty('amount');
      expect(features.raw).toHaveProperty('deviceAge');
      expect(features.raw).toHaveProperty('merchantRisk');
      expect(features.raw).toHaveProperty('hour');
      expect(features.raw).toHaveProperty('day');
      expect(features.raw).toHaveProperty('userTransactionCount');
    });
  });

  describe('Risk Scoring', () => {
    it('should provide consistent risk scores', async () => {
      const amount = 2000;
      const result1 = await analyzeTransactionRiskML(
        'test-tx-6',
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        amount,
      );

      const result2 = await analyzeTransactionRiskML(
        'test-tx-7',
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        amount,
      );

      // Scores should be similar for same parameters
      expect(Math.abs(result1.riskScore - result2.riskScore)).toBeLessThan(20);
    });

    it('should provide higher scores for higher amounts', async () => {
      const result1 = await analyzeTransactionRiskML(
        'test-tx-8',
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        100,
      );

      const result2 = await analyzeTransactionRiskML(
        'test-tx-9',
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        10000,
      );

      expect(result2.riskScore).toBeGreaterThan(result1.riskScore);
    });
  });
}); 