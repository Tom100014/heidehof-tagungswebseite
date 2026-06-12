-- Copy the Beutyfarm video to the correct key and remove the old one
-- Insert/Update the video under the correct key
INSERT INTO hotel_settings (setting_key, setting_value)
SELECT 'beutyfarmVideoUrl', setting_value
FROM hotel_settings 
WHERE setting_key = 'beutyfarm ';

-- Delete the old key with trailing space
DELETE FROM hotel_settings WHERE setting_key = 'beutyfarm ';