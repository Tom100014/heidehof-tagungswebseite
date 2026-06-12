
-- Tagungsräume
CREATE TABLE public.conference_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  capacity integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Speisen-Katalog (Admin pflegt: Titel, Kategorie veg/meat/fish, gültig für Datum)
CREATE TYPE public.dish_category AS ENUM ('vegetarian','meat','fish','vegan','dessert','starter');
CREATE TYPE public.meal_type AS ENUM ('breakfast','lunch','coffee','dinner');

CREATE TABLE public.conference_dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category public.dish_category NOT NULL,
  meal_type public.meal_type NOT NULL DEFAULT 'lunch',
  service_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dishes_date ON public.conference_dishes(service_date);

-- Bestellungen pro Gast
CREATE TABLE public.conference_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.conference_rooms(id) ON DELETE RESTRICT,
  service_date date NOT NULL,
  guest_name text NOT NULL,
  company text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_date_room ON public.conference_orders(service_date, room_id);

-- Bestell-Positionen (welches Gericht der Gast gewählt hat)
CREATE TABLE public.conference_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.conference_orders(id) ON DELETE CASCADE,
  dish_id uuid NOT NULL REFERENCES public.conference_dishes(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_items_order ON public.conference_order_items(order_id);
CREATE INDEX idx_items_dish ON public.conference_order_items(dish_id);

-- RLS
ALTER TABLE public.conference_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_order_items ENABLE ROW LEVEL SECURITY;

-- Räume: öffentlich lesen (für Bestellseite), nur Admin schreiben
CREATE POLICY "public read rooms" ON public.conference_rooms FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage rooms" ON public.conference_rooms FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Speisen: öffentlich aktive lesen, Admin verwaltet
CREATE POLICY "public read dishes" ON public.conference_dishes FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage dishes" ON public.conference_dishes FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Bestellungen: Gäste dürfen anlegen (anonym), nur Admin lesen
CREATE POLICY "anyone insert order" ON public.conference_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read orders" ON public.conference_orders FOR SELECT USING (has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete orders" ON public.conference_orders FOR DELETE USING (has_role(auth.uid(),'admin'));

CREATE POLICY "anyone insert items" ON public.conference_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read items" ON public.conference_order_items FOR SELECT USING (has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete items" ON public.conference_order_items FOR DELETE USING (has_role(auth.uid(),'admin'));

-- Küchen-View: Aufteilung pro Raum + Tag + Kategorie
CREATE OR REPLACE VIEW public.kitchen_breakdown AS
SELECT
  o.service_date,
  r.id AS room_id,
  r.name AS room_name,
  d.category,
  d.meal_type,
  d.title AS dish_title,
  d.id AS dish_id,
  SUM(oi.quantity)::int AS total_count
FROM public.conference_order_items oi
JOIN public.conference_orders o ON o.id = oi.order_id
JOIN public.conference_rooms r ON r.id = o.room_id
JOIN public.conference_dishes d ON d.id = oi.dish_id
GROUP BY o.service_date, r.id, r.name, d.category, d.meal_type, d.title, d.id;
