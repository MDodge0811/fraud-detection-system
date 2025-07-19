// Risk analysis configuration
export const RiskConfig = {
  // Normalization constants
  MAX_AMOUNT: 10000,
  DEVICE_AGE_NORMALIZATION_HOURS: 24,
  MAX_MERCHANT_RISK: 100,
  MAX_TRANSACTION_FREQUENCY: 10,
  MAX_AVG_AMOUNT: 5000,

  // Risk thresholds
  HIGH_RISK_MERCHANT_THRESHOLD: 80,
  HIGH_TRANSACTION_FREQUENCY: 5,
  NEW_DEVICE_HOURS: 1,
  CRITICAL_RISK: 90,
  HIGH_RISK: 75,
  MEDIUM_RISK: 50,
  LOW_RISK: 25,

  // Risk multipliers
  AMOUNT_MULTIPLIER: 1.5,
  FREQUENCY_MULTIPLIER: 1.3,
  NEW_DEVICE_MULTIPLIER: 1.4,
  HIGH_MERCHANT_MULTIPLIER: 1.6,

  // Feature weights
  WEIGHTS: {
    amount: 0.25,
    deviceAge: 0.15,
    merchantRisk: 0.30,
    frequency: 0.20,
    avgAmount: 0.10,
  },

  // Time windows
  RECENT_TRANSACTIONS_WINDOW_MINUTES: 5,
  USER_HISTORY_WINDOW_HOURS: 24,

  // Risk colors for UI
  COLORS: {
    critical: '#dc2626', // Red
    high: '#ea580c', // Orange
    medium: '#d97706', // Amber
    low: '#65a30d', // Green
    veryLow: '#16a34a', // Dark green
  },
} as const;
