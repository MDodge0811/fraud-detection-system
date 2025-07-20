export type Timeframe = '1h' | '6h' | '12h' | '24h' | '7d' | '30d' | 'all';

export interface TimeframeFilter {
  where: {
    timestamp?: {
      gte?: Date;
    };
    created_at?: {
      gte?: Date;
    };
  };
}

/**
 * Get timeframe filter for database queries
 * @param timeframe - The timeframe to filter by
 * @returns Object with where clause for Prisma queries
 */
export function getTimeframeFilter(timeframe: Timeframe): TimeframeFilter {
  const now = new Date();

  switch (timeframe) {
    case '1h':
      return {
        where: {
          timestamp: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
          created_at: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
        },
      };
    case '6h':
      return {
        where: {
          timestamp: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
          created_at: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
        },
      };
    case '12h':
      return {
        where: {
          timestamp: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
          created_at: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
        },
      };
    case '24h':
      return {
        where: {
          timestamp: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          created_at: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      };
    case '7d':
      return {
        where: {
          timestamp: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          created_at: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      };
    case '30d':
      return {
        where: {
          timestamp: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          created_at: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
      };
    case 'all':
    default:
      return { where: {} };
  }
}

/**
 * Get timeframe filter for timestamp field only
 */
export function getTimestampFilter(timeframe: Timeframe) {
  const filter = getTimeframeFilter(timeframe);
  return { timestamp: filter.where.timestamp };
}

/**
 * Get timeframe filter for created_at field only
 */
export function getCreatedAtFilter(timeframe: Timeframe) {
  const filter = getTimeframeFilter(timeframe);
  return { created_at: filter.where.created_at };
}

/**
 * Validate timeframe parameter
 */
export function isValidTimeframe(timeframe: string): timeframe is Timeframe {
  return ['1h', '6h', '12h', '24h', '7d', '30d', 'all'].includes(timeframe);
}
