import request from 'supertest';
import express from 'express';
import { prisma } from '../../prisma/client';
import { analyzeTransactionRisk, getSimulationStatus } from '../../services';
import router from '../../routes/index';

// Mock the services
jest.mock('../../services', () => ({
  analyzeTransactionRisk: jest.fn(),
  getSimulationStatus: jest.fn(),
}));

const mockAnalyzeTransactionRisk = analyzeTransactionRisk as jest.MockedFunction<typeof analyzeTransactionRisk>;
const mockGetSimulationStatus = getSimulationStatus as jest.MockedFunction<typeof getSimulationStatus>;

describe('Main Routes', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear database before each test
    await prisma.audit_logs.deleteMany();
    await prisma.alerts.deleteMany();
    await prisma.risk_signals.deleteMany();
    await prisma.training_data.deleteMany();
    await prisma.transactions.deleteMany();
    await prisma.devices.deleteMany();
    await prisma.merchants.deleteMany();
    await prisma.users.deleteMany();

    // Reset mocks
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/', router);
  });

  describe('GET /health', () => {
    it('should return health status successfully', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /alerts', () => {
    beforeEach(async () => {
      // Create test data
      const user = await prisma.users.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const merchant = await prisma.merchants.create({
        data: {
          name: 'Test Merchant',
          category: 'retail',
          risk_level: 50,
        },
      });

      const device = await prisma.devices.create({
        data: {
          user_id: user.user_id,
          fingerprint: 'test-fingerprint-1',
        },
      });

      const transaction = await prisma.transactions.create({
        data: {
          user_id: user.user_id,
          merchant_id: merchant.merchant_id,
          device_id: device.device_id,
          amount: 100.00,
        },
      });

      await prisma.alerts.create({
        data: {
          transaction_id: transaction.transaction_id,
          risk_score: 85,
          reason: 'High risk transaction',
          status: 'open',
        },
      });
    });

    it('should return alerts with default limit', async () => {
      const response = await request(app)
        .get('/alerts')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            risk_score: 85,
            reason: 'High risk transaction',
            status: 'open',
          }),
        ]),
        pagination: {
          count: 1,
          limit: 50,
          hasMore: false,
          page: 1,
          timeframe: '24h',
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should return alerts with custom limit', async () => {
      const response = await request(app)
        .get('/alerts?limit=10')
        .expect(200);

      expect(response.body.pagination).toEqual({
        count: 1,
        limit: 10,
        hasMore: false,
        page: 1,
        timeframe: '24h',
        total: 1,
        totalPages: 1,
      });
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get('/alerts?limit=0')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 1000.',
        code: 'INVALID_LIMIT',
      });
    });

    it('should return 400 for non-numeric limit', async () => {
      const response = await request(app)
        .get('/alerts?limit=abc')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 1000.',
        code: 'INVALID_LIMIT',
      });
    });

    it('should return 503 when database is unavailable', async () => {
      jest.spyOn(prisma.alerts, 'findMany').mockRejectedValue(new Error('database connection failed'));

      const response = await request(app)
        .get('/alerts')
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        error: 'Alerts service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });

      jest.restoreAllMocks();
    });
  });

  describe('GET /transactions', () => {
    beforeEach(async () => {
      // Create test data
      const user = await prisma.users.create({
        data: {
          name: 'Test User 2',
          email: 'test2@example.com',
        },
      });

      const merchant = await prisma.merchants.create({
        data: {
          name: 'Test Merchant 2',
          category: 'online',
          risk_level: 30,
        },
      });

      const device = await prisma.devices.create({
        data: {
          user_id: user.user_id,
          fingerprint: 'test-fingerprint-2',
        },
      });

      await prisma.transactions.create({
        data: {
          user_id: user.user_id,
          merchant_id: merchant.merchant_id,
          device_id: device.device_id,
          amount: 250.00,
        },
      });
    });

    it('should return transactions with default limit', async () => {
      const response = await request(app)
        .get('/transactions')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            amount: '250',
          }),
        ]),
        pagination: {
          count: expect.any(Number),
          limit: 100,
          hasMore: false,
          page: 1,
          timeframe: '24h',
          total: expect.any(Number),
          totalPages: expect.any(Number),
        },
      });
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get('/transactions?limit=2000')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 1000.',
        code: 'INVALID_LIMIT',
      });
    });
  });

  describe('GET /risk-signals', () => {
    beforeEach(async () => {
      // Create test data
      const user = await prisma.users.create({
        data: {
          name: 'Test User 3',
          email: 'test3@example.com',
        },
      });

      const merchant = await prisma.merchants.create({
        data: {
          name: 'Test Merchant 3',
          category: 'gaming',
          risk_level: 70,
        },
      });

      const transaction = await prisma.transactions.create({
        data: {
          user_id: user.user_id,
          merchant_id: merchant.merchant_id,
          amount: 500.00,
        },
      });

      await prisma.risk_signals.create({
        data: {
          transaction_id: transaction.transaction_id,
          signal_type: 'high_amount',
          risk_score: 80,
        },
      });
    });

    it('should return risk signals with default limit', async () => {
      const response = await request(app)
        .get('/risk-signals')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            signal_type: 'high_amount',
            risk_score: 80,
          }),
        ]),
        pagination: {
          count: 1,
          limit: 100,
          hasMore: false,
        },
      });
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get('/risk-signals?limit=0')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 1000.',
        code: 'INVALID_LIMIT',
      });
    });
  });

  describe('GET /dashboard/stats', () => {
    beforeEach(async () => {
      // Create test data for dashboard stats
      const user = await prisma.users.create({
        data: {
          name: 'Test User 4',
          email: 'test4@example.com',
        },
      });

      const merchant = await prisma.merchants.create({
        data: {
          name: 'Test Merchant 4',
          category: 'retail',
          risk_level: 60,
        },
      });

      const device = await prisma.devices.create({
        data: {
          user_id: user.user_id,
          fingerprint: 'test-fingerprint-4',
        },
      });

      const transaction = await prisma.transactions.create({
        data: {
          user_id: user.user_id,
          merchant_id: merchant.merchant_id,
          device_id: device.device_id,
          amount: 150.00,
        },
      });

      await prisma.alerts.create({
        data: {
          transaction_id: transaction.transaction_id,
          risk_score: 90,
          reason: 'Suspicious activity',
          status: 'open',
        },
      });

      await prisma.risk_signals.create({
        data: {
          transaction_id: transaction.transaction_id,
          signal_type: 'suspicious_pattern',
          risk_score: 85,
        },
      });
    });

    it('should return dashboard statistics successfully', async () => {
      const response = await request(app)
        .get('/dashboard/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          totalAlerts: expect.any(Number),
          openAlerts: expect.any(Number),
          totalTransactions: expect.any(Number),
          highRiskTransactions: expect.any(Number),
          alertResolutionRate: expect.any(String),
          avgRiskScore: expect.any(String),
          todayAlerts: expect.any(Number),
          todayTransactions: expect.any(Number),
        },
      });
    });

    it('should return 503 when database is unavailable', async () => {
      jest.spyOn(prisma.alerts, 'count').mockRejectedValue(new Error('database connection failed'));

      const response = await request(app)
        .get('/dashboard/stats')
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        error: 'Dashboard service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });

      jest.restoreAllMocks();
    });
  });

  describe('GET /simulation/status', () => {
    it('should return simulation status successfully', async () => {
      const mockStatus = {
        isRunning: false,
        interval: 5000,
        description: 'Test simulation',
      };

      mockGetSimulationStatus.mockReturnValue(mockStatus);

      const response = await request(app)
        .get('/simulation/status')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          ...mockStatus,
          isRunning: false, // Overridden by the route logic
        },
      });
    });

    it('should return 503 when simulation service is unavailable', async () => {
      mockGetSimulationStatus.mockImplementation(() => {
        throw new Error('simulation service unavailable');
      });

      const response = await request(app)
        .get('/simulation/status')
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        error: 'Simulation service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    });
  });

  describe('GET /risk-analysis/:transactionId', () => {
    let testTransactionId: string;

    beforeEach(async () => {
      // Create test data
      const user = await prisma.users.create({
        data: {
          name: 'Test User 5',
          email: 'test5@example.com',
        },
      });

      const merchant = await prisma.merchants.create({
        data: {
          name: 'Test Merchant 5',
          category: 'retail',
          risk_level: 40,
        },
      });

      const device = await prisma.devices.create({
        data: {
          user_id: user.user_id,
          fingerprint: 'test-fingerprint-5',
        },
      });

      const transaction = await prisma.transactions.create({
        data: {
          user_id: user.user_id,
          merchant_id: merchant.merchant_id,
          device_id: device.device_id,
          amount: 300.00,
        },
      });

      testTransactionId = transaction.transaction_id;
    });

    it('should return risk analysis for valid transaction', async () => {
      const mockRiskAnalysis = {
        riskScore: 65,
        features: {
          normalizedAmount: 0.03,
          normalizedDeviceAge: 0.5,
          normalizedMerchantRisk: 0.4,
          normalizedFrequency: 0.1,
          normalizedAvgAmount: 0.2,
          raw: {
            amount: 300,
            deviceAge: 12,
            merchantRisk: 40,
            recentTransactions: 1,
            avgUserAmount: 1000,
          },
        },
        reasons: ['amount', 'merchant_risk'],
        riskLevel: 'High',
        riskColor: '#ea580c',
      };

      mockAnalyzeTransactionRisk.mockResolvedValue(mockRiskAnalysis);

      const response = await request(app)
        .get(`/risk-analysis/${testTransactionId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          transaction: expect.objectContaining({
            amount: '300',
          }),
          riskAnalysis: mockRiskAnalysis,
        },
      });
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/risk-analysis/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND',
      });
    });

    it('should return 400 for invalid transaction ID', async () => {
      await request(app)
        .get('/risk-analysis/')
        .expect(404); // Express treats this as route not found

      const response2 = await request(app)
        .get('/risk-analysis/%20%20%20') // URL encoded spaces
        .expect(400);

      expect(response2.body).toEqual({
        success: false,
        error: 'Invalid transaction ID provided',
        code: 'INVALID_TRANSACTION_ID',
      });
    });

    it('should return 503 when risk analysis service is unavailable', async () => {
      mockAnalyzeTransactionRisk.mockRejectedValue(new Error('risk analysis service unavailable'));

      const response = await request(app)
        .get(`/risk-analysis/${testTransactionId}`)
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        error: 'Risk analysis service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    });

    it('should return 503 when database is unavailable', async () => {
      jest.spyOn(prisma.transactions, 'findUnique').mockRejectedValue(new Error('database connection failed'));

      const response = await request(app)
        .get(`/risk-analysis/${testTransactionId}`)
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        error: 'Transaction service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });

      jest.restoreAllMocks();
    });
  });
});
