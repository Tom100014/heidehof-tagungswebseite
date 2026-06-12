-- Set Ingolstadt Live background image
INSERT INTO hotel_settings (setting_key, setting_value)
VALUES ('ingolstadt_live_background', '{"url": "/images/ingolstadt-live-bg.jpg"}'::jsonb)
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();