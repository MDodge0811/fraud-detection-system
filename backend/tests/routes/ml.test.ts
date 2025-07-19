import request from 'supertest';
import express from 'express';
import { prisma } from '../../prisma/client';
import mlRouter from '../../routes/ml';

// Create test app
const app = express();
app.use(express.json());
app.use('/ml', mlRouter);

// Mock the ML services
jest.mock('../../services/mlRiskAnalyzer', () => ({
  trainModel: jest.fn(),
  getModelStats: jest.fn(),
}));

import { trainModel, getModelStats } from '../../services/mlRiskAnalyzer';

const mockTrainModel = trainModel as jest.MockedFunction<typeof trainModel>;
const mockGetModelStats = getModelStats as jest.MockedFunction<typeof getModelStats>;

describe('ML Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /ml/stats', () => {
    it('should return model statistics successfully', async () => {
      const mockStats = {
        isTrained: true,
        lastTrained: new Date(),
        accuracy: 0.95,
        trainingSamples: 1000,
      };

      mockGetModelStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/ml/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          ...mockStats,
          lastTrained: mockStats.lastTrained.toISOString(), // Date gets serialized
        },
      });
      expect(mockGetModelStats).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when no model exists', async () => {
      const error = new Error('No existing model found');
      mockGetModelStats.mockRejectedValue(error);

      const response = await request(app)
        .get('/ml/stats')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'No ML model found. Please train a model first.',
        code: 'MODEL_NOT_FOUND',
      });
    });

    it('should return 503 when database is unavailable', async () => {
      const error = new Error('database connection failed');
      mockGetModelStats.mockRejectedValue(error);

      const response = await request(app)
        .get('/ml/stats')
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        error: 'ML service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    });

    it('should return 500 for unexpected errors', async () => {
      const error = new Error('Unexpected error');
      mockGetModelStats.mockRejectedValue(error);

      const response = await request(app)
        .get('/ml/stats')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error while retrieving ML model statistics',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  describe('POST /ml/train', () => {
    it('should train model successfully and return 201', async () => {
      const mockStats = {
        isTrained: true,
        lastTrained: new Date(),
        accuracy: 0.96,
        trainingSamples: 1200,
      };

      mockTrainModel.mockResolvedValue(undefined);
      mockGetModelStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .post('/ml/train')
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Model training completed successfully',
        data: {
          ...mockStats,
          lastTrained: mockStats.lastTrained.toISOString(), // Date gets serialized
        },
      });
      expect(mockTrainModel).toHaveBeenCalledTimes(1);
      expect(mockGetModelStats).toHaveBeenCalledTimes(1);
    });

    it('should return 422 when insufficient training data', async () => {
      const error = new Error('insufficient data for training');
      mockTrainModel.mockRejectedValue(error);

      const response = await request(app)
        .post('/ml/train')
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient training data. Need more samples to train the model.',
        code: 'INSUFFICIENT_DATA',
      });
    });

    it('should return 422 when model validation fails', async () => {
      const error = new Error('Model validation failed');
      mockTrainModel.mockRejectedValue(error);

      const response = await request(app)
        .post('/ml/train')
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        error: 'Model validation failed',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should return 503 when database is unavailable', async () => {
      const error = new Error('database connection failed');
      mockTrainModel.mockRejectedValue(error);

      const response = await request(app)
        .post('/ml/train')
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        error: 'ML service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    });

    it('should return 500 for unexpected errors', async () => {
      const error = new Error('Unexpected error');
      mockTrainModel.mockRejectedValue(error);

      const response = await request(app)
        .post('/ml/train')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error during model training',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  describe('GET /ml/training-data', () => {
    beforeEach(async () => {
      // Create test training data
      await prisma.training_data.createMany({
        data: [
          {
            features: { amount: 100, location: 'US' },
            label: 0,
            created_at: new Date(),
          },
          {
            features: { amount: 5000, location: 'US' },
            label: 1,
            created_at: new Date(),
          },
          {
            features: { amount: 200, location: 'CA' },
            label: 0,
            created_at: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
          },
        ],
      });
    });

    it('should return training data statistics successfully', async () => {
      const response = await request(app)
        .get('/ml/training-data')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          totalSamples: 3,
          recentSamples: 2, // Last 24 hours
          fraudSamples: 1,
          legitimateSamples: 2,
          fraudRatio: '33.33',
        },
      });
    });

    it('should return 503 when database is unavailable', async () => {
      // Mock database error
      jest.spyOn(prisma.training_data, 'count').mockRejectedValue(new Error('database connection failed'));

      const response = await request(app)
        .get('/ml/training-data')
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        error: 'Training data service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });

      // Restore original
      jest.restoreAllMocks();
    });

    it('should return 500 for unexpected errors', async () => {
      // Mock unexpected error
      jest.spyOn(prisma.training_data, 'count').mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .get('/ml/training-data')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error while retrieving training data statistics',
        code: 'INTERNAL_ERROR',
      });

      jest.restoreAllMocks();
    });

    it('should handle zero samples correctly', async () => {
      // Clear all training data
      await prisma.training_data.deleteMany();

      const response = await request(app)
        .get('/ml/training-data')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          totalSamples: 0,
          recentSamples: 0,
          fraudSamples: 0,
          legitimateSamples: 0,
          fraudRatio: '0',
        },
      });
    });
  });
}); 