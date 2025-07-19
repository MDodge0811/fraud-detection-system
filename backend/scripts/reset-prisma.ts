import { execSync } from 'child_process';

console.log('🔄 Resetting Prisma client...');

try {
  // Generate fresh Prisma client
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client regenerated successfully');
} catch (error) {
  console.error('❌ Error regenerating Prisma client:', error);
  process.exit(1);
} 