import { Response } from 'express';

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

export class RouteError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const ErrorCodes = {
  INVALID_LIMIT: 'INVALID_LIMIT',
  INVALID_TRANSACTION_ID: 'INVALID_TRANSACTION_ID',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export const ErrorMessages = {
  INVALID_LIMIT: 'Invalid limit parameter. Must be between 1 and 1000.',
  INVALID_TRANSACTION_ID: 'Invalid transaction ID provided',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  INTERNAL_ERROR: 'Internal server error',
  MODEL_NOT_FOUND: 'No ML model found. Please train a model first.',
  INSUFFICIENT_DATA: 'Insufficient training data. Need more samples to train the model.',
  VALIDATION_ERROR: 'Model validation failed',
} as const;

export const ServiceErrors = {
  ALERTS: 'Alerts service temporarily unavailable',
  TRANSACTIONS: 'Transactions service temporarily unavailable',
  RISK_SIGNALS: 'Risk signals service temporarily unavailable',
  DASHBOARD: 'Dashboard service temporarily unavailable',
  SIMULATION: 'Simulation service temporarily unavailable',
  RISK_ANALYSIS: 'Risk analysis service temporarily unavailable',
  TRANSACTION_SERVICE: 'Transaction service temporarily unavailable',
  ML_SERVICE: 'ML service temporarily unavailable',
  TRAINING_DATA: 'Training data service temporarily unavailable',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

export const InternalErrors = {
  FETCHING_ALERTS: 'Internal server error while fetching alerts',
  FETCHING_TRANSACTIONS: 'Internal server error while fetching transactions',
  FETCHING_RISK_SIGNALS: 'Internal server error while fetching risk signals',
  FETCHING_DASHBOARD_STATS: 'Internal server error while fetching dashboard stats',
  GETTING_SIMULATION_STATUS: 'Internal server error while getting simulation status',
  ANALYZING_TRANSACTION_RISK: 'Internal server error while analyzing transaction risk',
  GETTING_ML_STATS: 'Internal server error while retrieving ML model statistics',
  TRAINING_MODEL: 'Internal server error during model training',
  GETTING_TRAINING_DATA: 'Internal server error while retrieving training data statistics',
  INTERNAL_ERROR: 'Internal server error',
} as const;

export function handleRouteError(error: unknown, res: Response, serviceName?: keyof typeof ServiceErrors, internalErrorName?: keyof typeof InternalErrors): void {
  console.error(`Error in ${serviceName || 'route'}:`, error);

  // If it's already a RouteError, use it directly
  if (error instanceof RouteError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
    });
    return;
  }

  // Check for database connection issues
  if (error instanceof Error && error.message.includes('database')) {
    const serviceError = serviceName ? ServiceErrors[serviceName] : ServiceErrors.SERVICE_UNAVAILABLE;
    res.status(503).json({
      success: false,
      error: serviceError,
      code: ErrorCodes.SERVICE_UNAVAILABLE,
    });
    return;
  }

  // Check for specific error patterns
  if (error instanceof Error) {
    // ML model not found
    if (error.message.includes('No existing model')) {
      res.status(404).json({
        success: false,
        error: ErrorMessages.MODEL_NOT_FOUND,
        code: ErrorCodes.MODEL_NOT_FOUND,
      });
      return;
    }

    // Insufficient training data
    if (error.message.includes('insufficient data')) {
      res.status(422).json({
        success: false,
        error: ErrorMessages.INSUFFICIENT_DATA,
        code: ErrorCodes.INSUFFICIENT_DATA,
      });
      return;
    }

    // Model validation error
    if (error.message.includes('validation')) {
      res.status(422).json({
        success: false,
        error: ErrorMessages.VALIDATION_ERROR,
        code: ErrorCodes.VALIDATION_ERROR,
      });
      return;
    }

    // Risk analysis service error
    if (error.message.includes('risk analysis')) {
      res.status(503).json({
        success: false,
        error: ServiceErrors.RISK_ANALYSIS,
        code: ErrorCodes.SERVICE_UNAVAILABLE,
      });
      return;
    }

    // Simulation service error
    if (error.message.includes('simulation')) {
      res.status(503).json({
        success: false,
        error: ServiceErrors.SIMULATION,
        code: ErrorCodes.SERVICE_UNAVAILABLE,
      });
      return;
    }
  }

  // Default internal server error
  const internalError = internalErrorName ? InternalErrors[internalErrorName] : InternalErrors.INTERNAL_ERROR;
  res.status(500).json({
    success: false,
    error: internalError,
    code: ErrorCodes.INTERNAL_ERROR,
  });
}

export function createValidationError(message: string, code: string): RouteError {
  return new RouteError(message, 400, code);
}

export function createNotFoundError(message: string, code: string): RouteError {
  return new RouteError(message, 404, code);
}

export function createUnprocessableEntityError(message: string, code: string): RouteError {
  return new RouteError(message, 422, code);
}
