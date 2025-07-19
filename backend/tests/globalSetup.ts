import { prisma } from '../prisma/client';

export default async function globalSetup() {
  console.log('🌍 Global test setup starting...');
  
  try {
    // For now, just connect to ensure Prisma client is ready
    await prisma.$connect();
    console.log('✅ Prisma client connected');
    
    // Skip database setup for now - we'll use mocks
    console.log('⚠️  Skipping database setup - using mocks');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // Don't throw error - let tests run with mocks
  } finally {
    await prisma.$disconnect();
  }
} 