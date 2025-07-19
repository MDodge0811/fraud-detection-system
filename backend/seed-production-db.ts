import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

const productionDbUrl = process.env.PRODUCTION_DATABASE_URL;

if (!productionDbUrl) {
  console.error('❌ PRODUCTION_DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🌱 Seeding production database...');
console.log(`📊 Database URL: ${productionDbUrl.replace(/:[^:@]*@/, ':****@')}`);

try {
  // Set the DATABASE_URL to production for this script
  process.env.DATABASE_URL = productionDbUrl;

  console.log('🌱 Running seed script...');
  execSync('npx ts-node seed.ts', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: productionDbUrl }
  });

  console.log('✅ Production database seeding completed successfully!');
} catch (error) {
  console.error('❌ Error seeding production database:', error);
  process.exit(1);
} 