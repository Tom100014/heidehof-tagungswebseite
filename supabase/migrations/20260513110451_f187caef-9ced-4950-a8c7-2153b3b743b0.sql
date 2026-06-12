CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.impressionen_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.impressionen_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active impressionen are publicly readable"
  ON public.impressionen_images FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage impressionen insert"
  ON public.impressionen_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage impressionen update"
  ON public.impressionen_images FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage impressionen delete"
  ON public.impressionen_images FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_impressionen_images_updated_at
  BEFORE UPDATE ON public.impressionen_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_impressionen_images_active_sort
  ON public.impressionen_images (is_active, sort_order);

INSERT INTO public.impressionen_images (title, image_url, sort_order, is_active) VALUES
  ('Salon Schiller', '/heidehof/salon-schiller.jpg', 10, true),
  ('Salon Goethe', '/heidehof/salon-goethe.jpg', 20, true),
  ('Salon Lessing', '/heidehof/salon-lessing.jpg', 30, true),
  ('Salon Hölderlin', '/heidehof/salon-hoelderlin.jpg', 40, true),
  ('Heidehof-Saal', '/heidehof/saal-heidehof.jpg', 50, true);