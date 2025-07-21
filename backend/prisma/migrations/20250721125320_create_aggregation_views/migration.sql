-- Create aggregation views for dashboard charts and statistics
-- This file contains PostgreSQL views for efficient data aggregation

-- Alert trends by hour (for chart data)
CREATE OR REPLACE VIEW alert_trends_hourly AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour_bucket,
  COUNT(*)::integer as alert_count,
  COUNT(CASE WHEN status = 'open' THEN 1 END)::integer as open_alerts,
  COUNT(CASE WHEN risk_score >= 75 THEN 1 END)::integer as high_risk_alerts
FROM alerts 
WHERE created_at IS NOT NULL
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket DESC;

-- Risk distribution (for pie chart)
CREATE OR REPLACE VIEW risk_distribution AS
SELECT 
  CASE 
    WHEN rs.risk_score < 30 THEN 'low'
    WHEN rs.risk_score < 70 THEN 'medium'
    ELSE 'high'
  END as risk_level,
  COUNT(*)::integer as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM risk_signals), 2) as percentage
FROM risk_signals rs
GROUP BY risk_level
ORDER BY count DESC;

-- Transaction volume by hour (for chart data)
CREATE OR REPLACE VIEW transaction_volume_hourly AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour_bucket,
  COUNT(*)::integer as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM transactions 
WHERE timestamp IS NOT NULL
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour_bucket DESC;

-- Daily statistics (for dashboard stats)
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
  DATE(timestamp) as date,
  COUNT(*)::integer as transaction_count,
  COUNT(CASE WHEN DATE(timestamp) = CURRENT_DATE THEN 1 END)::integer as today_transactions,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM transactions 
WHERE timestamp IS NOT NULL
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Alert statistics by day
CREATE OR REPLACE VIEW alert_stats_daily AS
SELECT 
  DATE(created_at) as date,
  COUNT(*)::integer as alert_count,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::integer as today_alerts,
  COUNT(CASE WHEN status = 'open' THEN 1 END)::integer as open_alerts,
  COUNT(CASE WHEN risk_score >= 75 THEN 1 END)::integer as high_risk_alerts
FROM alerts 
WHERE created_at IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Current dashboard stats (real-time)
CREATE OR REPLACE VIEW current_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM transactions)::integer as total_transactions,
  (SELECT COUNT(*) FROM alerts)::integer as total_alerts,
  (SELECT COUNT(*) FROM alerts WHERE status = 'open')::integer as open_alerts,
  (SELECT COUNT(*) FROM risk_signals WHERE risk_score >= 75)::integer as high_risk_transactions,
  (SELECT COUNT(*) FROM transactions WHERE DATE(timestamp) = CURRENT_DATE)::integer as today_transactions,
  (SELECT COUNT(*) FROM alerts WHERE DATE(created_at) = CURRENT_DATE)::integer as today_alerts,
  (SELECT ROUND(AVG(risk_score), 2) FROM risk_signals) as avg_risk_score;

-- Recent activity (last 24 hours)
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
  'transaction' as type,
  transaction_id as id,
  timestamp as created_at,
  amount,
  status
FROM transactions 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'alert' as type,
  alert_id as id,
  created_at,
  risk_score as amount,
  status
FROM alerts 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
