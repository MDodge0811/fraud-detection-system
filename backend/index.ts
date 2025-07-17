import express from 'express';
import { prisma } from '@/prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { startTransactionSimulation, stopTransactionSimulation, getSimulationStatus, analyzeTransactionRisk } from '@/services';

// Extend global type for simulation interval and WebSocket server
declare global {
  var simulationInterval: NodeJS.Timeout | undefined;
  var io: Server | undefined;
}

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store io globally for access in other modules
global.io = io;

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
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

// Risk analysis endpoint
app.get('/risk-analysis/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Get transaction details
    const transaction = await prisma.transactions.findUnique({
      where: { transaction_id: transactionId },
      include: {
        users: true,
        merchants: true,
        devices: true
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Perform risk analysis
    const riskAnalysis = await analyzeTransactionRisk(
      transaction.transaction_id,
      transaction.user_id!,
      transaction.device_id!,
      transaction.merchant_id!,
      Number(transaction.amount)
    );

    res.json({
      success: true,
      data: {
        transaction,
        riskAnalysis
      }
    });
  } catch (error) {
    console.error('Error analyzing transaction risk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze transaction risk',
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

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Send initial data to new client
  socket.emit('connected', { message: 'Connected to fraud detection system' });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  // Handle client requests for real-time data
  socket.on('subscribe:alerts', () => {
    socket.join('alerts');
    console.log('📡 Client subscribed to alerts:', socket.id);
  });
  
  socket.on('subscribe:transactions', () => {
    socket.join('transactions');
    console.log('📡 Client subscribed to transactions:', socket.id);
  });
  
  socket.on('subscribe:dashboard', () => {
    socket.join('dashboard');
    console.log('📡 Client subscribed to dashboard updates:', socket.id);
  });
  
  socket.on('unsubscribe:alerts', () => {
    socket.leave('alerts');
  });
  
  socket.on('unsubscribe:transactions', () => {
    socket.leave('transactions');
  });
  
  socket.on('unsubscribe:dashboard', () => {
    socket.leave('dashboard');
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🚨 Alerts endpoint: http://localhost:${PORT}/alerts`);
      console.log(`💳 Transactions endpoint: http://localhost:${PORT}/transactions`);
      console.log(`📈 Dashboard stats: http://localhost:${PORT}/dashboard/stats`);
      console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
      
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