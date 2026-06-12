CREATE OR REPLACE FUNCTION public.validate_site_image_brightness()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.brightness < 0.35 OR NEW.brightness > 1.8 THEN
    RAISE EXCEPTION 'brightness must be between 0.35 and 1.8';
  END IF;
  RETURN NEW;
END;
$function$;