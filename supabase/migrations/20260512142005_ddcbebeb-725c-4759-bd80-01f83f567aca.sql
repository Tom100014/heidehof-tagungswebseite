
-- Allow anonymous public ordering via SECURITY DEFINER RPC
-- Bypasses the missing SELECT policy on conference_orders without exposing rows publicly.

CREATE OR REPLACE FUNCTION public.create_conference_order(
  p_room_id uuid,
  p_service_date date,
  p_guest_name text,
  p_company text,
  p_email text,
  p_meal_type text,
  p_participants integer,
  p_notes text,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
BEGIN
  INSERT INTO public.conference_orders (
    room_id, service_date, guest_name, company, email, meal_type, participants, notes
  ) VALUES (
    p_room_id, p_service_date, p_guest_name, p_company, p_email,
    p_meal_type::meal_type, COALESCE(p_participants, 1), p_notes
  )
  RETURNING id INTO v_order_id;

  IF jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO public.conference_order_items (order_id, course, dish_type, quantity)
      VALUES (
        v_order_id,
        COALESCE(v_item->>'course', 'main'),
        (v_item->>'dish_type')::dish_type,
        COALESCE((v_item->>'quantity')::int, 1)
      );
    END LOOP;
  END IF;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_conference_order(uuid, date, text, text, text, text, integer, text, jsonb) TO anon, authenticated;
