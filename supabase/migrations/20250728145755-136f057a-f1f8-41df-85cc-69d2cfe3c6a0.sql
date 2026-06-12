-- Add is_active column to conference_menu_images table
ALTER TABLE public.conference_menu_images 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add image_type column to categorize images by dish type
ALTER TABLE public.conference_menu_images 
ADD COLUMN IF NOT EXISTS image_type TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.conference_menu_images.is_active IS 'Controls whether the image is displayed in frontend';
COMMENT ON COLUMN public.conference_menu_images.image_type IS 'Type of dish image: appetizer, fish, meat, vegetarian, dessert';