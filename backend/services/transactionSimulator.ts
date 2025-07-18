import { prisma } from '../prisma/client';
import { analyzeTransactionRisk, getRiskLevel } from './riskAnalyzer';
import { Server } from 'socket.io';

// Extend global type for WebSocket server
declare global {
  var io: Server | undefined;
}

// Mock data generation functions
function generateRandomAmount(): number {
  // Generate amounts between $1 and $10,000
  return Math.floor(Math.random() * 10000) + 1;
}

async function getRandomUser() {
  const users = await prisma.users.findMany();
  if (users.length === 0) {return null;}
  return users[Math.floor(Math.random() * users.length)];
}

async function getRandomDevice() {
  const devices = await prisma.devices.findMany();
  if (devices.length === 0) {return null;}
  return devices[Math.floor(Math.random() * devices.length)];
}

async function getRandomMerchant() {
  const merchants = await prisma.merchants.findMany();
  if (merchants.length === 0) {return null;}
  return merchants[Math.floor(Math.random() * merchants.length)];
}

// Emit real-time updates via WebSocket
function emitRealtimeUpdate(event: string, data: any) {
  if (global.io) {
    global.io.emit(event, data);
  }
}

// Transaction simulation function
export async function simulateTransaction() {
  try {
    // Get random entities
    const user = await getRandomUser();
    const device = await getRandomDevice();
    const merchant = await getRandomMerchant();

    if (!user || !device || !merchant) {
      console.log('⚠️  Skipping transaction simulation - missing seed data');
      return;
    }

    // Generate transaction
    const amount = generateRandomAmount();
    const transaction = await prisma.transactions.create({
      data: {
        user_id: user.user_id,
        device_id: device.device_id,
        merchant_id: merchant.merchant_id,
        amount: amount,
        status: 'completed',
      },
      include: {
        users: true,
        merchants: true,
        devices: true,
      },
    });

    // Emit new transaction event
    emitRealtimeUpdate('transaction:new', {
      type: 'transaction',
      data: transaction,
      timestamp: new Date().toISOString(),
    });

    // Analyze transaction risk using real ML-based scoring
    const riskAnalysis = await analyzeTransactionRisk(
      transaction.transaction_id,
      user.user_id,
      device.device_id,
      merchant.merchant_id,
      amount,
    );

    // Create risk signal with real analysis
    const riskSignal = await prisma.risk_signals.create({
      data: {
        transaction_id: transaction.transaction_id,
        signal_type: 'ml_risk',
        risk_score: riskAnalysis.riskScore,
      },
      include: {
        transactions: {
          include: {
            users: true,
            merchants: true,
          },
        },
      },
    });

    // Emit new risk signal event
    emitRealtimeUpdate('risk-signal:new', {
      type: 'risk-signal',
      data: riskSignal,
      timestamp: new Date().toISOString(),
    });

    // Create training data record for ML model
    await prisma.training_data.create({
      data: {
        transaction_id: transaction.transaction_id,
        features_json: {
          amount: amount,
          device_age: riskAnalysis.features.raw?.deviceAge || 0,
          merchant_risk: riskAnalysis.features.raw?.merchantRisk || 50,
          transaction_frequency: riskAnalysis.features.raw?.recentTransactions || 0,
          avg_user_amount: riskAnalysis.features.raw?.avgUserAmount || 0,
          normalized_amount: riskAnalysis.features.normalizedAmount || 0,
          normalized_device_age: riskAnalysis.features.normalizedDeviceAge || 0,
          normalized_merchant_risk: riskAnalysis.features.normalizedMerchantRisk || 0.5,
          normalized_frequency: riskAnalysis.features.normalizedFrequency || 0,
          normalized_avg_amount: riskAnalysis.features.normalizedAvgAmount || 0,
        },
        label: riskAnalysis.riskScore >= 75 ? 0 : 1, // 0 or 1 for legitimate
      },
    });

    // Create alert if risk score is high
    if (riskAnalysis.riskScore >= 75) {
      const riskLevel = getRiskLevel(riskAnalysis.riskScore);
      const reasons = riskAnalysis.reasons.join(', ');

      const alert = await prisma.alerts.create({
        data: {
          transaction_id: transaction.transaction_id,
          risk_score: riskAnalysis.riskScore,
          reason: `${riskLevel} risk transaction: $${amount} (${riskAnalysis.riskScore}%) - ${reasons}`,
          status: 'open',
        },
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

      // Emit new alert event
      emitRealtimeUpdate('alert:new', {
        type: 'alert',
        data: alert,
        timestamp: new Date().toISOString(),
      });

      console.log(`🚨 ${riskLevel} risk transaction: $${amount} (${riskAnalysis.riskScore}%) - ${reasons}`);
    } else {
      const riskLevel = getRiskLevel(riskAnalysis.riskScore);
      console.log(`💳 Transaction created: $${amount} (${riskLevel} risk: ${riskAnalysis.riskScore}%)`);
    }

    // Emit dashboard stats update
    const [totalAlerts, openAlerts, totalTransactions, highRiskTransactions] = await Promise.all([
      prisma.alerts.count(),
      prisma.alerts.count({ where: { status: 'open' } }),
      prisma.transactions.count(),
      prisma.risk_signals.count({ where: { risk_score: { gte: 75 } } }),
    ]);

    emitRealtimeUpdate('dashboard:stats', {
      type: 'dashboard-stats',
      data: {
        totalAlerts,
        openAlerts,
        totalTransactions,
        highRiskTransactions,
        alertResolutionRate: totalAlerts > 0 ? ((totalAlerts - openAlerts) / totalAlerts * 100).toFixed(2) : '0',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error simulating transaction:', error);
  }
}

// Start transaction simulation
export function startTransactionSimulation() {
  console.log('🔄 Starting transaction simulation (every5seconds)...');

  // Generate initial transaction
  simulateTransaction();

  // Set up interval for continuous simulation
  return setInterval(simulateTransaction, 5000);
}

// Stop transaction simulation
export function stopTransactionSimulation(intervalId: NodeJS.Timeout) {
  console.log('🛑 Stopping transaction simulation...');
  clearInterval(intervalId);
}

// Get simulation status
export function getSimulationStatus() {
  return {
    isRunning: true, // This could be enhanced to track actual status
    interval: 5000,
    description: 'Generates mock transactions every 5 seconds',
  };
}
