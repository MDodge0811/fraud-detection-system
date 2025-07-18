import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from '@/routes';
import { setupWebSocketHandlers } from '@/websocket';

// Extend global type for simulation interval and WebSocket server
declare global {
  var simulationInterval: NodeJS.Timeout | undefined;
  var io: Server | undefined;
}

export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }));
  app.use(express.json());

  // API routes
  app.use('/api', routes);

  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      message: `Route ${req.originalUrl} does not exist`,
    });
  });

  return app;
}

export function createHttpServer(app: express.Application): any {
  return createServer(app);
}

export function createSocketServer(httpServer: any): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store io globally for access in other modules
  global.io = io;

  // Setup WebSocket handlers
  setupWebSocketHandlers(io);

  return io;
}
