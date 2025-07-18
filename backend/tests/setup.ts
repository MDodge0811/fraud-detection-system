import { prisma } from '../prisma/client';

// Test setup - runs before each test
beforeAll(async () => {
  // Ensure we're using the test database
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must run with NODE_ENV=test');
  }

  console.log('🧪 Setting up test environment...');
  console.log(`📊 Using database: ${process.env.DATABASE_URL}`);
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data after each test
  try {
    await prisma.alerts.deleteMany();
    await prisma.risk_signals.deleteMany();
    await prisma.training_data.deleteMany();
    await prisma.transactions.deleteMany();
    await prisma.ml_models.deleteMany();
  } catch (error) {
    console.warn('Warning: Error cleaning up test data:', error);
  }
});

// Global teardown
afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.warn('Warning: Error disconnecting from database:', error);
  }
}); 