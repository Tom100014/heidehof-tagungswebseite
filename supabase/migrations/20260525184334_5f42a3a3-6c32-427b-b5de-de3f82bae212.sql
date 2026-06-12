
CREATE TABLE IF NOT EXISTS public.clara_anfrage_config (
  id text PRIMARY KEY DEFAULT 'main',
  headline_line1 text NOT NULL DEFAULT 'Tagungsanfrage',
  headline_line2 text NOT NULL DEFAULT 'in 60 Sekunden.',
  subtitle text NOT NULL DEFAULT 'Clara kennt jeden Raum, jede Pauschale und jeden Termin – rund um die Uhr. Sprechen oder schreiben Sie einfach los.',
  eyebrow text NOT NULL DEFAULT 'KI-Bankett-Beraterin · Live',
  greeting text NOT NULL DEFAULT 'Guten Tag, ich bin Clara vom Hotel Der Heidehof. Was planen Sie für Ihre Tagung?',
  badges jsonb NOT NULL DEFAULT '[
    {"icon":"Zap","label":"Antwort in 24 h","sub":"Das Bankett-Team meldet sich persönlich"},
    {"icon":"Star","label":"4,9 / 5 Bewertung","sub":"Über 500 verifizierte Tagungsgäste"},
    {"icon":"Users","label":"bis 435 Personen","sub":"8 Räume · flexibel kombinierbar"},
    {"icon":"Shield","label":"DSGVO-konform","sub":"Ihre Daten sind bei uns sicher"}
  ]'::jsonb,
  steps jsonb NOT NULL DEFAULT '[
    {"n":"01","label":"Hallo sagen","sub":"Clara stellt gezielt die richtigen Fragen."},
    {"n":"02","label":"Räume & Pauschalen","sub":"Maßgeschneiderte Empfehlung in Echtzeit."},
    {"n":"03","label":"Anfrage absenden","sub":"Direkt ans Bankett-Team – ohne Umweg."}
  ]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.clara_anfrage_config (id) VALUES ('main')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.clara_anfrage_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read clara_anfrage_config"
  ON public.clara_anfrage_config FOR SELECT
  USING (true);

CREATE POLICY "admins manage clara_anfrage_config"
  ON public.clara_anfrage_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_clara_anfrage_config_touch
  BEFORE UPDATE ON public.clara_anfrage_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
