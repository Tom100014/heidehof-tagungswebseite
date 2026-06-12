DO $$ BEGIN
  -- 05:00 refresh
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingolstadt-live-refresh-0500') THEN
    PERFORM cron.schedule(
      'ingolstadt-live-refresh-0500',
      '0 5 * * *',
      $cron$
      SELECT net.http_post(
        url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
        headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haHF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
        body => '{"window_label":"morning"}'::jsonb
      );
      $cron$
    );
  END IF;

  -- 12:00 refresh
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingolstadt-live-refresh-1200') THEN
    PERFORM cron.schedule(
      'ingolstadt-live-refresh-1200',
      '0 12 * * *',
      $cron$
      SELECT net.http_post(
        url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
        headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haHF3cW13eWZ6a2tlIiwicm9sZSI6ImFub2siLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
        body => '{"window_label":"noon"}'::jsonb
      );
      $cron$
    );
  END IF;

  -- 16:00 refresh
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingolstadt-live-refresh-1600') THEN
    PERFORM cron.schedule(
      'ingolstadt-live-refresh-1600',
      '0 16 * * *',
      $cron$
      SELECT net.http_post(
        url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
        headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haHF3cW13eWZ6a2tlIiwicm9sZSI6Im9id2hrbG1haHF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
        body => '{"window_label":"afternoon"}'::jsonb
      );
      $cron$
    );
  END IF;

  -- 03:00 cleanup
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-ingolstadt-live-snapshots-0300') THEN
    PERFORM cron.schedule(
      'cleanup-ingolstadt-live-snapshots-0300',
      '0 3 * * *',
      $cron$
      SELECT public.cleanup_ingolstadt_live_snapshots();
      $cron$
    );
  END IF;
END $$;