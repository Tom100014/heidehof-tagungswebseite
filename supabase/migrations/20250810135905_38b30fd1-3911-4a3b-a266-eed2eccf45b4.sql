
-- 1) admin_messages wieder strikt absichern

-- Drop öffentliche View-Policy, falls vorhanden
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_messages'
      AND policyname = 'Public can view admin messages'
  ) THEN
    EXECUTE 'DROP POLICY "Public can view admin messages" ON public.admin_messages';
  END IF;
END$$;

-- Drop öffentliche Update-Policy, falls vorhanden
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_messages'
      AND policyname = 'Allow limited public updates to admin_messages'
  ) THEN
    EXECUTE 'DROP POLICY "Allow limited public updates to admin_messages" ON public.admin_messages';
  END IF;
END$$;

-- Belasse bestehende Admin-Policies (SELECT/UPDATE/DELETE mit is_admin()) unverändert.
-- Trigger public.enforce_admin_messages_update() bleibt aktiv (Feldschutz + Status-Validierung).

-- Optional: Falls INSERT heute öffentlich benötigt wird (Formulare), nichts ändern.
-- Wenn Einfügen ausschließlich per Server/Edge-Functions erfolgt, können wir INSERT später auf is_admin() einschränken.


-- 2) Whitelist für Sofort-Zugang erstellen
CREATE TABLE IF NOT EXISTS public.allowed_admin_emails (
  email text PRIMARY KEY,
  is_super_admin boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_admin_emails ENABLE ROW LEVEL SECURITY;

-- Nur Super-Admins sehen/ändern die Whitelist
DROP POLICY IF EXISTS "Super admins can manage allowed_admin_emails" ON public.allowed_admin_emails;
CREATE POLICY "Super admins can manage allowed_admin_emails"
  ON public.allowed_admin_emails
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Seed: Haupt-Admin-E-Mail (anpassbar)
INSERT INTO public.allowed_admin_emails (email, is_super_admin)
VALUES ('admin@heidehof.com', true)
ON CONFLICT (email) DO NOTHING;


-- 3) Sichere Funktion für Sofort-Zugang (promote current user)
CREATE OR REPLACE FUNCTION public.grant_admin_to_current_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_is_super boolean;
  v_profile_id uuid;
  v_role admin_role;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- E-Mail des aktuellen Benutzers holen
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Current user has no email';
  END IF;

  -- Prüfen, ob E-Mail auf Whitelist steht
  SELECT is_super_admin INTO v_is_super
  FROM public.allowed_admin_emails
  WHERE lower(email) = lower(v_email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email % is not allowed for admin access', v_email;
  END IF;

  v_role := CASE WHEN v_is_super THEN 'super_admin'::admin_role ELSE 'admin'::admin_role END;

  -- Admin-Profil setzen/aktivieren
  INSERT INTO public.admin_profiles (user_id, email, role, is_active)
  VALUES (v_user_id, v_email, v_role, true)
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        is_active = true,
        updated_at = now()
  RETURNING id INTO v_profile_id;

  -- Audit-Log
  PERFORM public.log_security_action(
    'grant_admin_to_current_user',
    jsonb_build_object('email', v_email, 'role', v_role::text, 'method', 'self_service')
  );

  RETURN json_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'email', v_email,
    'role', v_role::text
  );
END;
$$;


-- 4) Info/Hinweis:
-- Die Policies auf admin_messages sind jetzt "Admin-only" für Lesen/Aktualisieren.
-- Die Funktion grant_admin_to_current_user() erlaubt nur Whitelist-E-Mails die Selbst-Eskalation.
-- Den bestehenden Update-Trigger (enforce_admin_messages_update) NICHT entfernen.

