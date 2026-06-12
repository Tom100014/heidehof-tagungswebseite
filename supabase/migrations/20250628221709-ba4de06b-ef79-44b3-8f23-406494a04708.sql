
-- RLS-Policies für contact_requests Tabelle erstellen

-- Policy für öffentliche Inserts (damit Gäste Beschwerden einreichen können)
CREATE POLICY "Allow public inserts for contact requests"
ON public.contact_requests
FOR INSERT
TO public
WITH CHECK (true);

-- Policy für öffentliches Lesen (damit Admins alle Beschwerden sehen können)
CREATE POLICY "Allow public read for contact requests"
ON public.contact_requests
FOR SELECT
TO public
USING (true);

-- Policy für Updates (damit Status geändert werden kann)
CREATE POLICY "Allow public updates for contact requests"
ON public.contact_requests
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy für Löschungen (damit Admins Beschwerden löschen können)
CREATE POLICY "Allow public delete for contact requests"
ON public.contact_requests
FOR DELETE
TO public
USING (true);
