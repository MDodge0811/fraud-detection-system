import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { execSync } from 'child_process';
import { prisma } from './prisma/client';
import { createApp, createHttpServer, createSocketServer } from './server';
import { startTransactionSimulation, stopTransactionSimulation } from './services';

// Extend global type for simulation interval and WebSocket server
declare global {
  var simulationInterval: NodeJS.Timeout | undefined;
  var io: Server | undefined;
}

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
async function startServer() {
  try {
    // Reset Prisma client to clear cached query plans
    await prisma.$disconnect();
    await prisma.$connect();
    console.log('✅ Database connected successfully (Prisma client reset)');

    // Verify Prisma client compatibility with a simple query
    try {
      await prisma.users.findMany({ take: 1 });
      console.log('✅ Prisma client query test successful');
    } catch (queryError) {
      console.error('❌ Prisma client query test failed:', queryError);
      console.log('🔄 Attempting to regenerate Prisma client...');
      // Force regenerate Prisma client
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client regenerated');
    }

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = createHttpServer(app);

    // Create Socket.IO server
    createSocketServer(server);

    // Start listening
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🚨 Alerts endpoint: http://localhost:${PORT}/api/alerts`);
      console.log(`💳 Transactions endpoint: http://localhost:${PORT}/api/transactions`);
      console.log(`📈 Dashboard stats: http://localhost:${PORT}/api/dashboard/stats`);
      console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);

      // Start transaction simulation after server is running
      const simulationInterval = startTransactionSimulation();

      // Store interval ID for graceful shutdown
      global.simulationInterval = simulationInterval;
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');

  // Stop transaction simulation
  if (global.simulationInterval) {
    stopTransactionSimulation(global.simulationInterval);
  }

  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');

  // Stop transaction simulation
  if (global.simulationInterval) {
    stopTransactionSimulation(global.simulationInterval);
  }

  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
