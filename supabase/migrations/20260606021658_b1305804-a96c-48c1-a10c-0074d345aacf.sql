
ALTER TABLE public.day_journey_steps
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_webm_url text,
  ADD COLUMN IF NOT EXISTS loop boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS muted boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS object_position text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS autoplay_seconds integer NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS mobile_media_url text,
  ADD COLUMN IF NOT EXISTS mobile_media_type text;

ALTER TABLE public.day_journey_steps
  DROP CONSTRAINT IF EXISTS day_journey_steps_mobile_media_type_check;
ALTER TABLE public.day_journey_steps
  ADD CONSTRAINT day_journey_steps_mobile_media_type_check
  CHECK (mobile_media_type IS NULL OR mobile_media_type IN ('image','video'));
