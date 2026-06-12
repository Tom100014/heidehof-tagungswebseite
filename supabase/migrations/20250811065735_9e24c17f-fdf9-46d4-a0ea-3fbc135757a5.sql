-- Create table for daily Ingolstadt live snapshots
CREATE TABLE IF NOT EXISTS public.ingolstadt_live_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  window_label TEXT NOT NULL CHECK (window_label IN ('morning','noon','afternoon','overnight')),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ingolstadt_live_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'ingolstadt_live_snapshots' 
      AND policyname = 'Anyone can view ingolstadt live snapshots'
  ) THEN
    CREATE POLICY "Anyone can view ingolstadt live snapshots"
    ON public.ingolstadt_live_snapshots
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Update updated_at on change
CREATE OR REPLACE FUNCTION public.update_ingolstadt_live_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ingolstadt_live_snapshots_updated_at ON public.ingolstadt_live_snapshots;
CREATE TRIGGER trg_update_ingolstadt_live_snapshots_updated_at
BEFORE UPDATE ON public.ingolstadt_live_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_ingolstadt_live_snapshots_updated_at();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ing_snapshots_cat_window_time
  ON public.ingolstadt_live_snapshots (category, window_label, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ing_snapshots_generated_at
  ON public.ingolstadt_live_snapshots (generated_at DESC);

-- Cleanup function to avoid storage growth (keep last 2 days)
CREATE OR REPLACE FUNCTION public.cleanup_ingolstadt_live_snapshots()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ingolstadt_live_snapshots
  WHERE generated_at < now() - interval '2 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Schedule edge function runs at 05:00, 12:00, 16:00
-- Requires pg_cron and pg_net enabled in the project
DO $$ BEGIN
  PERFORM cron.schedule(
    'ingolstadt-live-refresh-0500',
    '0 5 * * *',
    $cron$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
      body => '{"window_label":"morning"}'::jsonb
    );
    $cron$
  );
  PERFORM cron.schedule(
    'ingolstadt-live-refresh-1200',
    '0 12 * * *',
    $cron$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub2siLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
      body => '{"window_label":"noon"}'::jsonb
    );
    $cron$
  );
  PERFORM cron.schedule(
    'ingolstadt-live-refresh-1600',
    '0 16 * * *',
    $cron$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
      body => '{"window_label":"afternoon"}'::jsonb
    );
    $cron$
  );
  -- Daily cleanup at 03:00
  PERFORM cron.schedule(
    'cleanup-ingolstadt-live-snapshots-0300',
    '0 3 * * *',
    $$ SELECT public.cleanup_ingolstadt_live_snapshots(); $$
  );
END $$;