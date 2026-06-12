-- Fix Beutyfarm video key consistency
-- Update the video_buttons table to use the correct video key
UPDATE video_buttons 
SET video_key = 'beutyfarmVideoUrl'
WHERE video_key IN ('beutyfarm ', 'beutyfarm', 'beutyfarm+');