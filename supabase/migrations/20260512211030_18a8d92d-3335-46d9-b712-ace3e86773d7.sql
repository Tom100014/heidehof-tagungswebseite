-- Allow admins to update conference orders (status changes)
CREATE POLICY "admins update orders" ON public.conference_orders
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER TABLE public.conference_orders REPLICA IDENTITY FULL;
ALTER TABLE public.conference_order_items REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1; ALTER PUBLICATION supabase_realtime ADD TABLE public.conference_orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conference_order_items;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service voice: update by room name + date + meal (latest order)
CREATE OR REPLACE FUNCTION public.update_order_status_by_room(
  p_room_name text,
  p_service_date date,
  p_meal_type text,
  p_status text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  SELECT o.id INTO v_order_id
  FROM public.conference_orders o
  JOIN public.conference_rooms r ON r.id = o.room_id
  WHERE lower(r.name) = lower(p_room_name)
    AND o.service_date = p_service_date
    AND (p_meal_type IS NULL OR o.meal_type::text = p_meal_type)
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Keine Bestellung für % am % gefunden', p_room_name, p_service_date;
  END IF;

  UPDATE public.conference_orders
  SET status = p_status::conference_order_status
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;