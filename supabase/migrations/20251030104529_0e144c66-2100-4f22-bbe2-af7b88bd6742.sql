-- Add missing columns for Bar Max recipe editor
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS recipe JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT NULL;