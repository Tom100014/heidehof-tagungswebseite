-- Fix RLS policies for general_service_config table only

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.general_service_config;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.general_service_config;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.general_service_config;

-- Create proper RLS policies for general_service_config
CREATE POLICY "Enable read access for all users" 
ON public.general_service_config 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for all users" 
ON public.general_service_config 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for all users" 
ON public.general_service_config 
FOR UPDATE 
USING (true);