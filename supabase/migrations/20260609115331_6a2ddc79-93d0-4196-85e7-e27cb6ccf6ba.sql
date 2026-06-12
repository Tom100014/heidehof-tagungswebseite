-- Explicit service_role INSERT policy for cartesia_call_log (audit clarity)
CREATE POLICY "Service role can insert call logs"
ON public.cartesia_call_log
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can manage call logs"
ON public.cartesia_call_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON public.cartesia_call_log TO service_role;