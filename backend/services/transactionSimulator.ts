import { prisma } from '../prisma/client';
import { analyzeTransactionRiskML } from './mlRiskAnalyzer';
import { analyzeTransactionRisk } from './riskAnalyzer';

// Extend global type for WebSocket server
declare global {
  var io: Server | undefined;
}

// Enhanced transaction generation with fraud patterns
function generateRandomAmount(): number {
  // Generate more diverse amounts including high-risk patterns
  const patterns = [
    // Normal transactions (70% of the time)
    () => Math.random() * 5000 + 100,
    // High-value transactions (15% of the time) - potential fraud
    () => Math.random() * 15000 + 8000,
    // Micro-transactions (10% of the time) - potential testing fraud
    () => Math.random() * 50 + 1,
    // Suspicious round amounts (5% of the time) - potential fraud
    () => [1000, 2000, 5000, 10000, 15000][Math.floor(Math.random() * 5)],
  ];

  const patternWeights = [0.7, 0.15, 0.1, 0.05];
  const random = Math.random();
  let cumulativeWeight = 0;

  for (let i = 0; i < patterns.length; i++) {
    cumulativeWeight += patternWeights[i];
    if (random <= cumulativeWeight) {
      return patterns[i]();
    }
  }

  return patterns[0](); // Fallback to normal transaction
}

// Enhanced user selection with fraud patterns
async function getRandomUser(): Promise<any> {
  const users = await prisma.users.findMany();
  if (users.length === 0) return null;

  // 80% chance of normal user, 20% chance of suspicious user
  const isSuspicious = Math.random() < 0.2;
  
  if (isSuspicious) {
    // Select users with fewer transactions (new accounts - higher fraud risk)
    const suspiciousUsers = users.filter(user => 
      user.transactions && user.transactions.length < 5
    );
    if (suspiciousUsers.length > 0) {
      return suspiciousUsers[Math.floor(Math.random() * suspiciousUsers.length)];
    }
  }

  return users[Math.floor(Math.random() * users.length)];
}

// Enhanced device selection with fraud patterns
async function getRandomDevice(): Promise<any> {
  const devices = await prisma.devices.findMany();
  if (devices.length === 0) return null;

  // 75% chance of normal device, 25% chance of suspicious device
  const isSuspicious = Math.random() < 0.25;
  
  if (isSuspicious) {
    // Select newer devices (higher fraud risk)
    const suspiciousDevices = devices.filter(device => {
      const deviceAge = Math.floor((Date.now() - new Date(device.last_seen || Date.now()).getTime()) / (1000 * 60 * 60));
      return deviceAge < 24; // Less than 24 hours old
    });
    if (suspiciousDevices.length > 0) {
      return suspiciousDevices[Math.floor(Math.random() * suspiciousDevices.length)];
    }
  }

  return devices[Math.floor(Math.random() * devices.length)];
}

// Enhanced merchant selection with fraud patterns
async function getRandomMerchant(): Promise<any> {
  const merchants = await prisma.merchants.findMany();
  if (merchants.length === 0) return null;

  // 70% chance of normal merchant, 30% chance of high-risk merchant
  const isHighRisk = Math.random() < 0.3;
  
  if (isHighRisk) {
    // Select merchants with higher risk levels
    const highRiskMerchants = merchants.filter(merchant => 
      (merchant.risk_level || 50) > 70
    );
    if (highRiskMerchants.length > 0) {
      return highRiskMerchants[Math.floor(Math.random() * highRiskMerchants.length)];
    }
  }

  return merchants[Math.floor(Math.random() * merchants.length)];
}

