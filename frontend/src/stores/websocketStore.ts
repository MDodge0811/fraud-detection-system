import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import websocketService, { type RealtimeEvent, type Alert } from '@/services/websocket';
import { type DashboardStats } from '@/services/api';
import { useDashboardStore } from '@/stores/dashboardStore';

interface WebSocketState {
  // Connection state
  isConnected: boolean;
  reconnectAttempts: number;

  // Internal state (not exposed)
  connectionInterval?: NodeJS.Timeout;
  eventHandlers?: {
    handleNewTransaction: (data: unknown) => void;
    handleNewAlert: (data: unknown) => void;
    handleDashboardStats: (data: unknown) => void;
  };

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToEvents: () => void;
  unsubscribeFromEvents: () => void;
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isConnected: false,
      reconnectAttempts: 0,

      // Connection actions
      connect: async () => {
        await websocketService.connect();

        // Set up connection status monitoring
        const checkConnection = () => {
          const connected = websocketService.connected;
          set({ isConnected: connected });

          // Update dashboard connection status
          const dashboardStore = useDashboardStore.getState();
          if (connected) {
            dashboardStore.setConnectionStatus('connected');
          } else {
            dashboardStore.setConnectionStatus('disconnected');
          }
        };

        // Check connection status periodically
        const interval = setInterval(checkConnection, 1000);

        // Store interval for cleanup
        get().connectionInterval = interval;
      },

      disconnect: () => {
        websocketService.disconnect();
        set({ isConnected: false });

        // Clear connection check interval
        const interval = get().connectionInterval;
        if (interval) {
          clearInterval(interval);
        }
      },

      subscribeToEvents: () => {
        const dashboardStore = useDashboardStore.getState();

        // Handle new transaction events
        const handleNewTransaction = (_data: unknown) => {
          // Note: Chart data is now fetched from aggregated endpoints
          // No need to update individual transaction data
        };

        // Handle new alert events
        const handleNewAlert = (data: unknown) => {
          const event = data as RealtimeEvent;
          const alert = event.data as Alert;

          // Add alert to store
          dashboardStore.addAlert(alert);

          // Note: Chart data is now fetched from aggregated endpoints
          // No need to update individual alert data
        };

        // Handle dashboard stats updates
        const handleDashboardStats = (data: unknown) => {
          const event = data as RealtimeEvent;
          const stats = event.data as DashboardStats;
          dashboardStore.setStats(stats);
        };

        // Subscribe to events
        websocketService.on('transaction:new', handleNewTransaction);
        websocketService.on('alert:new', handleNewAlert);
        websocketService.on('dashboard:stats', handleDashboardStats);

        // Store handlers for cleanup
        get().eventHandlers = {
          handleNewTransaction,
          handleNewAlert,
          handleDashboardStats,
        };
      },

      unsubscribeFromEvents: () => {
        const handlers = get().eventHandlers;
        if (handlers) {
          websocketService.off('transaction:new', handlers.handleNewTransaction);
          websocketService.off('alert:new', handlers.handleNewAlert);
          websocketService.off('dashboard:stats', handlers.handleDashboardStats);
        }
      },
    }),
    {
      name: 'websocket-store',
    },
  ),
);
