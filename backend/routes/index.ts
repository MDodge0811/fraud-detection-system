import express from 'express';
import { prisma } from '../prisma/client';
import { analyzeTransactionRisk, getSimulationStatus } from '../services';
import mlRouter from './ml';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Alerts endpoint - GET alerts with optional limit
router.get('/alerts', async (req, res) => {
  try {
    // Input validation
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const allTime = req.query.allTime === 'true';

    // Validate limit parameter
    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 1000.',
        code: 'INVALID_LIMIT',
      });
    }

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
      pagination: {
        count: alerts.length,
        limit: allTime ? 'all' : limit,
        hasMore: allTime ? false : alerts.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);

    // Check if it's a database connection issue
    if (error instanceof Error && error.message.includes('database')) {
      return res.status(503).json({
        success: false,
        error: 'Alerts service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching alerts',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Transactions endpoint - GET transactions with optional limit
router.get('/transactions', async (req, res) => {
  try {
    // Input validation
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const allTime = req.query.allTime === 'true';

    // Validate limit parameter
    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 1000.',
        code: 'INVALID_LIMIT',
      });
    }

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
      pagination: {
        count: transactions.length,
        limit: allTime ? 'all' : limit,
        hasMore: allTime ? false : transactions.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    // Check if it's a database connection issue
    if (error instanceof Error && error.message.includes('database')) {
      return res.status(503).json({
        success: false,
        error: 'Transactions service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching transactions',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Risk signals endpoint - GET recent risk signals
router.get('/risk-signals', async (req, res) => {
  try {
    // Input validation
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    // Validate limit parameter
    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 1000.',
        code: 'INVALID_LIMIT',
      });
    }

    const riskSignals = await prisma.risk_signals.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
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
      pagination: {
        count: riskSignals.length,
        limit,
        hasMore: riskSignals.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching risk signals:', error);

    // Check if it's a database connection issue
    if (error instanceof Error && error.message.includes('database')) {
      return res.status(503).json({
        success: false,
        error: 'Risk signals service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching risk signals',
      code: 'INTERNAL_ERROR',
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

    // Check if it's a database connection issue
    if (error instanceof Error && error.message.includes('database')) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching dashboard stats',
      code: 'INTERNAL_ERROR',
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

    // Check if it's a service unavailable issue
    if (error instanceof Error && error.message.includes('simulation')) {
      return res.status(503).json({
        success: false,
        error: 'Simulation service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while getting simulation status',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Risk analysis endpoint
router.get('/risk-analysis/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Input validation
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID provided',
        code: 'INVALID_TRANSACTION_ID',
      });
    }

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
        code: 'TRANSACTION_NOT_FOUND',
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

    // Check if it's a risk analysis service issue
    if (error instanceof Error && error.message.includes('risk analysis')) {
      return res.status(503).json({
        success: false,
        error: 'Risk analysis service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    // Check if it's a database connection issue
    if (error instanceof Error && error.message.includes('database')) {
      return res.status(503).json({
        success: false,
        error: 'Transaction service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while analyzing transaction risk',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Mount ML routes
router.use('/ml', mlRouter);

export default router;
