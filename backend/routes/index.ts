import express from 'express';
import { prisma } from '../prisma/client';
import { analyzeTransactionRisk, getSimulationStatus } from '../services';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Alerts endpoint - GET alerts with optional limit
router.get('/alerts', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const allTime = req.query.allTime === 'true';

    const alerts = await prisma.alerts.findMany({
      orderBy: { created_at: 'desc' },
      take: allTime ? undefined : limit,
      include: {
        transactions: {
          include: {
            users: true,
            merchants: true,
            devices: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Transactions endpoint - GET transactions with optional limit
router.get('/transactions', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const allTime = req.query.allTime === 'true';

    const transactions = await prisma.transactions.findMany({
      orderBy: { timestamp: 'desc' },
      take: allTime ? undefined : limit,
      include: {
        users: true,
        merchants: true,
        devices: true,
        alerts: true,
        risk_signals: true,
      },
    });

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Risk signals endpoint - GET recent risk signals
router.get('/risk-signals', async (req, res) => {
  try {
    const riskSignals = await prisma.risk_signals.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        transactions: {
          include: {
            users: true,
            merchants: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: riskSignals,
      count: riskSignals.length,
    });
  } catch (error) {
    console.error('Error fetching risk signals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch risk signals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Dashboard stats endpoint
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalAlerts,
      openAlerts,
      totalTransactions,
      highRiskTransactions,
    ] = await Promise.all([
      prisma.alerts.count(),
      prisma.alerts.count({ where: { status: 'open' } }),
      prisma.transactions.count(),
      prisma.risk_signals.count({ where: { risk_score: { gte: 75 } } }),
    ]);

    res.json({
      success: true,
      data: {
        totalAlerts,
        openAlerts,
        totalTransactions,
        highRiskTransactions,
        alertResolutionRate: totalAlerts > 0 ? ((totalAlerts - openAlerts) / totalAlerts * 100).toFixed(2) : '0',
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Simulation control endpoints
router.get('/simulation/status', (req, res) => {
  try {
    const status = getSimulationStatus();

    res.json({
      success: true,
      data: {
        ...status,
        isRunning: !!global.simulationInterval,
      },
    });
  } catch (error) {
    console.error('Error getting simulation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulation status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Risk analysis endpoint
router.get('/risk-analysis/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Get transaction details
    const transaction = await prisma.transactions.findUnique({
      where: { transaction_id: transactionId },
      include: {
        users: true,
        merchants: true,
        devices: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    // Perform risk analysis
    const riskAnalysis = await analyzeTransactionRisk(
      transaction.transaction_id,
      transaction.user_id!,
      transaction.device_id!,
      transaction.merchant_id!,
      Number(transaction.amount),
    );

    res.json({
      success: true,
      data: {
        transaction,
        riskAnalysis,
      },
    });
  } catch (error) {
    console.error('Error analyzing transaction risk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze transaction risk',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
