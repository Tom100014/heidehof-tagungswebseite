-- ============================================
-- PHASE 1: KRITISCHE SICHERHEIT - RLS AKTIVIEREN
-- ============================================

-- 1. RLS für admin_messages aktivieren
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Admins können alle Nachrichten sehen
CREATE POLICY "Admins can view all messages"
ON public.admin_messages
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy: Admins können Nachrichten aktualisieren (Status, Antwort)
CREATE POLICY "Admins can update messages"
ON public.admin_messages
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Policy: System kann Nachrichten einfügen (für Edge Functions)
CREATE POLICY "System can insert messages"
ON public.admin_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. RLS für hotel_settings aktivieren
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann Hotel-Einstellungen lesen
CREATE POLICY "Anyone can view hotel settings"
ON public.hotel_settings
FOR SELECT
TO authenticated
USING (true);

-- Policy: Nur Super-Admins können Hotel-Einstellungen ändern
CREATE POLICY "Super admins can update hotel settings"
ON public.hotel_settings
FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 3. Notifications Tabelle erweitern und sichern
-- Füge user_id hinzu für personalisierte Benachrichtigungen
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Aktiviere RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins sehen ihre eigenen Notifications (oder alle wenn NULL für broadcast)
CREATE POLICY "Admins can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid() OR user_id IS NULL)
  AND public.is_admin(auth.uid())
);

-- Policy: System kann Notifications erstellen
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Policy: Admins können ihre Notifications aktualisieren
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid() OR user_id IS NULL)
  AND public.is_admin(auth.uid())
);

-- 4. Audit-Log-Funktion für sensible Aktionen
CREATE OR REPLACE FUNCTION public.log_admin_security_action(
  action_type TEXT,
  affected_table TEXT,
  record_id TEXT DEFAULT NULL,
  details JSONB DEFAULT '{}'::JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.api_logs (
    endpoint,
    request_data,
    status_code,
    created_at
  ) VALUES (
    'security_' || action_type,
    jsonb_build_object(
      'admin_id', auth.uid(),
      'table', affected_table,
      'record_id', record_id,
      'timestamp', now(),
      'details', details
    ),
    200,
    now()
  );
END;
$$;