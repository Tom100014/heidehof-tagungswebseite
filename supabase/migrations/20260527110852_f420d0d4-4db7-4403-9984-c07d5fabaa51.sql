
-- 1. Drop public read on clara-uploads (user-uploaded private files)
DROP POLICY IF EXISTS "public read clara-uploads" ON storage.objects;
UPDATE storage.buckets SET public = false WHERE id = 'clara-uploads';

-- 2. Admin SELECT policy for email_send_log
CREATE POLICY "Admins read email_send_log"
ON public.email_send_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Admin SELECT policy for suppressed_emails
CREATE POLICY "Admins read suppressed_emails"
ON public.suppressed_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Restrict prompt_layouts public read to admins
DROP POLICY IF EXISTS "public read active layouts" ON public.prompt_layouts;
CREATE POLICY "Admins read prompt_layouts"
ON public.prompt_layouts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
