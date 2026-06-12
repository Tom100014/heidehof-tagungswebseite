
-- Füge 2 weitere Video-Buttons hinzu
INSERT INTO video_buttons (
  name,
  icon_name,
  video_key,
  position,
  is_active
) VALUES 
(
  'Konferenz',
  'Presentation',
  'conference-video',
  (SELECT COALESCE(MAX(position), 0) + 1 FROM video_buttons),
  true
),
(
  'Zimmerservice',
  'BedDouble', 
  'room-service-video',
  (SELECT COALESCE(MAX(position), 0) + 2 FROM video_buttons),
  true
);
