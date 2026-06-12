
-- 1) Tabelle für Snapshots
CREATE TABLE IF NOT EXISTS public.ingolstadt_live_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  payload jsonb NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  window_label text NOT NULL CHECK (window_label IN ('morning','noon','afternoon','overnight')),
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (window_end > window_start)
);

-- Eindeutigkeit pro Fenster/Kategorie
CREATE UNIQUE INDEX IF NOT EXISTS ing_live_unique
  ON public.ingolstadt_live_snapshots (category, window_start);

-- Nützlicher Index
CREATE INDEX IF NOT EXISTS ing_live_cat_window_idx
  ON public.ingolstadt_live_snapshots (category, window_start DESC);

-- updated_at Trigger
CREATE TRIGGER update_ingolstadt_live_snapshots_updated_at
  BEFORE UPDATE ON public.ingolstadt_live_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS einschalten
ALTER TABLE public.ingolstadt_live_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view ingolstadt live snapshots" ON public.ingolstadt_live_snapshots;
CREATE POLICY "Public can view ingolstadt live snapshots"
  ON public.ingolstadt_live_snapshots FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage ingolstadt live snapshots" ON public.ingolstadt_live_snapshots;
CREATE POLICY "Admins can manage ingolstadt live snapshots"
  ON public.ingolstadt_live_snapshots FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 2) Cleanup-Funktion (löscht Snapshots älter als 3 Tage)
CREATE OR REPLACE FUNCTION public.cleanup_ingolstadt_live_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.ingolstadt_live_snapshots
  WHERE generated_at < now() - interval '3 days';
END;
$function$;

-- 3) Cron-Jobs einrichten: 05:00, 12:00, 16:00 Refresh + 03:00 Cleanup

-- Vorher vorhandene Jobs (falls vorhanden) entfernen
SELECT cron.unschedule('ingolstadt-live-refresh-05');
SELECT cron.unschedule('ingolstadt-live-refresh-12');
SELECT cron.unschedule('ingolstadt-live-refresh-16');
SELECT cron.unschedule('ingolstadt-live-retention');

-- Refresh 05:00
SELECT cron.schedule(
  'ingolstadt-live-refresh-05',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
    body := '{"window_label":"morning"}'::jsonb
  );
  $$
);

-- Refresh 12:00
SELECT cron.schedule(
  'ingolstadt-live-refresh-12',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
    body := '{"window_label":"noon"}'::jsonb
  );
  $$
);

-- Refresh 16:00
SELECT cron.schedule(
  'ingolstadt-live-refresh-16',
  '0 16 * * *',
  $$
  SELECT net.http_post(
    url := 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-refresh',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
    body := '{"window_label":"afternoon"}'::jsonb
  );
  $$
);

-- Cleanup 03:00
SELECT cron.schedule(
  'ingolstadt-live-retention',
  '0 3 * * *',
  $$ SELECT public.cleanup_ingolstadt_live_snapshots(); $$
);
