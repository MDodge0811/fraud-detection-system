// Risk analysis configuration
export const RiskConfig = {
  // Normalization constants
  MAX_AMOUNT: 10000,
  DEVICE_AGE_NORMALIZATION_HOURS: 24,
  MAX_MERCHANT_RISK: 100,
  MAX_TRANSACTION_FREQUENCY: 10,
  MAX_AVG_AMOUNT: 5000,

  // Risk thresholds - Adjusted for 60% low risk distribution
  HIGH_RISK_MERCHANT_THRESHOLD: 90, // Increased threshold
  HIGH_TRANSACTION_FREQUENCY: 8, // Increased threshold
  NEW_DEVICE_HOURS: 0.5, // Reduced threshold (30 minutes)
  CRITICAL_RISK: 95, // Increased threshold
  HIGH_RISK: 85, // Increased threshold
  MEDIUM_RISK: 70, // Increased threshold
  LOW_RISK: 40, // Increased threshold

  // Risk multipliers - Reduced for more conservative scoring
  AMOUNT_MULTIPLIER: 1.2,
  FREQUENCY_MULTIPLIER: 1.1,
  NEW_DEVICE_MULTIPLIER: 1.2,
  HIGH_MERCHANT_MULTIPLIER: 1.3,

  // Feature weights - Adjusted for more balanced scoring
  WEIGHTS: {
    amount: 0.20,
    deviceAge: 0.10,
    merchantRisk: 0.25,
    frequency: 0.15,
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
