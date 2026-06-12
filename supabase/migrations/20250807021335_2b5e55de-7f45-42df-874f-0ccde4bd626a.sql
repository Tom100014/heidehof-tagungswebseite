-- Fix the cron job syntax by properly escaping the inner SELECT statement
CREATE OR REPLACE FUNCTION setup_blog_automation_cron_fixed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete existing cron jobs for blog automation
  PERFORM cron.unschedule('automated-blog-generation-08-00');
  PERFORM cron.unschedule('automated-blog-generation-16-00');
  PERFORM cron.unschedule('automated-blog-generation-hourly');
  
  -- Create comprehensive cron job that checks all schedules every hour
  PERFORM cron.schedule(
    'automated-blog-generation-hourly',
    '0 * * * *',
    $$SELECT net.http_post(
      url := 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/automated-blog-generator',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
      body := '{"trigger_type": "cron", "execution_context": "automated_hourly"}'::jsonb
    )$$
  );
END;
$$;

-- Execute the fixed function
SELECT setup_blog_automation_cron_fixed();