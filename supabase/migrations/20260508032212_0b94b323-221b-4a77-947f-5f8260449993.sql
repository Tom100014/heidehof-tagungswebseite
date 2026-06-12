
CREATE TABLE IF NOT EXISTS public.menu_layout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  prompt text,
  image_url text not null,
  storage_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
ALTER TABLE public.menu_layout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read templates" ON public.menu_layout_templates FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage templates" ON public.menu_layout_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public) VALUES ('menu-layouts', 'menu-layouts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read menu-layouts" ON storage.objects;
CREATE POLICY "public read menu-layouts" ON storage.objects FOR SELECT USING (bucket_id = 'menu-layouts');
DROP POLICY IF EXISTS "admins write menu-layouts" ON storage.objects;
CREATE POLICY "admins write menu-layouts" ON storage.objects FOR ALL
  USING (bucket_id = 'menu-layouts' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'menu-layouts' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "public read site-images" ON storage.objects;
CREATE POLICY "public read site-images" ON storage.objects FOR SELECT USING (bucket_id = 'site-images');
DROP POLICY IF EXISTS "admins write site-images" ON storage.objects;
CREATE POLICY "admins write site-images" ON storage.objects FOR ALL
  USING (bucket_id = 'site-images' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'site-images' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "public read menu-cards" ON storage.objects;
CREATE POLICY "public read menu-cards" ON storage.objects FOR SELECT USING (bucket_id = 'menu-cards');
DROP POLICY IF EXISTS "admins write menu-cards" ON storage.objects;
CREATE POLICY "admins write menu-cards" ON storage.objects FOR ALL
  USING (bucket_id = 'menu-cards' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'menu-cards' AND has_role(auth.uid(), 'admin'::app_role));
