UPDATE storage.buckets SET public = true WHERE id = 'clara-uploads';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='public read clara-uploads') THEN
    CREATE POLICY "public read clara-uploads" ON storage.objects FOR SELECT USING (bucket_id = 'clara-uploads');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admins write clara-uploads') THEN
    CREATE POLICY "admins write clara-uploads" ON storage.objects FOR ALL TO authenticated
      USING (bucket_id = 'clara-uploads' AND has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (bucket_id = 'clara-uploads' AND has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;