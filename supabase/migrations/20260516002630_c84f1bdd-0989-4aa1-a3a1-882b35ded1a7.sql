
ALTER TABLE public.hotel_reference_images
  ADD COLUMN IF NOT EXISTS scopes text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_ref_images_scopes ON public.hotel_reference_images USING GIN(scopes);

-- Map existing categories to scopes (best-effort)
UPDATE public.hotel_reference_images
SET scopes = ARRAY['food','conference_menu']
WHERE category = 'food' AND coalesce(array_length(scopes,1),0)=0;

UPDATE public.hotel_reference_images
SET scopes = ARRAY['wellness']
WHERE category = 'wellness' AND coalesce(array_length(scopes,1),0)=0;

UPDATE public.hotel_reference_images
SET scopes = ARRAY['events','food']
WHERE category = 'restaurant' AND coalesce(array_length(scopes,1),0)=0;

UPDATE public.hotel_reference_images
SET scopes = ARRAY['events']
WHERE category = 'rooms' AND coalesce(array_length(scopes,1),0)=0;
