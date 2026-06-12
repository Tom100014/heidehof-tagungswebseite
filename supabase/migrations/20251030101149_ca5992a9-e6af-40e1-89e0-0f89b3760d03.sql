-- Add image control and page targeting to popup_events
ALTER TABLE popup_events 
ADD COLUMN IF NOT EXISTS show_image boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS target_pages text[] DEFAULT ARRAY['all']::text[];

-- Add comments for documentation
COMMENT ON COLUMN popup_events.show_image IS 'Controls whether event image is displayed (true) or hidden (false)';
COMMENT ON COLUMN popup_events.target_pages IS 'Array of pages where event is shown: ["all"] or ["frontpage", "beauty", "restaurant", "bar", "shop", "meetings", "complaints"]';

-- Create index for fast page filtering
CREATE INDEX IF NOT EXISTS idx_popup_events_target_pages ON popup_events USING GIN(target_pages);

-- Update existing events to have default values
UPDATE popup_events 
SET show_image = true, 
    target_pages = ARRAY['all']::text[]
WHERE show_image IS NULL OR target_pages IS NULL;