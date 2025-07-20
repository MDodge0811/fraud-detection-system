import express from 'express';
import { prisma } from '../prisma/client';
import { analyzeTransactionRisk, getSimulationStatus } from '../services';
import mlRouter from './ml';
import { handleRouteError, ErrorMessages, ErrorCodes } from '../utils/errorHandler';
import { isValidTimeframe, getCreatedAtFilter, getTimestampFilter } from '../utils/timeframeFilter';



const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Alerts endpoint - GET alerts with timeframe and pagination
router.get('/alerts', async (req, res) => {
  try {
    // Input validation
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const timeframe = (req.query.timeframe as string) || '24h';

    // Validate parameters
    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
      return res.status(400).json({
        success: false,
        error: ErrorMessages.INVALID_LIMIT,
        code: ErrorCodes.INVALID_LIMIT,
      });
    }

    if (req.query.page && (isNaN(page) || page < 1)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page parameter',
        code: 'INVALID_PAGE',
      });
    }

    if (!isValidTimeframe(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe parameter',
        code: 'INVALID_TIMEFRAME',
      });
    }

    const skip = (page - 1) * limit;
    const timeFilter = timeframe === 'all' ? {} : getCreatedAtFilter(timeframe);

    const [alerts, totalCount] = await Promise.all([
      prisma.alerts.findMany({
        where: timeFilter,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
        include: {
          transactions: {
            include: {
              users: true,
              merchants: true,
              devices: true,
            },
          },
        },
      }),
      prisma.alerts.count({ where: timeFilter }),
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        count: alerts.length,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
        timeframe,
      },
    });
  } catch (error) {
    handleRouteError(error, res, 'ALERTS', 'FETCHING_ALERTS');
  }
});

// Transactions endpoint - GET transactions with timeframe and pagination
router.get('/transactions', async (req, res) => {
  try {
    // Input validation
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const timeframe = (req.query.timeframe as string) || '24h';

    // Validate parameters
    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
      return res.status(400).json({
        success: false,
        error: ErrorMessages.INVALID_LIMIT,
        code: ErrorCodes.INVALID_LIMIT,
      });
    }

    if (req.query.page && (isNaN(page) || page < 1)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page parameter',
        code: 'INVALID_PAGE',
      });
    }

    if (!isValidTimeframe(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe parameter',
        code: 'INVALID_TIMEFRAME',
      });
    }

    const skip = (page - 1) * limit;
    const timeFilter = timeframe === 'all' ? {} : getTimestampFilter(timeframe);

    const [transactions, totalCount] = await Promise.all([
      prisma.transactions.findMany({
        where: timeFilter,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip,
        include: {
          users: true,
          merchants: true,
          devices: true,
          alerts: true,
          risk_signals: true,
        },
      }),
      prisma.transactions.count({ where: timeFilter }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        count: transactions.length,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
        timeframe,
      },
    });
  } catch (error) {
    handleRouteError(error, res, 'TRANSACTIONS', 'FETCHING_TRANSACTIONS');
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
        error: ErrorMessages.INVALID_LIMIT,
        code: ErrorCodes.INVALID_LIMIT,
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
    handleRouteError(error, res, 'RISK_SIGNALS', 'FETCHING_RISK_SIGNALS');
  }
});

// Dashboard stats endpoint - Real-time statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalAlerts,
      openAlerts,
      totalTransactions,
      highRiskTransactions,
      todayTransactions,
      todayAlerts,
      avgRiskScore,
    ] = await Promise.all([
      prisma.alerts.count(),
      prisma.alerts.count({ where: { status: 'open' } }),
      prisma.transactions.count(),
      prisma.risk_signals.count({ where: { risk_score: { gte: 75 } } }),
      prisma.transactions.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.alerts.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.risk_signals.aggregate({
        _avg: { risk_score: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalAlerts,
        openAlerts,
        totalTransactions,
        highRiskTransactions,
        todayTransactions,
        todayAlerts,
        alertResolutionRate: totalAlerts > 0 ? ((totalAlerts - openAlerts) / totalAlerts * 100).toFixed(2) : '0',
        avgRiskScore: avgRiskScore._avg.risk_score?.toFixed(2) || '0',
      },
    });
  } catch (error) {
    handleRouteError(error, res, 'DASHBOARD', 'FETCHING_DASHBOARD_STATS');
  }
});

