import { prisma } from '../prisma/client';

export default async function globalSetup() {
  console.log('🌍 Global test setup starting...');
  
  try {
    // Ensure test database is ready
    await prisma.$connect();
    
    // Push schema to test database
    const { execSync } = require('child_process');
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL }
    });
    
    console.log('✅ Test database schema updated');
    
    // Seed test data
    const { seedTestData } = require('../tests/seedTestData');
    await seedTestData();
    
    console.log('✅ Test data seeded');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
} 