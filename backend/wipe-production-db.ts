import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

const productionDbUrl = process.env.PRODUCTION_DATABASE_URL;

if (!productionDbUrl) {
  console.error('❌ PRODUCTION_DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🗑️  Wiping production database...');
console.log(`📊 Database URL: ${productionDbUrl.replace(/:[^:@]*@/, ':****@')}`);

try {
  // Set the DATABASE_URL to production for this script
  process.env.DATABASE_URL = productionDbUrl;

  console.log('🧹 Dropping all tables...');
  execSync('npx prisma db push --force-reset', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: productionDbUrl }
  });

  console.log('📋 Running Prisma migrations...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: productionDbUrl }
  });

  console.log('🌱 Running seed script...');
  execSync('npx ts-node seed.ts', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: productionDbUrl }
  });

  console.log('✅ Production database wiped and setup completed successfully!');
} catch (error) {
  console.error('❌ Error setting up production database:', error);
  process.exit(1);
} 