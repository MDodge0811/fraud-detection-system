import express from 'express';
import { prisma } from './prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';
import { startTransactionSimulation, stopTransactionSimulation, getSimulationStatus } from './services';

// Extend global type for simulation interval
declare global {
  var simulationInterval: NodeJS.Timeout | undefined;
}

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Alerts endpoint - GET recent alerts
app.get('/alerts', async (req, res) => {
  try {
    const alerts = await prisma.alerts.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        transactions: {
          include: {
            users: true,
            merchants: true,
            devices: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Transactions endpoint - GET recent transactions
app.get('/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transactions.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        users: true,
        merchants: true,
        devices: true,
        alerts: true,
        risk_signals: true
      }
    });

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Risk signals endpoint - GET recent risk signals
app.get('/risk-signals', async (req, res) => {
  try {
    const riskSignals = await prisma.risk_signals.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        transactions: {
          include: {
            users: true,
            merchants: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: riskSignals,
      count: riskSignals.length
    });
  } catch (error) {
    console.error('Error fetching risk signals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch risk signals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard stats endpoint
app.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalAlerts,
      openAlerts,
      totalTransactions,
      highRiskTransactions
    ] = await Promise.all([
      prisma.alerts.count(),
      prisma.alerts.count({ where: { status: 'open' } }),
      prisma.transactions.count(),
      prisma.risk_signals.count({ where: { risk_score: { gte: 75 } } })
    ]);

    res.json({
      success: true,
      data: {
        totalAlerts,
        openAlerts,
        totalTransactions,
        highRiskTransactions,
        alertResolutionRate: totalAlerts > 0 ? ((totalAlerts - openAlerts) / totalAlerts * 100).toFixed(2) : '0'
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simulation control endpoints
app.get('/simulation/status', (req, res) => {
  try {
    const status = getSimulationStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        isRunning: !!global.simulationInterval
      }
    });
  } catch (error) {
    console.error('Error getting simulation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulation status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Route ${req.originalUrl} does not exist`
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🚨 Alerts endpoint: http://localhost:${PORT}/alerts`);
      console.log(`💳 Transactions endpoint: http://localhost:${PORT}/transactions`);
      console.log(`📈 Dashboard stats: http://localhost:${PORT}/dashboard/stats`);
      
      // Start transaction simulation after server is running
      const simulationInterval = startTransactionSimulation();
      
      // Store interval ID for graceful shutdown
      global.simulationInterval = simulationInterval;
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  // Stop transaction simulation
  if (global.simulationInterval) {
    stopTransactionSimulation(global.simulationInterval);
  }
  
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  
  // Stop transaction simulation
  if (global.simulationInterval) {
    stopTransactionSimulation(global.simulationInterval);
  }
  
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer(); 