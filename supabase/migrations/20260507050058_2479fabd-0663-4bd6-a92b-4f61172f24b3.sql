
DROP POLICY IF EXISTS "public read site-images storage" ON storage.objects;
DROP POLICY IF EXISTS "admins write site-images storage" ON storage.objects;
DROP POLICY IF EXISTS "admins update site-images storage" ON storage.objects;
DROP POLICY IF EXISTS "admins delete site-images storage" ON storage.objects;
