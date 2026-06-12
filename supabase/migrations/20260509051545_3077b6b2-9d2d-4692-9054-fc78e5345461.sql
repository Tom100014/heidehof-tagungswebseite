
-- Setup table for the 6 seating variants
CREATE TABLE public.room_setups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  capacity_range TEXT,
  ideal_for TEXT,
  image_url TEXT,
  storage_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.room_setups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read room setups" ON public.room_setups FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage room setups" ON public.room_setups FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_room_setups_updated BEFORE UPDATE ON public.room_setups
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- Seed 6 standard setups
INSERT INTO public.room_setups (slug, title, description, capacity_range, ideal_for, sort_order) VALUES
  ('u-form', 'U-Form', 'Hufeisenförmige Anordnung mit offener Front – ideal für interaktive Trainings, Diskussionen und Präsentationen mit direkter Blickachse zum Vortragenden.', '12 – 30 Personen', 'Workshops, Trainings, Round-Tables', 1),
  ('parlament', 'Parlament', 'Klassische Reihenbestuhlung mit Tischen – jeder Teilnehmer hat Schreibfläche und freie Sicht nach vorn.', '20 – 70 Personen', 'Seminare, Konferenzen, Schulungen', 2),
  ('block', 'Block', 'Geschlossener Tischblock – fokussierte Arbeitsatmosphäre für strategische Meetings und Entscheidungsrunden.', '8 – 24 Personen', 'Vorstandsmeetings, Strategie-Klausuren', 3),
  ('stuhlkreis', 'Stuhlkreis', 'Offener Kreis ohne Tische – für moderierte Gespräche, Coachings und Teambuilding-Formate.', '6 – 25 Personen', 'Coaching, Moderationen, Retrospektiven', 4),
  ('kino', 'Kino', 'Reihenbestuhlung ohne Tische – maximale Personenzahl bei Vortragsformaten und Produktpräsentationen.', '30 – 120 Personen', 'Keynotes, Präsentationen, Vorträge', 5),
  ('bankett', 'Bankett', 'Runde Tische à 8–10 Personen – gesellige Atmosphäre für Gala-Abende, Festlichkeiten und Firmenfeiern.', '40 – 150 Personen', 'Galadinner, Hochzeiten, Festabende', 6);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('setup-images', 'setup-images', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('clara-uploads', 'clara-uploads', false)
  ON CONFLICT (id) DO NOTHING;

-- Setup-images bucket policies (public read, admin write)
CREATE POLICY "public read setup images" ON storage.objects FOR SELECT USING (bucket_id = 'setup-images');
CREATE POLICY "admins manage setup images" ON storage.objects FOR ALL
  USING (bucket_id = 'setup-images' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'setup-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Clara-uploads bucket policies (anyone can upload, anyone can read own via signed URL through edge function)
CREATE POLICY "anyone upload clara files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clara-uploads');
CREATE POLICY "anyone read own clara files" ON storage.objects FOR SELECT
  USING (bucket_id = 'clara-uploads');
