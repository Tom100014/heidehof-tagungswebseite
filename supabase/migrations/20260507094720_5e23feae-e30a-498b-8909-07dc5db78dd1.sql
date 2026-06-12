
ALTER TABLE public.conference_rooms
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS equipment text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS style text DEFAULT 'modern';

CREATE TABLE IF NOT EXISTS public.room_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.conference_rooms(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  is_primary boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'upload',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read room images" ON public.room_images FOR SELECT USING (true);
CREATE POLICY "admins manage room images" ON public.room_images FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO storage.buckets (id, name, public)
  VALUES ('room-images','room-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read room-images" ON storage.objects FOR SELECT
  USING (bucket_id = 'room-images');
CREATE POLICY "Admins write room-images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'room-images' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update room-images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'room-images' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete room-images" ON storage.objects FOR DELETE
  USING (bucket_id = 'room-images' AND has_role(auth.uid(),'admin'));
