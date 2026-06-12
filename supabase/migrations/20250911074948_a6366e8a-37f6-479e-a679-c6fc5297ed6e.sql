-- Optimized Ingolstadt Live cron schedule: 6:00, 12:00, 18:00
-- Safely handle missing cron jobs

DO $$ 
DECLARE
  job_names text[] := ARRAY[
    'ingolstadt-live-refresh-05',
    'ingolstadt-live-refresh-0500', 
    'ingolstadt-live-refresh-12',
    'ingolstadt-live-refresh-1200',
    'ingolstadt-live-refresh-16', 
    'ingolstadt-live-refresh-1600',
    'ingolstadt-live-retention',
    'cleanup-ingolstadt-live-snapshots-0300'
  ];
  job_name text;
BEGIN
  -- Safely unschedule existing jobs
  FOREACH job_name IN ARRAY job_names LOOP
    BEGIN
      PERFORM cron.unschedule(job_name);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore if job doesn't exist
      NULL;
    END;
  END LOOP;

  -- Schedule optimized 3x daily refreshes
  PERFORM cron.schedule(
    'ingolstadt-live-refresh-0600',
    '0 6 * * *',
    $cron$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
      body => '{"window_label": "morning"}'::jsonb
    );
    $cron$
  );

  PERFORM cron.schedule(
    'ingolstadt-live-refresh-1200',
    '0 12 * * *',
    $cron$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
      body => '{"window_label": "noon"}'::jsonb
    );
    $cron$
  );

  PERFORM cron.schedule(
    'ingolstadt-live-refresh-1800',
    '0 18 * * *',
    $cron$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
      body => '{"window_label": "afternoon"}'::jsonb
    );
    $cron$
  );

  -- Daily cleanup at 3:00 AM
  PERFORM cron.schedule(
    'cleanup-ingolstadt-snapshots-0300',
    '0 3 * * *',
    $cron$
    DELETE FROM public.ingolstadt_live_snapshots
    WHERE generated_at < now() - interval '3 days';
    $cron$
  );

END $$;