-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to regenerate weather activity cache every 4 hours
-- Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
SELECT cron.schedule(
  'regenerate-weather-cache',
  '0 */4 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/generate-weather-cache',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQwNDAzMiwiZXhwIjoyMDU5OTgwMDMyfQ.YBN0qXW-EkKiifg4T2hxYHlGGpwxzSLiNeNdYRFtCJI"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);