ALTER TABLE public.site_images
ADD COLUMN IF NOT EXISTS brightness numeric NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.validate_site_image_brightness()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.brightness < 0.6 OR NEW.brightness > 1.8 THEN
    RAISE EXCEPTION 'brightness must be between 0.6 and 1.8';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_site_image_brightness_trigger ON public.site_images;
CREATE TRIGGER validate_site_image_brightness_trigger
BEFORE INSERT OR UPDATE OF brightness ON public.site_images
FOR EACH ROW
EXECUTE FUNCTION public.validate_site_image_brightness();