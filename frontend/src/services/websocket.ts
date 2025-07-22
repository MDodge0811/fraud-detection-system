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
  todayTransactions: number;
  todayAlerts: number;
  alertResolutionRate: string;
  avgRiskScore: string;
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
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastData: {
    transactions: Transaction[];
    alerts: Alert[];
    dashboardStats: DashboardStats | null;
  } = {
    transactions: [],
    alerts: [],
    dashboardStats: null,
  };

  // Event listeners
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  async connect() {
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Stop polling if it was running
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      // Subscribe to real-time updates
      this.socket?.emit('subscribe:alerts');
      this.socket?.emit('subscribe:transactions');
      this.socket?.emit('subscribe:dashboard');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', () => {
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.startPolling();
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

    this.socket.on('connected', () => {
      // Connection established
    });
  }

  private async startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Initial data fetch
    await this.pollForUpdates();

    // Set up polling interval (every 5 seconds)
    this.pollingInterval = setInterval(async () => {
      await this.pollForUpdates();
    }, 5000);
  }

  private async pollForUpdates() {
    try {
      const apiService = (await import('./api')).default;

      // Fetch latest data
      const [transactions, alerts, dashboardStats] = await Promise.all([
        apiService.getTransactions(100, 'all'),
        apiService.getAlerts(50, 'all'),
        apiService.getDashboardStats(),
      ]);

      // Check for new transactions
      if (transactions.length > this.lastData.transactions.length) {
        const newTransactions = transactions.slice(this.lastData.transactions.length);
        newTransactions.forEach(transaction => {
          this.emit('transaction:new', {
            type: 'transaction:new',
            data: transaction,
            timestamp: new Date().toISOString(),
          });
        });
      }

      // Check for new alerts by comparing alert IDs
      const existingAlertIds = new Set(this.lastData.alerts.map(alert => alert.alert_id));
      const newAlerts = alerts.filter(alert => !existingAlertIds.has(alert.alert_id));

      newAlerts.forEach(alert => {
        this.emit('alert:new', {
          type: 'alert:new',
          data: alert,
          timestamp: new Date().toISOString(),
        });
      });

      // Update dashboard stats
      if (!this.lastData.dashboardStats ||
          JSON.stringify(dashboardStats) !== JSON.stringify(this.lastData.dashboardStats)) {
        this.emit('dashboard:stats', {
          type: 'dashboard:stats',
          data: dashboardStats,
          timestamp: new Date().toISOString(),
        });
      }

      // Update last data
      this.lastData = { transactions, alerts, dashboardStats };
    } catch {
      // Handle polling error silently in production
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    // Stop polling if it's running
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
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
        } catch {
          // Handle callback errors silently in production
        }
      });
    }
  }

  // Get connection status
  get connected() {
    return this.isConnected;
  }

  // Subscribe to specific events
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

export default new WebSocketService();
