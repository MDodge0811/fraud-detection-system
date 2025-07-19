import { simulateTransaction, startTransactionSimulation, stopTransactionSimulation } from '../services/transactionSimulator';
import { prisma } from '../prisma/client';

// Mock the ML risk analyzer to avoid complex DB logic in these tests
jest.mock('../services/mlRiskAnalyzer', () => ({
  analyzeTransactionRiskML: jest.fn().mockResolvedValue({
    riskScore: 80,
    features: {
      normalizedAmount: 0.5,
      raw: {
        deviceAge: 12,
        merchantRisk: 90,
        recentTransactions: 1,
        avgUserAmount: 1000,
      },
    },
    reasons: ['High-risk merchant (90%)', 'New device (0 hours old)'],
    mlConfidence: 0.8,
  }),
}));

describe('Transaction Simulator', () => {
  let testUser: any, testDevice: any, testMerchant: any;
  let consoleSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Clean up any existing test data first
    await prisma.alerts.deleteMany();
    await prisma.risk_signals.deleteMany();
    await prisma.training_data.deleteMany();
    await prisma.transactions.deleteMany();
    await prisma.devices.deleteMany();
    await prisma.users.deleteMany();
    await prisma.merchants.deleteMany();

    // Create fresh test data
    testUser = await prisma.users.create({
      data: { name: 'Test User', email: 'testuser@example.com' },
    });
    testDevice = await prisma.devices.create({
      data: { user_id: testUser.user_id, fingerprint: 'test-device-123' },
    });
    testMerchant = await prisma.merchants.create({
      data: { name: 'Test Merchant', category: 'Test', risk_level: 90 },
    });
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterAll(async () => {
    // Clean up in proper order to avoid foreign key constraints
    await prisma.alerts.deleteMany();
    await prisma.risk_signals.deleteMany();
    await prisma.training_data.deleteMany();
    await prisma.transactions.deleteMany();
    await prisma.devices.deleteMany({ where: { user_id: testUser.user_id } });
    await prisma.users.delete({ where: { user_id: testUser.user_id } });
    await prisma.merchants.delete({ where: { merchant_id: testMerchant.merchant_id } });
    consoleSpy.mockRestore();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    consoleSpy.mockClear();
    // Clean up only the data that transactions create, not the test entities
    await prisma.alerts.deleteMany();
    await prisma.risk_signals.deleteMany();
    await prisma.training_data.deleteMany();
    await prisma.transactions.deleteMany();
  });

  it('should create a transaction, risk signal, and alert', async () => {
    const initialTx = await prisma.transactions.count();
    const initialSignals = await prisma.risk_signals.count();
    const initialAlerts = await prisma.alerts.count();
    await simulateTransaction();
    expect(await prisma.transactions.count()).toBe(initialTx + 1);
    expect(await prisma.risk_signals.count()).toBe(initialSignals + 1);
    // Note: Alert creation depends on risk score >= 75, mock returns 80 so should create alert
    expect(await prisma.alerts.count()).toBe(initialAlerts + 1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('HIGH RISK ALERT'));
  });

  it('should handle missing seed data gracefully', async () => {
    // Remove all users/devices/merchants
    await prisma.alerts.deleteMany();
    await prisma.risk_signals.deleteMany();
    await prisma.training_data.deleteMany();
    await prisma.transactions.deleteMany();
    await prisma.devices.deleteMany();
    await prisma.users.deleteMany();
    await prisma.merchants.deleteMany();
    await simulateTransaction();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('missing seed data'));
    // Restore test data
    testUser = await prisma.users.create({ data: { name: 'Test User', email: 'testuser@example.com' } });
    testDevice = await prisma.devices.create({ data: { user_id: testUser.user_id, fingerprint: 'test-device-123' } });
    testMerchant = await prisma.merchants.create({ data: { name: 'Test Merchant', category: 'Test', risk_level: 90 } });
  });

  it('should create a training_data record for every transaction', async () => {
    const initialTrainingData = await prisma.training_data.count();
    await simulateTransaction();
    // Note: Each transaction creates one training data record
    expect(await prisma.training_data.count()).toBe(initialTrainingData + 1);
  });

  it('should start and stop simulation', () => {
    const intervalId = startTransactionSimulation();
    expect(intervalId).toBeDefined();
    stopTransactionSimulation(intervalId);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Stopping transaction simulation'));
  });
});
