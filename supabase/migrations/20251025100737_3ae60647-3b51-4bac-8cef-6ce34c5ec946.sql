-- Clean Slate: Delete all old conference data
-- This removes all test data and allows starting fresh

-- Delete all conference orders
DELETE FROM conference_orders;

-- Delete all conference-related admin messages
DELETE FROM admin_messages WHERE message_type = 'conference_order';

-- Reset any sequences if needed (optional)
-- ALTER SEQUENCE IF EXISTS conference_orders_id_seq RESTART WITH 1;

-- Log cleanup action
INSERT INTO api_logs (
  endpoint,
  request_data,
  status_code
) VALUES (
  'database_cleanup',
  jsonb_build_object(
    'action', 'clean_slate',
    'timestamp', now(),
    'tables_cleaned', ARRAY['conference_orders', 'admin_messages'],
    'reason', 'Fresh start - removing all test data'
  ),
  200
);