// Dashboard charts endpoint - Aggregated data for charts
router.get('/dashboard/charts', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || '24h';

    if (!isValidTimeframe(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe parameter',
        code: 'INVALID_TIMEFRAME',
      });
    }

    const [
      alertTrends,
      riskDistribution,
      transactionVolume,
    ] = await Promise.all([
      // Alert trends by hour
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', created_at) as hour_bucket,
          COUNT(*) as alert_count,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_alerts
        FROM alerts 
        WHERE created_at >= NOW() - INTERVAL '${timeframe === 'all' ? '30 days' : timeframe}'
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour_bucket DESC
        LIMIT 100
      `,
      // Risk distribution
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN risk_score < 30 THEN 'low'
            WHEN risk_score < 70 THEN 'medium'
            ELSE 'high'
          END as risk_level,
          COUNT(*) as count
        FROM risk_signals 
        WHERE created_at >= NOW() - INTERVAL '${timeframe === 'all' ? '30 days' : timeframe}'
        GROUP BY risk_level
        ORDER BY count DESC
      `,
      // Transaction volume by hour
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour_bucket,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount
        FROM transactions 
        WHERE timestamp >= NOW() - INTERVAL '${timeframe === 'all' ? '30 days' : timeframe}'
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour_bucket DESC
        LIMIT 100
      `,
    ]);

    res.json({
      success: true,
      data: {
        alertTrends,
        riskDistribution,
        transactionVolume,
        timeframe,
      },
    });
  } catch (error) {
    handleRouteError(error, res, 'DASHBOARD', 'FETCHING_CHART_DATA');
  }
});

// Alert trends endpoint - Using aggregation view
router.get('/dashboard/alert-trends', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || '24h';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    if (!isValidTimeframe(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe parameter',
        code: 'INVALID_TIMEFRAME',
      });
    }

    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
      return res.status(400).json({
        success: false,
        error: ErrorMessages.INVALID_LIMIT,
        code: ErrorCodes.INVALID_LIMIT,
      });
    }

    let query = '';
    if (timeframe === 'all') {
      query = `SELECT * FROM alert_trends_hourly ORDER BY hour_bucket DESC LIMIT ${limit}`;
    } else {
      const interval = timeframe === '1h' ? '1 hour' : 
                      timeframe === '6h' ? '6 hours' : 
                      timeframe === '12h' ? '12 hours' : 
                      timeframe === '24h' ? '24 hours' : 
                      timeframe === '7d' ? '7 days' : '30 days';
      query = `SELECT * FROM alert_trends_hourly WHERE hour_bucket >= NOW() - INTERVAL '${interval}' ORDER BY hour_bucket DESC LIMIT ${limit}`;
    }

    const alertTrends = await prisma.$queryRawUnsafe(query);

    res.json({
      success: true,
      data: alertTrends,
      pagination: {
        count: Array.isArray(alertTrends) ? alertTrends.length : 0,
        limit,
        timeframe,
      },
    });
  } catch (error) {
    handleRouteError(error, res, 'DASHBOARD', 'FETCHING_ALERT_TRENDS');
  }
});

// Risk distribution endpoint - Using aggregation view
router.get('/dashboard/risk-distribution', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || 'all';

    if (!isValidTimeframe(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe parameter',
        code: 'INVALID_TIMEFRAME',
      });
    }

    let query = '';
    if (timeframe === 'all') {
      query = 'SELECT * FROM risk_distribution';
    } else {
      const interval = timeframe === '1h' ? '1 hour' : 
                      timeframe === '6h' ? '6 hours' : 
                      timeframe === '12h' ? '12 hours' : 
                      timeframe === '24h' ? '24 hours' : 
                      timeframe === '7d' ? '7 days' : '30 days';
      query = `
        SELECT 
          CASE 
            WHEN rs.risk_score < 30 THEN 'low'
            WHEN rs.risk_score < 70 THEN 'medium'
            ELSE 'high'
          END as risk_level,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM risk_signals rs2 WHERE rs2.created_at >= NOW() - INTERVAL '${interval}'), 2) as percentage
        FROM risk_signals rs
        WHERE rs.created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY risk_level
        ORDER BY count DESC
      `;
    }

    const riskDistribution = await prisma.$queryRawUnsafe(query);

    res.json({
      success: true,
      data: riskDistribution,
      timeframe,
    });
  } catch (error) {
    handleRouteError(error, res, 'DASHBOARD', 'FETCHING_RISK_DISTRIBUTION');
  }
});

// Transaction volume endpoint - Using aggregation view
router.get('/dashboard/transaction-volume', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || '24h';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    if (!isValidTimeframe(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe parameter',
        code: 'INVALID_TIMEFRAME',
      });
    }

    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
      return res.status(400).json({
        success: false,
        error: ErrorMessages.INVALID_LIMIT,
        code: ErrorCodes.INVALID_LIMIT,
      });
    }

    let query = '';
    if (timeframe === 'all') {
      query = `SELECT * FROM transaction_volume_hourly ORDER BY hour_bucket DESC LIMIT ${limit}`;
    } else {
      const interval = timeframe === '1h' ? '1 hour' : 
                      timeframe === '6h' ? '6 hours' : 
                      timeframe === '12h' ? '12 hours' : 
                      timeframe === '24h' ? '24 hours' : 
                      timeframe === '7d' ? '7 days' : '30 days';
      query = `SELECT * FROM transaction_volume_hourly WHERE hour_bucket >= NOW() - INTERVAL '${interval}' ORDER BY hour_bucket DESC LIMIT ${limit}`;
    }

    const transactionVolume = await prisma.$queryRawUnsafe(query);

    res.json({
      success: true,
      data: transactionVolume,
      pagination: {
        count: Array.isArray(transactionVolume) ? transactionVolume.length : 0,
        limit,
        timeframe,
      },
    });
  } catch (error) {
    handleRouteError(error, res, 'DASHBOARD', 'FETCHING_TRANSACTION_VOLUME');
  }
});

// Recent activity endpoint - Using aggregation view
router.get('/dashboard/recent-activity', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
      return res.status(400).json({
        success: false,
        error: ErrorMessages.INVALID_LIMIT,
        code: ErrorCodes.INVALID_LIMIT,
      });
    }

    const recentActivity = await prisma.$queryRawUnsafe(`
      SELECT * FROM recent_activity 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `);

    res.json({
      success: true,
      data: recentActivity,
      pagination: {
        count: Array.isArray(recentActivity) ? recentActivity.length : 0,
        limit,
      },
    });
  } catch (error) {
    handleRouteError(error, res, 'DASHBOARD', 'FETCHING_RECENT_ACTIVITY');
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
    handleRouteError(error, res, 'SIMULATION', 'GETTING_SIMULATION_STATUS');
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
        error: ErrorMessages.INVALID_TRANSACTION_ID,
        code: ErrorCodes.INVALID_TRANSACTION_ID,
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
        error: ErrorMessages.TRANSACTION_NOT_FOUND,
        code: ErrorCodes.TRANSACTION_NOT_FOUND,
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
    handleRouteError(error, res, 'TRANSACTION_SERVICE', 'ANALYZING_TRANSACTION_RISK');
  }
});

// Mount ML routes
router.use('/ml', mlRouter);

export default router;