// Generate suspicious transaction patterns
function generateSuspiciousTransaction(): any {
  const patterns = [
    // Rapid successive transactions
    { type: 'rapid_succession', multiplier: 1.5 },
    // Off-hours transaction
    { type: 'off_hours', multiplier: 1.3 },
    // Unusual amount pattern
    { type: 'unusual_amount', multiplier: 1.4 },
    // New user/device combination
    { type: 'new_combination', multiplier: 1.6 },
  ];

  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Emit real-time updates via WebSocket
function emitRealtimeUpdate(event: string, data: any) {
  if (global.io) {
    global.io.emit(event, data);
  }
}

// Enhanced transaction simulation function
export async function simulateTransaction() {
  try {
    // Get random entities with fraud patterns
    const user = await getRandomUser();
    const device = await getRandomDevice();
    const merchant = await getRandomMerchant();

    if (!user || !device || !merchant) {
      console.log('⚠️  Skipping transaction simulation - missing seed data');
      return;
    }

    // Generate transaction with enhanced patterns
    const amount = generateRandomAmount();
    const suspiciousPattern = generateSuspiciousTransaction();
    
    // Apply suspicious pattern modifications
    let finalAmount = amount;
    let transactionNotes = '';
    
    if (suspiciousPattern.type === 'rapid_succession') {
      // Simulate rapid successive transactions
      const recentTransactions = await prisma.transactions.count({
        where: {
          user_id: user.user_id,
          timestamp: { gte: new Date(Date.now() - 2 * 60 * 1000) }, // Last 2 minutes
        },
      });
      if (recentTransactions > 3) {
        finalAmount *= suspiciousPattern.multiplier;
        transactionNotes = 'Rapid successive transactions detected';
      }
    } else if (suspiciousPattern.type === 'off_hours') {
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        finalAmount *= suspiciousPattern.multiplier;
        transactionNotes = 'Off-hours transaction';
      }
    } else if (suspiciousPattern.type === 'unusual_amount') {
      // Check if amount is unusual for this user
      const userAvg = await prisma.transactions.aggregate({
        where: { user_id: user.user_id },
        _avg: { amount: true },
      });
      const avgAmount = Number(userAvg._avg.amount) || 1000;
      if (Math.abs(finalAmount - avgAmount) > avgAmount * 2) {
        finalAmount *= suspiciousPattern.multiplier;
        transactionNotes = 'Unusual amount for user';
      }
    } else if (suspiciousPattern.type === 'new_combination') {
      // Check if this user-device combination is new
      const existingTransactions = await prisma.transactions.count({
        where: {
          user_id: user.user_id,
          device_id: device.device_id,
        },
      });
      if (existingTransactions === 0) {
        finalAmount *= suspiciousPattern.multiplier;
        transactionNotes = 'New user-device combination';
      }
    }

    const transaction = await prisma.transactions.create({
      data: {
        user_id: user.user_id,
        device_id: device.device_id,
        merchant_id: merchant.merchant_id,
        amount: finalAmount,
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

    // Analyze transaction risk using both analyzers
    const [mlRiskAnalysis, basicRiskAnalysis] = await Promise.all([
      analyzeTransactionRiskML(
        transaction.transaction_id,
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        finalAmount,
      ),
      analyzeTransactionRisk(
        transaction.transaction_id,
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        finalAmount,
      ),
    ]);

    // Log both risk assessments
    console.log(`💳 Transaction: $${finalAmount}`);
    console.log(`   ML Risk: ${mlRiskAnalysis.riskScore}% (${getRiskLevel(mlRiskAnalysis.riskScore)})`);
    console.log(`   Basic Risk: ${basicRiskAnalysis.riskScore}% (${getRiskLevel(basicRiskAnalysis.riskScore)})`);
    console.log(`   ML Reasons: ${mlRiskAnalysis.reasons.join(', ')}`);
    console.log(`   Basic Reasons: ${basicRiskAnalysis.reasons.join(', ')}`);
    console.log('---');

    // Use ML risk analysis for the rest of the process
    const riskAnalysis = mlRiskAnalysis;

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
        features: {
          amount: finalAmount,
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
        label: riskAnalysis.riskScore >= 75 ? 1 : 0, // 1 for high risk, 0 for low risk
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
          reason: `${riskLevel} risk transaction: $${finalAmount} (${riskAnalysis.riskScore}%) - ${reasons}${transactionNotes ? ` - ${transactionNotes}` : ''}`,
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

      console.log(`🚨 HIGH RISK ALERT: $${finalAmount} (${riskAnalysis.riskScore}%) - ${reasons}${transactionNotes ? ` - ${transactionNotes}` : ''}`);
    } else if (riskAnalysis.riskScore >= 50) {
      const riskLevel = getRiskLevel(riskAnalysis.riskScore);
      console.log(`⚠️  ${riskLevel} risk transaction: $${finalAmount} (${riskAnalysis.riskScore}%)${transactionNotes ? ` - ${transactionNotes}` : ''}`);
    } else {
      console.log(`💳 Low risk transaction: $${finalAmount} (${riskAnalysis.riskScore}%)`);
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

// Start transaction simulation with increased frequency
export function startTransactionSimulation() {
  console.log('🔄 Starting enhanced transaction simulation (every 3 seconds)...');

  // Generate initial transaction
  simulateTransaction();

  // Set up interval for continuous simulation (increased frequency)
  return setInterval(simulateTransaction, 3000); // Every 3 seconds instead of 5
}

// Stop transaction simulation
export function stopTransactionSimulation(intervalId: NodeJS.Timeout) {
  console.log('🛑 Stopping transaction simulation...');
  clearInterval(intervalId);
}

// Get simulation status
export function getSimulationStatus() {
  return {
    isRunning: true,
    interval: 3000,
    description: 'Generates enhanced mock transactions every 3 seconds with fraud patterns',
  };
}

// Helper function to get risk level description
function getRiskLevel(riskScore: number): string {
  if (riskScore >= 90) return 'Critical';
  if (riskScore >= 80) return 'High';
  if (riskScore >= 70) return 'Elevated';
  if (riskScore >= 50) return 'Medium';
  return 'Low';
}
