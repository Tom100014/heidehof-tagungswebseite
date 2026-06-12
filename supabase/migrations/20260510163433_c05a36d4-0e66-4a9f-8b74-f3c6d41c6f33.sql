-- Editable text snippets
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  section_key text NOT NULL,
  value_de text NOT NULL DEFAULT '',
  label text,
  description text,
  field_type text NOT NULL DEFAULT 'text',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page, section_key)
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site_content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "admins manage site_content" ON public.site_content FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- Editable media (images) per page+key
CREATE TABLE public.site_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  section_key text NOT NULL,
  url text NOT NULL,
  storage_path text,
  alt text,
  label text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page, section_key)
);

ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site_media" ON public.site_media FOR SELECT USING (true);
CREATE POLICY "admins manage site_media" ON public.site_media FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_site_media_updated_at BEFORE UPDATE ON public.site_media FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- SEO per route
CREATE TABLE public.site_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL UNIQUE,
  title text,
  description text,
  keywords text,
  og_image_url text,
  canonical text,
  noindex boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_seo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site_seo" ON public.site_seo FOR SELECT USING (true);
CREATE POLICY "admins manage site_seo" ON public.site_seo FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_site_seo_updated_at BEFORE UPDATE ON public.site_seo FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- Storage bucket for CMS uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('site-content', 'site-content', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read site-content bucket" ON storage.objects FOR SELECT USING (bucket_id = 'site-content');
CREATE POLICY "admins write site-content bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-content' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update site-content bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'site-content' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins delete site-content bucket" ON storage.objects FOR DELETE USING (bucket_id = 'site-content' AND has_role(auth.uid(), 'admin'::app_role));