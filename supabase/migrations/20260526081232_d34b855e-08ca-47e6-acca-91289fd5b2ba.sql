
-- 1) Restrict admin_help_texts read access to admins only
DROP POLICY IF EXISTS "public read active help texts" ON public.admin_help_texts;
CREATE POLICY "admins read help texts"
  ON public.admin_help_texts
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) Restrict menu_layout_templates read access to admins only (prompt is internal IP)
DROP POLICY IF EXISTS "public read templates" ON public.menu_layout_templates;
CREATE POLICY "admins read templates"
  ON public.menu_layout_templates
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) clara-uploads storage: restrict INSERT to authenticated users (was anonymous)
DROP POLICY IF EXISTS "anyone upload clara files" ON storage.objects;
DROP POLICY IF EXISTS "anyone read own clara files" ON storage.objects;

CREATE POLICY "authenticated upload clara files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clara-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "authenticated read own clara files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'clara-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
