-- Allow site_images to also hold videos
ALTER TABLE public.site_images
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS poster_url text;

ALTER TABLE public.site_images
  DROP CONSTRAINT IF EXISTS site_images_media_type_check;
ALTER TABLE public.site_images
  ADD CONSTRAINT site_images_media_type_check
  CHECK (media_type IN ('image', 'video'));

-- Ensure storage bucket allows large files / video mime types (bucket already public)
UPDATE storage.buckets
SET file_size_limit = 104857600,  -- 100 MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm','video/quicktime']
WHERE id = 'site-images';