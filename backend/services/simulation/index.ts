import { analyzeTransactionRiskML } from '../mlRiskAnalyzer';
import { analyzeTransactionRisk } from '../basicRiskAnalyzer';
import { SimulationConfig } from './config';
import { TransactionGenerator } from './transactionGenerator';
import { EventEmitter } from './eventEmitter';
import { DatabaseService } from './databaseService';
import { SimulationStatus } from './types';

export class TransactionSimulator {
  private transactionGenerator: TransactionGenerator;
  private eventEmitter: EventEmitter;
  private databaseService: DatabaseService;

  constructor() {
    this.transactionGenerator = new TransactionGenerator();
    this.eventEmitter = new EventEmitter();
    this.databaseService = new DatabaseService();
  }

  async simulateTransaction(): Promise<void> {
    try {
      // Get random entities with fraud patterns
      const user = await this.transactionGenerator.getRandomUser();
      const device = await this.transactionGenerator.getRandomDevice();
      const merchant = await this.transactionGenerator.getRandomMerchant();

      if (!user || !device || !merchant) {
        console.log('⚠️  Skipping transaction simulation - missing seed data');
        return;
      }

      // Generate transaction with enhanced patterns
      const amount = this.transactionGenerator.generateRandomAmount();
      const suspiciousPattern = this.transactionGenerator.generateSuspiciousPattern();

      // Apply suspicious pattern modifications
      const { finalAmount, notes } = await this.transactionGenerator.applySuspiciousPattern(
        suspiciousPattern,
        user,
        device,
        amount,
      );

      // Create transaction in database
      const transaction = await this.databaseService.createTransaction(
        user.user_id,
        device.device_id,
        merchant.merchant_id,
        finalAmount,
      );

      // Emit new transaction event
      this.eventEmitter.emitTransactionNew(transaction);

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
      console.log(`   ML Risk: ${mlRiskAnalysis.riskScore}% (${this.getRiskLevel(mlRiskAnalysis.riskScore)})`);
      console.log(`   Basic Risk: ${basicRiskAnalysis.riskScore}% (${this.getRiskLevel(basicRiskAnalysis.riskScore)})`);
      console.log(`   ML Reasons: ${mlRiskAnalysis.reasons.join(', ')}`);
      console.log(`   Basic Reasons: ${basicRiskAnalysis.reasons.join(', ')}`);
      console.log('---');

      // Use ML risk analysis for the rest of the process
      const riskAnalysis = mlRiskAnalysis;

      // Create risk signal with real analysis
      const riskSignal = await this.databaseService.createRiskSignal(
        transaction.transaction_id,
        riskAnalysis.riskScore,
      );

      // Emit new risk signal event
      this.eventEmitter.emitRiskSignalNew(riskSignal);

      // Note: Training data is already saved by the ML risk analyzer
      // No need to duplicate the database write here

      // Create alert if risk score is high
      if (riskAnalysis.riskScore >= SimulationConfig.RISK_THRESHOLDS.HIGH_RISK) {
        const reasons = riskAnalysis.reasons.join(', ');

        const alert = await this.databaseService.createAlert(
          transaction.transaction_id,
          riskAnalysis.riskScore,
          `${this.getRiskLevel(riskAnalysis.riskScore)} risk transaction: $${finalAmount} (${riskAnalysis.riskScore}%) - ${reasons}${notes ? ` - ${notes}` : ''}`,
        );

        // Emit new alert event
        this.eventEmitter.emitAlertNew(alert);

        console.log(`🚨 HIGH RISK ALERT: $${finalAmount} (${riskAnalysis.riskScore}%) - ${reasons}${notes ? ` - ${notes}` : ''}`);
      } else if (riskAnalysis.riskScore >= SimulationConfig.RISK_THRESHOLDS.MEDIUM_RISK) {
        console.log(`⚠️  ${this.getRiskLevel(riskAnalysis.riskScore)} risk transaction: $${finalAmount} (${riskAnalysis.riskScore}%)${notes ? ` - ${notes}` : ''}`);
      } else {
        console.log(`💳 Low risk transaction: $${finalAmount} (${riskAnalysis.riskScore}%)`);
      }

      // Emit dashboard stats update
      const stats = await this.databaseService.getDashboardStats();
      this.eventEmitter.emitDashboardStats(stats);

    } catch (error) {
      console.error('❌ Error simulating transaction:', error);
    }
  }

  startSimulation(): NodeJS.Timeout {
    // console.log('🔄 Starting enhanced transaction simulation (every 3 seconds)...');

    // Generate initial transaction
    this.simulateTransaction();

    // Set up interval for continuous simulation
    return setInterval(() => this.simulateTransaction(), SimulationConfig.SIMULATION.INTERVAL_MS);
  }

  stopSimulation(intervalId: NodeJS.Timeout): void {
    // console.log('🛑 Stopping transaction simulation...');
    clearInterval(intervalId);
  }

  getSimulationStatus(): SimulationStatus {
    return {
      isRunning: true,
      interval: SimulationConfig.SIMULATION.INTERVAL_MS,
      description: SimulationConfig.SIMULATION.DESCRIPTION,
    };
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore >= SimulationConfig.RISK_THRESHOLDS.CRITICAL_RISK) {
      return 'Critical';
    }
    if (riskScore >= 80) {
      return 'High';
    }
    if (riskScore >= 70) {
      return 'Elevated';
    }
    if (riskScore >= SimulationConfig.RISK_THRESHOLDS.MEDIUM_RISK) {
      return 'Medium';
    }
    return 'Low';
  }
}

// Create singleton instance
const transactionSimulator = new TransactionSimulator();

// Export public API functions
export const simulateTransaction = transactionSimulator.simulateTransaction.bind(transactionSimulator);
export const startTransactionSimulation = transactionSimulator.startSimulation.bind(transactionSimulator);
export const stopTransactionSimulation = transactionSimulator.stopSimulation.bind(transactionSimulator);
export const getSimulationStatus = transactionSimulator.getSimulationStatus.bind(transactionSimulator);

// Export types for external use
export * from './types';
