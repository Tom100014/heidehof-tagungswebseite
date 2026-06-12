-- Phase 5: Add CRT button link fields to popup_events
ALTER TABLE popup_events 
ADD COLUMN IF NOT EXISTS crt_button_id UUID REFERENCES crt_buttons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS custom_link TEXT,
ADD COLUMN IF NOT EXISTS link_text TEXT DEFAULT 'Jetzt entdecken';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_popup_events_crt_button 
ON popup_events(crt_button_id);

-- Add comment
COMMENT ON COLUMN popup_events.crt_button_id IS 'Optional reference to a CRT button for linking';
COMMENT ON COLUMN popup_events.custom_link IS 'Optional custom URL if not using a CRT button';
COMMENT ON COLUMN popup_events.link_text IS 'Text for the call-to-action button';