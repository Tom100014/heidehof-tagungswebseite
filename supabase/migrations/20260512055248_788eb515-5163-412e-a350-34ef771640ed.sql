
INSERT INTO storage.buckets (id, name, public)
VALUES ('image-references', 'image-references', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read image-references"
ON storage.objects FOR SELECT
USING (bucket_id = 'image-references');

CREATE POLICY "Admins insert image-references"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'image-references' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update image-references"
ON storage.objects FOR UPDATE
USING (bucket_id = 'image-references' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete image-references"
ON storage.objects FOR DELETE
USING (bucket_id = 'image-references' AND public.has_role(auth.uid(), 'admin'::app_role));
