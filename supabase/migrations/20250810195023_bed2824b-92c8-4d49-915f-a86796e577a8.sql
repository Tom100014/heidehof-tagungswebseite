-- 1) Storage-Buckets für PDFs und Bilder
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-cards','menu-cards', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images','menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Tabelle für automatische Tageskarten-Assets
CREATE TABLE IF NOT EXISTS public.daily_menu_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.conference_menus(id) ON DELETE CASCADE,
  menu_date date NOT NULL,
  pdf_path text NOT NULL,
  pdf_url text NOT NULL,
  images jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_menu_assets_menu_date_unique UNIQUE (menu_date),
  CONSTRAINT daily_menu_assets_menu_id_unique UNIQUE (menu_id)
);

-- 2a) RLS aktivieren und Policies
ALTER TABLE public.daily_menu_assets ENABLE ROW LEVEL SECURITY;

-- Jeder darf fertige Datensätze lesen (öffentliches PDF für Gäste)
DROP POLICY IF EXISTS "Anyone can view daily menu assets" ON public.daily_menu_assets;
CREATE POLICY "Anyone can view daily menu assets"
ON public.daily_menu_assets
FOR SELECT
USING (true);

-- Admins dürfen alles verwalten
DROP POLICY IF EXISTS "Admins can manage daily menu assets" ON public.daily_menu_assets;
CREATE POLICY "Admins can manage daily menu assets"
ON public.daily_menu_assets
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- updated_at automatisch pflegen
DROP TRIGGER IF EXISTS update_daily_menu_assets_updated_at ON public.daily_menu_assets;
CREATE TRIGGER update_daily_menu_assets_updated_at
BEFORE UPDATE ON public.daily_menu_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Trigger-Funktion: ruft Edge Function auf, wenn Konferenz-Menüs eingefügt/aktualisiert werden
CREATE OR REPLACE FUNCTION public.trigger_auto_menu_assets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $func$
DECLARE
  v_url text := 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/auto-menu-assets';
  v_headers jsonb := jsonb_build_object(
    'Content-Type','application/json',
    'Authorization', 'Bearer ' ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ'
  );
  v_body jsonb := jsonb_build_object('menu_id', NEW.id::text);
  v_resp jsonb;
BEGIN
  -- fire-and-forget HTTP-Aufruf
  SELECT net.http_post(
    url => v_url,
    headers => v_headers,
    body => v_body
  ) INTO v_resp;

  PERFORM public.log_security_action('auto_menu_assets_triggered', jsonb_build_object('menu_id', NEW.id::text));

  RETURN NEW;
END;
$func$;

-- 3a) Trigger an Tabelle hängen
DROP TRIGGER IF EXISTS conference_menus_auto_assets ON public.conference_menus;
CREATE TRIGGER conference_menus_auto_assets
AFTER INSERT OR UPDATE ON public.conference_menus
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_menu_assets();