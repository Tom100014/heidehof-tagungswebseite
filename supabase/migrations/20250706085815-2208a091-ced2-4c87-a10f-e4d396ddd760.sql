-- Clean up and fix admin_profiles RLS policies
-- Drop ALL existing policies on admin_profiles
DROP POLICY IF EXISTS "Admins can view own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read admin_profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert admin_profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update admin_profiles" ON public.admin_profiles;

-- Create new permissive policies for development
CREATE POLICY "dev_read_admin_profiles" 
ON public.admin_profiles FOR SELECT 
USING (true);

CREATE POLICY "dev_insert_admin_profiles" 
ON public.admin_profiles FOR INSERT 
WITH CHECK (true);

CREATE POLICY "dev_update_admin_profiles" 
ON public.admin_profiles FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Create admin profile for any authenticated user for development
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    INSERT INTO public.admin_profiles (user_id, email, role, is_active)
    SELECT 
      id, 
      COALESCE(email, 'admin@heidehof.com'), 
      'super_admin'::admin_role, 
      true
    FROM auth.users 
    LIMIT 1
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'super_admin'::admin_role,
      is_active = true;
  END IF;
END $$;