ALTER TABLE public.room_images
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_room_images_room_sort
  ON public.room_images(room_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_room_images_tags
  ON public.room_images USING GIN(tags);