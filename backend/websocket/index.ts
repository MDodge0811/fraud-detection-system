import { Server, Socket } from 'socket.io';

export function setupWebSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    // Send initial data to new client
    socket.emit('connected', { message: 'Connected to fraud detection system' });
    
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
    
    // Handle client requests for real-time data
    socket.on('subscribe:alerts', () => {
      socket.join('alerts');
      console.log('📡 Client subscribed to alerts:', socket.id);
    });
    
    socket.on('subscribe:transactions', () => {
      socket.join('transactions');
      console.log('📡 Client subscribed to transactions:', socket.id);
    });
    
    socket.on('subscribe:dashboard', () => {
      socket.join('dashboard');
      console.log('📡 Client subscribed to dashboard updates:', socket.id);
    });
    
    socket.on('unsubscribe:alerts', () => {
      socket.leave('alerts');
    });
    
    socket.on('unsubscribe:transactions', () => {
      socket.leave('transactions');
    });
    
    socket.on('unsubscribe:dashboard', () => {
      socket.leave('dashboard');
    });
  });
} 