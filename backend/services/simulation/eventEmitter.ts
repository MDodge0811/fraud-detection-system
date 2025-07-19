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
  }

  emit(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
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
