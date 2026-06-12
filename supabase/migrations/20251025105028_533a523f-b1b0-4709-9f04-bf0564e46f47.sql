-- Fix conference_orders RLS policies to allow public inserts and admin access

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admin read/update access for conference_orders" ON conference_orders;
DROP POLICY IF EXISTS "Admins can manage conference orders" ON conference_orders;
DROP POLICY IF EXISTS "Admins can update conference orders" ON conference_orders;
DROP POLICY IF EXISTS "Admins can view all conference orders" ON conference_orders;
DROP POLICY IF EXISTS "Anyone can create conference orders" ON conference_orders;
DROP POLICY IF EXISTS "Public can insert conference orders" ON conference_orders;
DROP POLICY IF EXISTS "Public insert access for conference_orders" ON conference_orders;

-- Create clear, non-conflicting policies

-- 1. Allow anyone (including anonymous users) to insert conference orders
CREATE POLICY "Allow public insert to conference_orders"
ON conference_orders
FOR INSERT
TO public
WITH CHECK (true);

-- 2. Allow admins to view all conference orders
CREATE POLICY "Allow admins to select conference_orders"
ON conference_orders
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
  )
);

-- 3. Allow admins to update conference orders
CREATE POLICY "Allow admins to update conference_orders"
ON conference_orders
FOR UPDATE
TO public
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

-- 4. Allow admins to delete conference orders
CREATE POLICY "Allow admins to delete conference_orders"
ON conference_orders
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
  )
);

-- Verify RLS is enabled
ALTER TABLE conference_orders ENABLE ROW LEVEL SECURITY;