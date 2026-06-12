-- Test if cron jobs exist and create them if missing
DO $$ 
BEGIN
  -- Check if cron extension is available
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  END IF;
  
  -- Delete existing jobs if they exist
  DELETE FROM cron.job WHERE jobname LIKE 'ingolstadt-live-%';
  
  -- Create morning refresh job (05:00 UTC)
  PERFORM cron.schedule(
    'ingolstadt-live-morning',
    '0 5 * * *',
    $$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQwNDAzMiwiZXhwIjoyMDU5OTgwMDMyfQ.H8nJlHOxYIe4bNQFucdF1I8VpIgLK8k5A0bNO4rCOWs"}'::jsonb,
      body => '{"window_label": "morning", "categories": ["events", "highlights", "gastronomy", "shopping", "culture", "audi", "wellness"]}'::jsonb
    );
    $$
  );

  -- Create noon refresh job (12:00 UTC)
  PERFORM cron.schedule(
    'ingolstadt-live-noon',
    '0 12 * * *',
    $$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQwNDAzMiwiZXhwIjoyMDU5OTgwMDMyfQ.H8nJlHOxYIe4bNQFucdF1I8VpIgLK8k5A0bNO4rCOWs"}'::jsonb,
      body => '{"window_label": "noon", "categories": ["events", "highlights", "gastronomy", "shopping", "culture", "audi", "wellness"]}'::jsonb
    );
    $$
  );

  -- Create afternoon refresh job (16:00 UTC) 
  PERFORM cron.schedule(
    'ingolstadt-live-afternoon',
    '0 16 * * *',
    $$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQwNDAzMiwiZXhwIjoyMDU5OTgwMDMyfQ.H8nJlHOxYIe4bNQFucdF1I8VpIgLK8k5A0bNO4rCOWs"}'::jsonb,
      body => '{"window_label": "afternoon", "categories": ["events", "highlights", "gastronomy", "shopping", "culture", "audi", "wellness"]}'::jsonb
    );
    $$
  );

  RAISE NOTICE 'Cron jobs für Ingolstadt Live Ticker wurden erfolgreich eingerichtet';
END $$;