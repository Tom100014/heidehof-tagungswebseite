-- Schedule daily kitchen final report at 10:31
select cron.schedule(
  'kitchen-final-report-1031',
  '31 10 * * *',
  $$
  select net.http_post(
    url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/send-kitchen-final-report',
    headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
    body => jsonb_build_object('trigger', 'cron')
  );
  $$
);
