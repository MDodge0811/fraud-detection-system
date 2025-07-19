import { Router } from 'express';
import { trainModel, getModelStats } from '../services/mlRiskAnalyzer';

const router = Router();

// Get ML model statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getModelStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting ML model stats:', error);

    // Check if it's a "no model found" scenario
    if (error instanceof Error && error.message.includes('No existing model')) {
      return res.status(404).json({
        success: false,
        error: 'No ML model found. Please train a model first.',
        code: 'MODEL_NOT_FOUND',
      });
    }

    // Check if it's a database connection issue
    if (error instanceof Error && error.message.includes('database')) {
      return res.status(503).json({
        success: false,
        error: 'ML service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    // Default to 500 for unexpected errors
    res.status(500).json({
      success: false,
      error: 'Internal server error while retrieving ML model statistics',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Train/retrain the ML model
router.post('/train', async (req, res) => {
  try {
    await trainModel();
    const stats = await getModelStats();

    res.status(201).json({
      success: true,
      message: 'Model training completed successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Error training ML model:', error);

    // Check if it's a training data issue
    if (error instanceof Error && error.message.includes('insufficient data')) {
      return res.status(422).json({
        success: false,
        error: 'Insufficient training data. Need more samples to train the model.',
        code: 'INSUFFICIENT_DATA',
      });
    }

    // Check if it's a database connection issue
    if (error instanceof Error && error.message.includes('database')) {
      return res.status(503).json({
        success: false,
        error: 'ML service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    // Check if it's a model validation error
    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(422).json({
        success: false,
        error: 'Model validation failed',
        code: 'VALIDATION_ERROR',
      });
    }

    // Default to 500 for unexpected errors
    res.status(500).json({
      success: false,
      error: 'Internal server error during model training',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Get training data statistics
router.get('/training-data', async (req, res) => {
  try {
    const { prisma } = await import('../prisma/client');

    const totalSamples = await prisma.training_data.count();
    const recentSamples = await prisma.training_data.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const fraudSamples = await prisma.training_data.count({
      where: { label: 1 },
    });

    const legitimateSamples = await prisma.training_data.count({
      where: { label: 0 },
    });

    res.json({
      success: true,
      data: {
        totalSamples,
        recentSamples,
        fraudSamples,
        legitimateSamples,
        fraudRatio: totalSamples > 0 ? (fraudSamples / totalSamples * 100).toFixed(2) : '0',
      },
    });
  } catch (error) {
    console.error('Error getting training data stats:', error);

    // Check if it's a database connection issue
    if (error instanceof Error && error.message.includes('database')) {
      return res.status(503).json({
        success: false,
        error: 'Training data service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    // Default to 500 for unexpected errors
    res.status(500).json({
      success: false,
      error: 'Internal server error while retrieving training data statistics',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router; 