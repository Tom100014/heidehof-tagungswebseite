
-- Create hotel-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('hotel-media', 'hotel-media', true, 104857600, '{"image/*", "video/*"}')
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = '{"image/*", "video/*"}';

-- Create public access policy for reading files
CREATE POLICY "Public Access for hotel-media" ON storage.objects
FOR SELECT
USING (bucket_id = 'hotel-media');

-- Create policy for uploading files (anyone can upload)
CREATE POLICY "Public Upload for hotel-media" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'hotel-media');

-- Create policy for updating own files
CREATE POLICY "Public Update for hotel-media" ON storage.objects
FOR UPDATE
USING (bucket_id = 'hotel-media');

-- Create policy for deleting own files
CREATE POLICY "Public Delete for hotel-media" ON storage.objects
FOR DELETE
USING (bucket_id = 'hotel-media');
