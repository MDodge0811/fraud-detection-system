import { analyzeTransactionRisk, getRiskLevel } from '../services/riskAnalyzer';
import { prisma } from '../prisma/client';

describe('Risk Analyzer', () => {
  let user: any, device: any, merchant: any;

  beforeAll(async () => {
    // Create a user, device, and merchant for testing
    user = await prisma.users.create({
      data: { name: 'Test User', email: 'testuser@example.com' },
    });
    device = await prisma.devices.create({
      data: { user_id: user.user_id, fingerprint: 'test-device' },
    });
    merchant = await prisma.merchants.create({
      data: { name: 'Test Merchant', category: 'Test', risk_level: 90 },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.devices.deleteMany({ where: { user_id: user.user_id } });
    await prisma.users.delete({ where: { user_id: user.user_id } });
    await prisma.merchants.delete({ where: { merchant_id: merchant.merchant_id } });
    await prisma.$disconnect();
  });

  it('should return a high risk score for high-risk merchant and new device', async () => {
    const amount = 10000;
    const result = await analyzeTransactionRisk(
      'dummy-tx',
      user.user_id,
      device.device_id,
      merchant.merchant_id,
      amount,
    );
    expect(result.riskScore).toBeGreaterThanOrEqual(75);
    expect(result.reasons).toContainEqual(expect.stringContaining('High-risk merchant'));
    expect(result.reasons).toContainEqual(expect.stringContaining('New device'));
  });

  it('should return a low risk score for low amount and old device', async () => {
    // Simulate an old device
    await prisma.devices.update({
      where: { device_id: device.device_id },
      data: { last_seen: new Date(Date.now() - 48 * 60 * 60 * 1000) }, // 48 hours ago
    });
    const lowRiskMerchant = await prisma.merchants.create({
      data: { name: 'Low Risk Merchant', category: 'Test', risk_level: 10 },
    });
    const amount = 10;
    const result = await analyzeTransactionRisk(
      'dummy-tx2',
      user.user_id,
      device.device_id,
      lowRiskMerchant.merchant_id,
      amount,
    );
    expect(result.riskScore).toBeLessThan(50);
    expect(result.reasons).not.toContainEqual(expect.stringContaining('High-risk merchant'));
    await prisma.merchants.delete({ where: { merchant_id: lowRiskMerchant.merchant_id } });
  });

  it('should return correct risk level descriptions', () => {
    expect(getRiskLevel(95)).toBe('Critical');
    expect(getRiskLevel(80)).toBe('High');
    expect(getRiskLevel(60)).toBe('Medium');
    expect(getRiskLevel(30)).toBe('Low');
    expect(getRiskLevel(10)).toBe('Very Low');
  });
});
