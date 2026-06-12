-- Tabelle für Bildgenerierungs-Einstellungen
CREATE TABLE IF NOT EXISTS public.image_generation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE, -- 'gemini', 'lovable', 'pollinations'
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Niedrigere Zahl = höhere Priorität
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.image_generation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Einstellungen lesen"
  ON public.image_generation_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Nur Admins können Einstellungen ändern"
  ON public.image_generation_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Standard-Provider einfügen
INSERT INTO public.image_generation_settings (provider, is_active, priority, display_name, description)
VALUES 
  ('gemini', true, 1, 'Gemini AI (Nano Banana)', 'Google Gemini 2.5 Flash Image Preview - Hochqualitative KI-Bilder'),
  ('lovable', true, 2, 'Lovable AI', 'Lovable AI Gateway für Bildgenerierung'),
  ('pollinations', true, 3, 'Pollinations AI', 'Kostenlose Bildgenerierung mit Flux-Modell')
ON CONFLICT (provider) DO NOTHING;

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_image_generation_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_image_generation_settings_timestamp
  BEFORE UPDATE ON public.image_generation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_image_generation_settings_updated_at();