-- conference_menus
CREATE TABLE IF NOT EXISTS public.conference_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_date date NOT NULL UNIQUE,
  lunch_appetizer text DEFAULT '',
  lunch_main_dish_fish jsonb DEFAULT '{}'::jsonb,
  lunch_main_dish_meat jsonb DEFAULT '{}'::jsonb,
  lunch_main_dish_vegetarian jsonb DEFAULT '{}'::jsonb,
  lunch_dessert text DEFAULT '',
  dinner_appetizer text DEFAULT '',
  dinner_main_dish_fish jsonb DEFAULT '{}'::jsonb,
  dinner_main_dish_meat jsonb DEFAULT '{}'::jsonb,
  dinner_main_dish_vegetarian jsonb DEFAULT '{}'::jsonb,
  dinner_dessert text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conference_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read menus" ON public.conference_menus
  FOR SELECT USING (true);
CREATE POLICY "admins manage menus" ON public.conference_menus
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER conference_menus_touch
  BEFORE UPDATE ON public.conference_menus
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- conference_menu_images
CREATE TABLE IF NOT EXISTS public.conference_menu_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.conference_menus(id) ON DELETE CASCADE,
  image_type text NOT NULL,
  image_url text NOT NULL,
  storage_path text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_images_menu ON public.conference_menu_images(menu_id, image_type);

ALTER TABLE public.conference_menu_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read menu images" ON public.conference_menu_images
  FOR SELECT USING (true);
CREATE POLICY "admins manage menu images" ON public.conference_menu_images
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- daily_menu_assets
CREATE TABLE IF NOT EXISTS public.daily_menu_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL UNIQUE REFERENCES public.conference_menus(id) ON DELETE CASCADE,
  menu_date date NOT NULL,
  pdf_path text,
  pdf_url text,
  images jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_menu_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read daily assets" ON public.daily_menu_assets
  FOR SELECT USING (true);
CREATE POLICY "admins manage daily assets" ON public.daily_menu_assets
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER daily_menu_assets_touch
  BEFORE UPDATE ON public.daily_menu_assets
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- storage bucket menu-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read menu-images"
  ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "admins write menu-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins update menu-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admins delete menu-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND has_role(auth.uid(),'admin'::app_role));