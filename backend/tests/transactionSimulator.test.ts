import { simulateTransaction, startTransactionSimulation, stopTransactionSimulation } from '../services/transactionSimulator';
import { prisma } from '../prisma/client';

// Mock the risk analyzer to avoid complex DB logic in these tests
jest.mock('../services/riskAnalyzer', () => ({
  analyzeTransactionRisk: jest.fn().mockResolvedValue({
    riskScore: 80,
    features: { normalizedAmount: 0.5 },
    reasons: ['High-risk merchant (90%)', 'New device (0 hours old)'],
  }),
  getRiskLevel: jest.fn().mockReturnValue('High'),
}));

describe('Transaction Simulator', () => {
  let testUser: any, testDevice: any, testMerchant: any;
  let consoleSpy: jest.SpyInstance;

  beforeAll(async () => {
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
    await prisma.alerts.deleteMany({ where: { transaction_id: { not: undefined } } });
    await prisma.risk_signals.deleteMany({ where: { transaction_id: { not: undefined } } });
    await prisma.training_data.deleteMany();
    await prisma.transactions.deleteMany({ where: { user_id: testUser.user_id } });
    await prisma.devices.deleteMany({ where: { user_id: testUser.user_id } });
    await prisma.users.delete({ where: { user_id: testUser.user_id } });
    await prisma.merchants.delete({ where: { merchant_id: testMerchant.merchant_id } });
    consoleSpy.mockRestore();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  it('should create a transaction, risk signal, and alert', async () => {
    const initialTx = await prisma.transactions.count();
    const initialSignals = await prisma.risk_signals.count();
    const initialAlerts = await prisma.alerts.count();
    await simulateTransaction();
    expect(await prisma.transactions.count()).toBe(initialTx + 1);
    expect(await prisma.risk_signals.count()).toBe(initialSignals + 1);
    expect(await prisma.alerts.count()).toBe(initialAlerts + 1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('High risk transaction'));
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

  it('should start and stop simulation', () => {
    const intervalId = startTransactionSimulation();
    expect(intervalId).toBeDefined();
    stopTransactionSimulation(intervalId);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Stopping transaction simulation'));
  });

  it('should create a training_data record for every transaction', async () => {
    const initialTrainingData = await prisma.training_data.count();
    await simulateTransaction();
    expect(await prisma.training_data.count()).toBe(initialTrainingData + 1);
  });
});
