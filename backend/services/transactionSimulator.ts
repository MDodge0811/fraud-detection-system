import { prisma } from '../prisma/client';
import { analyzeTransactionRisk, getRiskLevel } from './riskAnalyzer';

// Mock data generation functions
function generateRandomAmount(): number {
  // Generate amounts between $1 and $10,000
  return Math.floor(Math.random() * 10000) + 1;
}



async function getRandomUser() {
  const users = await prisma.users.findMany();
  if (users.length === 0) return null;
  return users[Math.floor(Math.random() * users.length)];
}

async function getRandomDevice() {
  const devices = await prisma.devices.findMany();
  if (devices.length === 0) return null;
  return devices[Math.floor(Math.random() * devices.length)];
}

async function getRandomMerchant() {
  const merchants = await prisma.merchants.findMany();
  if (merchants.length === 0) return null;
  return merchants[Math.floor(Math.random() * merchants.length)];
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
        status: 'completed'
      }
    });

    // Analyze transaction risk using real ML-based scoring
    const riskAnalysis = await analyzeTransactionRisk(
      transaction.transaction_id,
      user.user_id,
      device.device_id,
      merchant.merchant_id,
      amount
    );

    // Create risk signal with real analysis
    await prisma.risk_signals.create({
      data: {
        transaction_id: transaction.transaction_id,
        signal_type: 'ml_risk',
        risk_score: riskAnalysis.riskScore
      }
    });

    // Create alert if risk score is high
    if (riskAnalysis.riskScore >= 75) {
      const riskLevel = getRiskLevel(riskAnalysis.riskScore);
      const reasons = riskAnalysis.reasons.join(', ');
      
      await prisma.alerts.create({
        data: {
          transaction_id: transaction.transaction_id,
          risk_score: riskAnalysis.riskScore,
          reason: `${riskLevel} risk transaction: $${amount} (${riskAnalysis.riskScore}%) - ${reasons}`,
          status: 'open'
        }
      });
      console.log(`🚨 ${riskLevel} risk transaction: $${amount} (${riskAnalysis.riskScore}%) - ${reasons}`);
    } else {
      const riskLevel = getRiskLevel(riskAnalysis.riskScore);
      console.log(`💳 Transaction created: $${amount} (${riskLevel} risk: ${riskAnalysis.riskScore}%)`);
    }

  } catch (error) {
    console.error('❌ Error simulating transaction:', error);
  }
}

// Start transaction simulation
export function startTransactionSimulation() {
  console.log('🔄 Starting transaction simulation (every 5 seconds)...');
  
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
    description: 'Generates mock transactions every 5 seconds'
  };
} 