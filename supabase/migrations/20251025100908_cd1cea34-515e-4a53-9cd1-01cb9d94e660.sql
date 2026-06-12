-- Clean Slate: Delete all admin messages
-- This removes all messages and allows starting fresh

-- Delete all admin messages
DELETE FROM admin_messages;

-- Log cleanup action
INSERT INTO api_logs (
  endpoint,
  request_data,
  status_code
) VALUES (
  'admin_messages_cleanup',
  jsonb_build_object(
    'action', 'clean_slate',
    'timestamp', now(),
    'tables_cleaned', ARRAY['admin_messages'],
    'reason', 'Fresh start - removing all admin messages'
  ),
  200
);