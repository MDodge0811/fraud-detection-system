import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import websocketService from '../services/websocket';
import { type RealtimeEvent, type Transaction, type Alert } from '../services/websocket';
import { type DashboardStats } from '../services/api';
import { useDashboardStore } from './dashboardStore';

interface WebSocketState {
  // Connection state
  isConnected: boolean;
  reconnectAttempts: number;
  
  // Actions
  connect: () => void;
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
      connect: () => {
        websocketService.connect();
        
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
        (get as any).connectionInterval = interval;
      },

      disconnect: () => {
        websocketService.disconnect();
        set({ isConnected: false });
        
        // Clear connection check interval
        const interval = (get as any).connectionInterval;
        if (interval) {
          clearInterval(interval);
        }
      },

      subscribeToEvents: () => {
        const dashboardStore = useDashboardStore.getState();

        // Handle new transaction events
        const handleNewTransaction = (data: unknown) => {
          const event = data as RealtimeEvent;
          const transaction = event.data as Transaction;
          
          // Update chart data
          dashboardStore.updateTransactionData(transaction);
        };

        // Handle new alert events
        const handleNewAlert = (data: unknown) => {
          const event = data as RealtimeEvent;
          const alert = event.data as Alert;
          
          // Add alert to store
          dashboardStore.addAlert(alert);
          
          // Update chart data
          dashboardStore.updateAlertData(alert);
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
        (get as any).eventHandlers = {
          handleNewTransaction,
          handleNewAlert,
          handleDashboardStats,
        };
      },

      unsubscribeFromEvents: () => {
        const handlers = (get as any).eventHandlers;
        if (handlers) {
          websocketService.off('transaction:new', handlers.handleNewTransaction);
          websocketService.off('alert:new', handlers.handleNewAlert);
          websocketService.off('dashboard:stats', handlers.handleDashboardStats);
        }
      },
    }),
    {
      name: 'websocket-store',
    }
  )
); 