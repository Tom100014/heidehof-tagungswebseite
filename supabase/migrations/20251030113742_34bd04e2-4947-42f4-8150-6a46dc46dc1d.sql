-- ============================================
-- CUSTOMER INTELLIGENCE DASHBOARD: Vollständige Integration
-- ============================================

-- Phase 1: Function für automatische Customer Profile Synchronisation
CREATE OR REPLACE FUNCTION sync_customer_profile_from_order()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_name TEXT;
  v_room_number TEXT;
  v_phone_number TEXT;
  v_order_amount NUMERIC;
  v_order_source TEXT;
BEGIN
  -- Extract customer data from different table structures
  IF TG_TABLE_NAME = 'restaurant_orders' THEN
    v_customer_name := NEW.customer_name;
    v_room_number := NEW.room_number;
    v_phone_number := NEW.contact_value;
    v_order_amount := COALESCE(NEW.total_amount, 0);
    v_order_source := 'room_service';
  ELSIF TG_TABLE_NAME = 'bar_max_orders' THEN
    v_customer_name := NEW.customer_name;
    v_room_number := NEW.room_number;
    v_phone_number := NEW.contact_value;
    v_order_amount := COALESCE(NEW.total_amount, 0);
    v_order_source := 'bar_max';
  ELSIF TG_TABLE_NAME = 'shop_orders' THEN
    v_customer_name := NEW.customer_name;
    v_room_number := NEW.room_number;
    v_phone_number := NEW.contact_info;
    v_order_amount := COALESCE(NEW.total_amount, 0);
    v_order_source := 'shop';
  ELSIF TG_TABLE_NAME = 'beauty_appointments' THEN
    v_customer_name := NEW.full_name;
    v_room_number := NEW.room_number;
    v_phone_number := NEW.phone_number;
    v_order_amount := 0;
    v_order_source := 'beauty';
  END IF;

  -- Skip if customer name is empty
  IF v_customer_name IS NULL OR v_customer_name = '' THEN
    RETURN NEW;
  END IF;

  -- Create or update customer profile
  INSERT INTO customer_profiles (
    full_name,
    room_number,
    phone_number,
    total_orders,
    total_spent,
    avg_order_value,
    last_order_date,
    favorite_services,
    customer_category,
    intelligence_score
  )
  VALUES (
    v_customer_name,
    v_room_number,
    v_phone_number,
    1,
    v_order_amount,
    v_order_amount,
    NOW(),
    ARRAY[v_order_source],
    'new',
    10
  )
  ON CONFLICT (full_name) DO UPDATE SET
    room_number = COALESCE(EXCLUDED.room_number, customer_profiles.room_number),
    phone_number = COALESCE(EXCLUDED.phone_number, customer_profiles.phone_number),
    total_orders = customer_profiles.total_orders + 1,
    total_spent = customer_profiles.total_spent + v_order_amount,
    avg_order_value = (customer_profiles.total_spent + v_order_amount) / (customer_profiles.total_orders + 1),
    last_order_date = NOW(),
    favorite_services = CASE 
      WHEN v_order_source = ANY(customer_profiles.favorite_services) THEN customer_profiles.favorite_services
      ELSE array_append(customer_profiles.favorite_services, v_order_source)
    END,
    intelligence_score = LEAST(100, 
      ((customer_profiles.total_orders + 1) * 2) + 
      ((customer_profiles.total_spent + v_order_amount) / 10) + 
      (array_length(CASE 
        WHEN v_order_source = ANY(customer_profiles.favorite_services) THEN customer_profiles.favorite_services
        ELSE array_append(customer_profiles.favorite_services, v_order_source)
      END, 1) * 5)
    )::INTEGER,
    customer_category = CASE 
      WHEN (customer_profiles.total_spent + v_order_amount) > 500 THEN 'vip'
      WHEN (customer_profiles.total_orders + 1) > 10 THEN 'power_user'
      WHEN (customer_profiles.total_orders + 1) <= 2 THEN 'new'
      WHEN (NOW() - customer_profiles.last_order_date) > INTERVAL '30 days' THEN 'risk'
      ELSE 'regular'
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 2: Trigger für alle Order-Tabellen erstellen
DROP TRIGGER IF EXISTS trigger_sync_customer_profile_restaurant ON restaurant_orders;
CREATE TRIGGER trigger_sync_customer_profile_restaurant
AFTER INSERT ON restaurant_orders
FOR EACH ROW
EXECUTE FUNCTION sync_customer_profile_from_order();

DROP TRIGGER IF EXISTS trigger_sync_customer_profile_bar_max ON bar_max_orders;
CREATE TRIGGER trigger_sync_customer_profile_bar_max
AFTER INSERT ON bar_max_orders
FOR EACH ROW
EXECUTE FUNCTION sync_customer_profile_from_order();

DROP TRIGGER IF EXISTS trigger_sync_customer_profile_shop ON shop_orders;
CREATE TRIGGER trigger_sync_customer_profile_shop
AFTER INSERT ON shop_orders
FOR EACH ROW
EXECUTE FUNCTION sync_customer_profile_from_order();

DROP TRIGGER IF EXISTS trigger_sync_customer_profile_beauty ON beauty_appointments;
CREATE TRIGGER trigger_sync_customer_profile_beauty
AFTER INSERT ON beauty_appointments
FOR EACH ROW
EXECUTE FUNCTION sync_customer_profile_from_order();

-- Phase 3: Batch-Import aller bestehenden Bestellungen
INSERT INTO customer_profiles (
  full_name,
  room_number,
  phone_number,
  total_orders,
  total_spent,
  avg_order_value,
  last_order_date,
  favorite_services,
  customer_category,
  intelligence_score
)
SELECT 
  customer_name as full_name,
  MAX(room_number) as room_number,
  MAX(contact_info) as phone_number,
  COUNT(*) as total_orders,
  COALESCE(SUM(total_amount), 0) as total_spent,
  COALESCE(AVG(total_amount), 0) as avg_order_value,
  MAX(created_at) as last_order_date,
  array_agg(DISTINCT order_source) as favorite_services,
  CASE 
    WHEN COALESCE(SUM(total_amount), 0) > 500 THEN 'vip'
    WHEN COUNT(*) > 10 THEN 'power_user'
    WHEN COUNT(*) <= 2 THEN 'new'
    ELSE 'regular'
  END as customer_category,
  LEAST(100, 
    (COUNT(*) * 2) + 
    (COALESCE(SUM(total_amount), 0) / 10) + 
    (COUNT(DISTINCT order_source) * 5)
  )::INTEGER as intelligence_score
FROM customer_unified_orders
WHERE customer_name IS NOT NULL AND customer_name != ''
GROUP BY customer_name
ON CONFLICT (full_name) DO NOTHING;

-- Phase 4: RLS Policies korrigieren
DROP POLICY IF EXISTS "Allow admin access to customer_profiles" ON customer_profiles;

CREATE POLICY "Admins can view customer_profiles"
ON customer_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
  )
);

CREATE POLICY "Admins can manage customer_profiles"
ON customer_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
  )
);