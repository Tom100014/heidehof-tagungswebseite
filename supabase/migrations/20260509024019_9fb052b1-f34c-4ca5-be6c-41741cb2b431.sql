-- 1) Remove sensitive tables from the supabase_realtime publication.
-- Realtime broadcasts row changes to subscribers; without per-channel auth
-- this leaks guest PII (conference_orders, conference_order_items) and
-- internal admin data (notifications). They are now read via REST + RLS only.
ALTER PUBLICATION supabase_realtime DROP TABLE public.conference_orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.conference_order_items;
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;

-- 2) app_settings contained internal email addresses readable by anyone.
-- Replace the public read policy with admin-only read. Edge functions
-- continue to read via the service role (bypasses RLS).
DROP POLICY IF EXISTS "public read settings" ON public.app_settings;

CREATE POLICY "Admins can read settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Default-deny on realtime.messages so unauthenticated/non-admin clients
-- cannot subscribe to arbitrary channels. (No CREATE POLICY = no access
-- because RLS is enabled on realtime.messages by Supabase.)
-- We add an explicit deny-by-omission: revoke broad access just to be safe.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'realtime' AND c.relname = 'messages'
  ) THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;