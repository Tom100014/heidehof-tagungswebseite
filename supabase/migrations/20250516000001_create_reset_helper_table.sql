
-- Erstellt eine leere Hilfstabelle für Reset-Operationen
CREATE TABLE IF NOT EXISTS _reset_helper (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Füge eine Zeile hinzu, damit die Tabelle nicht leer ist
INSERT INTO _reset_helper (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Setze die Berechtigungen für die Tabelle
ALTER TABLE _reset_helper ENABLE ROW LEVEL SECURITY;
CREATE POLICY "_reset_helper_select_policy"
  ON _reset_helper FOR SELECT
  USING (auth.role() = 'authenticated');
