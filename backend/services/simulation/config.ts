// Transaction simulation configuration
export const SimulationConfig = {
  // Transaction patterns and weights
  PATTERNS: {
    NORMAL: { weight: 0.7, minAmount: 100, maxAmount: 5000 },
    HIGH_VALUE: { weight: 0.15, minAmount: 8000, maxAmount: 15000 },
    MICRO: { weight: 0.1, minAmount: 1, maxAmount: 50 },
    SUSPICIOUS_ROUND: { weight: 0.05, amounts: [1000, 2000, 5000, 10000, 15000] },
  },

  // Fraud pattern weights
  FRAUD_PATTERNS: {
    RAPID_SUCCESSION: { weight: 0.25, multiplier: 1.5 },
    OFF_HOURS: { weight: 0.25, multiplier: 1.3 },
    UNUSUAL_AMOUNT: { weight: 0.25, multiplier: 1.4 },
    NEW_COMBINATION: { weight: 0.25, multiplier: 1.6 },
  },

  // User selection weights
  USER_SELECTION: {
    NORMAL_USER_PROBABILITY: 0.8,
    SUSPICIOUS_USER_THRESHOLD: 5, // transactions
  },

  // Device selection weights
  DEVICE_SELECTION: {
    NORMAL_DEVICE_PROBABILITY: 0.75,
    SUSPICIOUS_DEVICE_AGE_HOURS: 24,
  },

  // Merchant selection weights
  MERCHANT_SELECTION: {
    NORMAL_MERCHANT_PROBABILITY: 0.7,
    HIGH_RISK_THRESHOLD: 70,
  },

  // Risk thresholds
  RISK_THRESHOLDS: {
    HIGH_RISK: 75,
    MEDIUM_RISK: 50,
    CRITICAL_RISK: 90,
  },

  // Time windows
  TIME_WINDOWS: {
    RAPID_SUCCESSION_MINUTES: 2,
    RAPID_SUCCESSION_THRESHOLD: 3,
    OFF_HOURS_START: 6,
    OFF_HOURS_END: 22,
  },

  // Simulation settings
  SIMULATION: {
    INTERVAL_MS: 10000,
    DESCRIPTION: 'Generates enhanced mock transactions every 10 seconds with fraud patterns',
  },

  // WebSocket events
  EVENTS: {
    TRANSACTION_NEW: 'transaction:new',
    RISK_SIGNAL_NEW: 'risk-signal:new',
    ALERT_NEW: 'alert:new',
    DASHBOARD_STATS: 'dashboard:stats',
  },
} as const;
