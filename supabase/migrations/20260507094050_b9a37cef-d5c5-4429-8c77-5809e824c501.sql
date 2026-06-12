
-- Extend conference_orders for v2 ordering flow
ALTER TABLE public.conference_orders
  ADD COLUMN IF NOT EXISTS meal_type meal_type,
  ADD COLUMN IF NOT EXISTS menu_id uuid,
  ADD COLUMN IF NOT EXISTS participants integer NOT NULL DEFAULT 1;

-- Replace conference_order_items with new structure (drop+recreate; system has no production data yet)
DROP TABLE IF EXISTS public.conference_order_items CASCADE;

CREATE TABLE public.conference_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.conference_orders(id) ON DELETE CASCADE,
  menu_id uuid REFERENCES public.conference_menus(id) ON DELETE SET NULL,
  course text NOT NULL CHECK (course IN ('appetizer','main','dessert')),
  dish_type text CHECK (dish_type IN ('fish','meat','vegetarian')),
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conference_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone insert items" ON public.conference_order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read items" ON public.conference_order_items
  FOR SELECT USING (has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete items" ON public.conference_order_items
  FOR DELETE USING (has_role(auth.uid(),'admin'));

CREATE INDEX idx_order_items_order ON public.conference_order_items(order_id);
CREATE INDEX idx_orders_date_meal ON public.conference_orders(service_date, meal_type);

-- Realtime
ALTER TABLE public.conference_orders REPLICA IDENTITY FULL;
ALTER TABLE public.conference_order_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conference_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conference_order_items;
