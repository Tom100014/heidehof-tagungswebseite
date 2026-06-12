GRANT SELECT ON public.room_setups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.room_setups TO authenticated;
GRANT ALL ON public.room_setups TO service_role;