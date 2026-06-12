-- Create storage bucket for AI generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-generated-images', 'ai-generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for ai-generated-images bucket
CREATE POLICY "Anyone can view AI generated images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-generated-images');

CREATE POLICY "Admins can upload AI generated images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ai-generated-images' 
  AND (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR auth.role() = 'service_role'
  )
);

CREATE POLICY "Admins can delete AI generated images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ai-generated-images' 
  AND (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR auth.role() = 'service_role'
  )
);