create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove existing job if present
do $$
declare jid bigint;
begin
  select jobid into jid from cron.job where jobname = 'kitchen-final-report-1030';
  if jid is not null then perform cron.unschedule(jid); end if;
end $$;

select cron.schedule(
  'kitchen-final-report-1030',
  '30 9 * * *', -- 09:30 UTC = 10:30 Berlin (Sommerzeit; akzeptable Näherung)
  $$
  select net.http_post(
    url:='https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/send-kitchen-final-report',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrd2dxZHlhbW9tdmFpaGJvZmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDMyMTIsImV4cCI6MjA5MzY3OTIxMn0.DovpYAlaiIKy1D866tQ2ylpNqZrxJ6mxR7-lXkmcI0Y"}'::jsonb,
    body:=jsonb_build_object('trigger','cron','at',now()::text)
  );
  $$
);