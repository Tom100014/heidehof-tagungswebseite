-- CRITICAL FIX: Drop ALL existing policies and create simple working ones

-- Drop all existing policies completely
DROP POLICY IF EXISTS "Allow public insert to conference_orders" ON conference_orders;
DROP POLICY IF EXISTS "Allow admins to select conference_orders" ON conference_orders;
DROP POLICY IF EXISTS "Allow admins to update conference_orders" ON conference_orders;
DROP POLICY IF EXISTS "Allow admins to delete conference_orders" ON conference_orders;

-- Disable RLS temporarily to ensure clean slate
ALTER TABLE conference_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_orders ENABLE ROW LEVEL SECURITY;

-- Create PERMISSIVE policy for PUBLIC inserts (CRITICAL for anonymous users)
CREATE POLICY "public_insert_conference_orders"
ON conference_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow admins full access
CREATE POLICY "admin_all_conference_orders"
ON conference_orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
  )
);

-- Grant necessary permissions to anon role
GRANT INSERT ON conference_orders TO anon;
GRANT SELECT, UPDATE, DELETE ON conference_orders TO authenticated;