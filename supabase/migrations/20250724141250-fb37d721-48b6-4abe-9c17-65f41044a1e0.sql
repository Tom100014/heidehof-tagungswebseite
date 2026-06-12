-- Erweitere unified_form_submissions für Shop, Beauty und Bar Max
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_type') THEN
        CREATE TYPE form_type AS ENUM ('restaurant_reservation', 'complaint', 'contact_request');
    END IF;
    
    -- Füge neue Werte hinzu falls sie nicht existieren
    ALTER TYPE form_type ADD VALUE IF NOT EXISTS 'shop_order';
    ALTER TYPE form_type ADD VALUE IF NOT EXISTS 'beauty_appointment'; 
    ALTER TYPE form_type ADD VALUE IF NOT EXISTS 'bar_max_order';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Stelle sicher, dass alle benötigten Spalten existieren
ALTER TABLE unified_form_submissions 
ADD COLUMN IF NOT EXISTS items JSONB,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS appointment_date DATE,
ADD COLUMN IF NOT EXISTS appointment_time TIME,
ADD COLUMN IF NOT EXISTS treatment_name TEXT,
ADD COLUMN IF NOT EXISTS treatment_id TEXT;

-- Erstelle Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_unified_form_submissions_form_type 
ON unified_form_submissions(form_type);

CREATE INDEX IF NOT EXISTS idx_unified_form_submissions_created_at 
ON unified_form_submissions(created_at DESC);

-- Erstelle Service-spezifische Views für einfachere Abfragen
CREATE OR REPLACE VIEW v_shop_orders AS
SELECT 
  id,
  customer_name,
  room_number,
  contact_method,
  contact_value,
  items,
  total_amount,
  submission_data,
  status,
  priority,
  created_at,
  updated_at
FROM unified_form_submissions 
WHERE form_type = 'shop_order';

CREATE OR REPLACE VIEW v_beauty_appointments AS
SELECT 
  id,
  customer_name,
  room_number,
  contact_method,
  contact_value,
  appointment_date,
  appointment_time,
  treatment_name,
  treatment_id,
  submission_data,
  status,
  priority,
  created_at,
  updated_at
FROM unified_form_submissions 
WHERE form_type = 'beauty_appointment';

CREATE OR REPLACE VIEW v_bar_max_orders AS
SELECT 
  id,
  customer_name,
  room_number,
  contact_method,
  contact_value,
  items,
  total_amount,
  submission_data,
  status,
  priority,
  created_at,
  updated_at
FROM unified_form_submissions 
WHERE form_type = 'bar_max_order';

-- RLS Policies für die neuen Form-Typen (Drop falls existierend)
DROP POLICY IF EXISTS "Shop orders viewable by admins" ON unified_form_submissions;
DROP POLICY IF EXISTS "Beauty appointments viewable by admins" ON unified_form_submissions;
DROP POLICY IF EXISTS "Bar Max orders viewable by admins" ON unified_form_submissions;
DROP POLICY IF EXISTS "Anyone can create shop orders" ON unified_form_submissions;
DROP POLICY IF EXISTS "Anyone can create beauty appointments" ON unified_form_submissions;
DROP POLICY IF EXISTS "Anyone can create bar max orders" ON unified_form_submissions;

CREATE POLICY "Shop orders viewable by admins"
  ON unified_form_submissions FOR SELECT
  USING (form_type = 'shop_order' AND (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Beauty appointments viewable by admins"
  ON unified_form_submissions FOR SELECT
  USING (form_type = 'beauty_appointment' AND (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Bar Max orders viewable by admins"
  ON unified_form_submissions FOR SELECT
  USING (form_type = 'bar_max_order' AND (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

-- Insert Policies für Public Access
CREATE POLICY "Anyone can create shop orders"
  ON unified_form_submissions FOR INSERT
  WITH CHECK (form_type = 'shop_order');

CREATE POLICY "Anyone can create beauty appointments"
  ON unified_form_submissions FOR INSERT
  WITH CHECK (form_type = 'beauty_appointment');

CREATE POLICY "Anyone can create bar max orders"
  ON unified_form_submissions FOR INSERT
  WITH CHECK (form_type = 'bar_max_order');