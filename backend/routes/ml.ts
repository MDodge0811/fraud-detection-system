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
    res.status(500).json({
      success: false,
      error: 'Failed to get ML model statistics',
    });
  }
});

// Train/retrain the ML model
router.post('/train', async (req, res) => {
  try {
    await trainModel();
    const stats = await getModelStats();
    
    res.json({
      success: true,
      message: 'Model training completed successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Error training ML model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to train ML model',
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
    res.status(500).json({
      success: false,
      error: 'Failed to get training data statistics',
    });
  }
});

export default router; 