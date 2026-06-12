-- Fix admin_profiles RLS policies to allow easier development access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view own profile" ON public.admin_profiles;

-- Create more permissive policies for development
CREATE POLICY "Allow authenticated users to read admin_profiles" 
ON public.admin_profiles FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert admin_profiles" 
ON public.admin_profiles FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update admin_profiles" 
ON public.admin_profiles FOR UPDATE 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure we have at least one admin profile for development
INSERT INTO public.admin_profiles (user_id, email, role, is_active)
SELECT 
  id, 
  email, 
  'super_admin'::admin_role, 
  true
FROM auth.users 
WHERE id IS NOT NULL
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super_admin'::admin_role,
  is_active = true;