import { prisma } from '../../prisma/client';
import { SimulationConfig } from './config';
import { DashboardStats, Transaction, RiskSignal, TrainingData, Alert } from './types';

export class DatabaseService {
  async createTransaction(
    userId: string,
    deviceId: string,
    merchantId: string,
    amount: number,
  ): Promise<Transaction> {
    const result = await prisma.transactions.create({
      data: {
        user_id: userId,
        device_id: deviceId,
        merchant_id: merchantId,
        amount,
        status: 'completed',
      },
      include: {
        users: true,
        merchants: true,
        devices: true,
      },
    });
    return result as Transaction;
  }

  async createRiskSignal(transactionId: string, riskScore: number): Promise<RiskSignal> {
    const result = await prisma.risk_signals.create({
      data: {
        transaction_id: transactionId,
        signal_type: 'ml_risk',
        risk_score: riskScore,
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
    return result as RiskSignal;
  }

  async createTrainingData(
    transactionId: string,
    features: Record<string, any>,
    riskScore: number,
  ): Promise<TrainingData> {
    const result = await prisma.training_data.create({
      data: {
        transaction_id: transactionId,
        features,
        label: riskScore >= SimulationConfig.RISK_THRESHOLDS.HIGH_RISK ? 1 : 0,
      },
    });
    return result as TrainingData;
  }

  async createAlert(
    transactionId: string,
    riskScore: number,
    reason: string,
  ): Promise<Alert> {
    const result = await prisma.alerts.create({
      data: {
        transaction_id: transactionId,
        risk_score: riskScore,
        reason,
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
    return result as Alert;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [totalAlerts, openAlerts, totalTransactions, highRiskTransactions] = await Promise.all([
      prisma.alerts.count(),
      prisma.alerts.count({ where: { status: 'open' } }),
      prisma.transactions.count(),
      prisma.risk_signals.count({ where: { risk_score: { gte: SimulationConfig.RISK_THRESHOLDS.HIGH_RISK } } }),
    ]);

    return {
      totalAlerts,
      openAlerts,
      totalTransactions,
      highRiskTransactions,
      alertResolutionRate: totalAlerts > 0 ? ((totalAlerts - openAlerts) / totalAlerts * 100).toFixed(2) : '0',
    };
  }
}
