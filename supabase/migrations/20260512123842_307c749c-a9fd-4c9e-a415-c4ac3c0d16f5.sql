ALTER TABLE public.tagungs_inquiries 
  ADD COLUMN IF NOT EXISTS anfrage_text text,
  ADD COLUMN IF NOT EXISTS angebot_text text,
  ADD COLUMN IF NOT EXISTS angebot_generated_at timestamptz;

CREATE POLICY "admins update inquiries" ON public.tagungs_inquiries
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));