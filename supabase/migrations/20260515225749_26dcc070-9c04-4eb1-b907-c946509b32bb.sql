
CREATE POLICY "admins delete tagungs_inquiries" ON public.tagungs_inquiries
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete conference_orders" ON public.conference_orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.category_email_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL UNIQUE,
  label text NOT NULL,
  emails text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.category_email_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage routes" ON public.category_email_routes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.category_email_routes (category_key, label) VALUES
  ('tagung', 'Tagungsanfragen'),
  ('tagung_menu', 'Tagungs-Menü Bestellungen'),
  ('fine_dining', 'Fine Dining (Maxwell)'),
  ('bar_max', 'Bar Mäx'),
  ('reservation', 'Tischreservierungen'),
  ('shop', 'Shop-Bestellungen'),
  ('room_service', 'Zimmer-Service'),
  ('beauty', 'Beauty & Wellness'),
  ('complaint', 'Beschwerden'),
  ('missing_item', 'Fehlende Artikel'),
  ('room_issue', 'Zimmer-Probleme'),
  ('clara', 'Clara Gespräche')
ON CONFLICT (category_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.forward_request_to_route()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_category text;
  v_table text := TG_TABLE_NAME;
BEGIN
  IF v_table = 'tagungs_inquiries' THEN v_category := 'tagung';
  ELSIF v_table = 'conference_orders' THEN v_category := 'tagung_menu';
  ELSIF v_table = 'room_orders' THEN v_category := 'room_service';
  ELSIF v_table = 'clara_conversations' THEN v_category := 'clara';
  ELSIF v_table = 'restaurant_orders' THEN v_category := COALESCE(NEW.category::text, 'fine_dining');
  ELSIF v_table = 'complaints' THEN v_category := COALESCE(NEW.category::text, 'complaint');
  ELSE RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/forward-category-request',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('category_key', v_category, 'source_table', v_table, 'record_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;

CREATE TRIGGER trg_forward_tagungs_inquiries AFTER INSERT ON public.tagungs_inquiries FOR EACH ROW EXECUTE FUNCTION public.forward_request_to_route();
CREATE TRIGGER trg_forward_conference_orders AFTER INSERT ON public.conference_orders FOR EACH ROW EXECUTE FUNCTION public.forward_request_to_route();
CREATE TRIGGER trg_forward_room_orders AFTER INSERT ON public.room_orders FOR EACH ROW EXECUTE FUNCTION public.forward_request_to_route();
CREATE TRIGGER trg_forward_restaurant_orders AFTER INSERT ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.forward_request_to_route();
CREATE TRIGGER trg_forward_complaints AFTER INSERT ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.forward_request_to_route();

CREATE TRIGGER trg_routes_updated_at BEFORE UPDATE ON public.category_email_routes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
