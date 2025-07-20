-- Apply aggregation views for dashboard charts and statistics
-- Run this script to create the PostgreSQL views

-- Alert trends by hour (for chart data)
CREATE OR REPLACE VIEW alert_trends_hourly AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour_bucket,
  COUNT(*) as alert_count,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_alerts,
  COUNT(CASE WHEN risk_score >= 75 THEN 1 END) as high_risk_alerts
FROM alerts 
WHERE created_at IS NOT NULL
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket DESC;

-- Risk distribution (for pie chart)
CREATE OR REPLACE VIEW risk_distribution AS
SELECT 
  CASE 
    WHEN risk_score < 30 THEN 'low'
    WHEN risk_score < 70 THEN 'medium'
    ELSE 'high'
  END as risk_level,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions), 2) as percentage
FROM transactions 
GROUP BY risk_level
ORDER BY count DESC;

-- Transaction volume by hour (for chart data)
CREATE OR REPLACE VIEW transaction_volume_hourly AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour_bucket,
  COUNT(*) as transaction_count,
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
  COUNT(*) as transaction_count,
  COUNT(CASE WHEN DATE(timestamp) = CURRENT_DATE THEN 1 END) as today_transactions,
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
  COUNT(*) as alert_count,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_alerts,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_alerts,
  COUNT(CASE WHEN risk_score >= 75 THEN 1 END) as high_risk_alerts
FROM alerts 
WHERE created_at IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Current dashboard stats (real-time)
CREATE OR REPLACE VIEW current_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM transactions) as total_transactions,
  (SELECT COUNT(*) FROM alerts) as total_alerts,
  (SELECT COUNT(*) FROM alerts WHERE status = 'open') as open_alerts,
  (SELECT COUNT(*) FROM risk_signals WHERE risk_score >= 75) as high_risk_transactions,
  (SELECT COUNT(*) FROM transactions WHERE DATE(timestamp) = CURRENT_DATE) as today_transactions,
  (SELECT COUNT(*) FROM alerts WHERE DATE(created_at) = CURRENT_DATE) as today_alerts,
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp_hour ON transactions (DATE_TRUNC('hour', timestamp));
CREATE INDEX IF NOT EXISTS idx_alerts_created_at_hour ON alerts (DATE_TRUNC('hour', created_at));
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_alerts_date ON alerts (DATE(created_at)); 