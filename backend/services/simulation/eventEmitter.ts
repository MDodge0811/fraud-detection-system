import { Server } from 'socket.io';
import { SimulationConfig } from './config';
import { WebSocketEvent, DashboardStats, Transaction, RiskSignal, Alert } from './types';

// Extend global type for WebSocket server
declare global {
  var io: Server | undefined;
}

export class EventEmitter {
  private io: Server | undefined;

  constructor() {
    this.io = global.io;
    console.log('🔌 EventEmitter initialized, global.io available:', !!this.io);
  }

  emit(event: string, data: any): void {
    if (this.io) {
      console.log(`🔌 Emitting WebSocket event: ${event}`);
      this.io.emit(event, data);
    } else {
      console.log(`⚠️  WebSocket server not available for event: ${event}`);
      console.log(`🔍 Global.io status:`, !!global.io);
      // Try to get io again in case it was set after constructor
      this.io = global.io;
      if (this.io) {
        console.log(`✅ WebSocket server now available, retrying emit: ${event}`);
        this.io.emit(event, data);
      }
    }
  }

  emitTransactionNew(transaction: Transaction): void {
    const event: WebSocketEvent = {
      type: 'transaction',
      data: transaction,
      timestamp: new Date().toISOString(),
    };
    this.emit(SimulationConfig.EVENTS.TRANSACTION_NEW, event);
  }

  emitRiskSignalNew(riskSignal: RiskSignal): void {
    const event: WebSocketEvent = {
      type: 'risk-signal',
      data: riskSignal,
      timestamp: new Date().toISOString(),
    };
    this.emit(SimulationConfig.EVENTS.RISK_SIGNAL_NEW, event);
  }

  emitAlertNew(alert: Alert): void {
    const event: WebSocketEvent = {
      type: 'alert',
      data: alert,
      timestamp: new Date().toISOString(),
    };
    this.emit(SimulationConfig.EVENTS.ALERT_NEW, event);
  }

  emitDashboardStats(stats: DashboardStats): void {
    const event: WebSocketEvent = {
      type: 'dashboard-stats',
      data: stats,
      timestamp: new Date().toISOString(),
    };
    this.emit(SimulationConfig.EVENTS.DASHBOARD_STATS, event);
  }
}
