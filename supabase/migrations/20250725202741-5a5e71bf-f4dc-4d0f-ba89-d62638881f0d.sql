-- Prüfe aktuelle RLS Policies für restaurant_bar_orders
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'restaurant_bar_orders';

-- Korrigiere die RLS Policies für restaurant_bar_orders
-- Lösche alte Policies
DROP POLICY IF EXISTS "Admins can view all restaurant bar orders" ON restaurant_bar_orders;
DROP POLICY IF EXISTS "Admins can update restaurant bar orders" ON restaurant_bar_orders;
DROP POLICY IF EXISTS "Admins can delete restaurant bar orders" ON restaurant_bar_orders;

-- Erstelle neue, korrekte Admin-Policies
CREATE POLICY "Admins can view all restaurant bar orders" 
ON restaurant_bar_orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = true
  ) OR auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can update restaurant bar orders" 
ON restaurant_bar_orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can delete restaurant bar orders" 
ON restaurant_bar_orders FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = true
  )
);