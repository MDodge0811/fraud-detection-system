import { io, Socket } from 'socket.io-client';

export interface RealtimeEvent {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface DashboardStats {
  totalAlerts: number;
  openAlerts: number;
  totalTransactions: number;
  highRiskTransactions: number;
  alertResolutionRate: string;
}

export interface Transaction {
  transaction_id: string;
  amount: number;
  timestamp: string;
  status: string;
  user_id: string;
  device_id?: string;
  merchant_id?: string;
  users?: {
    name: string;
    email: string;
  };
  merchants?: {
    name: string;
    category: string;
    risk_level: number;
  };
  devices?: {
    fingerprint: string;
  };
  risk_signals?: Array<{
    signal_id: string;
    risk_score: number;
    signal_type: string;
    created_at: string;
  }>;
}

export interface Alert {
  alert_id: string;
  transaction_id: string;
  risk_score: number;
  reason: string;
  status: string;
  created_at: string;
  transactions?: Transaction;
}

export interface RiskSignal {
  signal_id: string;
  transaction_id: string;
  signal_type: string;
  risk_score: number;
  created_at: string;
  transactions?: Transaction;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  connect() {
    if (this.socket?.connected) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to WebSocket server...');

    this.socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Subscribe to real-time updates
      this.socket?.emit('subscribe:alerts');
      this.socket?.emit('subscribe:transactions');
      this.socket?.emit('subscribe:dashboard');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🔌 Max reconnection attempts reached');
      }
    });

    // Handle real-time events
    this.socket.on('transaction:new', (event: RealtimeEvent) => {
      this.emit('transaction:new', event);
    });

    this.socket.on('alert:new', (event: RealtimeEvent) => {
      this.emit('alert:new', event);
    });

    this.socket.on('risk-signal:new', (event: RealtimeEvent) => {
      this.emit('risk-signal:new', event);
    });

    this.socket.on('dashboard:stats', (event: RealtimeEvent) => {
      this.emit('dashboard:stats', event);
    });

    this.socket.on('connected', (data: { message: string }) => {
      console.log('🎉 Connected to fraud detection system:', data.message);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Subscribe to events
  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  // Unsubscribe from events
  off(event: string, callback: (data: unknown) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  // Emit events to listeners
  private emit(event: string, data: unknown) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  get connected() {
    return this.isConnected;
  }

  // Manual subscription methods
  subscribeToAlerts() {
    this.socket?.emit('subscribe:alerts');
  }

  subscribeToTransactions() {
    this.socket?.emit('subscribe:transactions');
  }

  subscribeToDashboard() {
    this.socket?.emit('subscribe:dashboard');
  }

  unsubscribeFromAlerts() {
    this.socket?.emit('unsubscribe:alerts');
  }

  unsubscribeFromTransactions() {
    this.socket?.emit('unsubscribe:transactions');
  }

  unsubscribeFromDashboard() {
    this.socket?.emit('unsubscribe:dashboard');
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
