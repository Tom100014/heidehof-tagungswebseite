
-- Komplette Admin-System Reparatur - Schritt für Schritt

-- 1. Erstelle Admin-Rollen-Typ (falls nicht vorhanden)
DO $$ BEGIN
  CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin', 'moderator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Erstelle Admin-Profile Tabelle
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE, -- Entferne FK Constraint für jetzt
  email TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Aktiviere RLS für Admin-Profile
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Erstelle die Admin-Funktionen
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS admin_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.admin_profiles 
  WHERE user_id = user_uuid 
  AND is_active = true
  LIMIT 1;
$$;

-- 5. Erstelle Policies für Admin-Profile
CREATE POLICY "Admins can view own profile"
ON public.admin_profiles FOR SELECT
USING (user_id = auth.uid());

-- 6. Teste die Admin-Funktionen mit einem temporären Eintrag
-- Füge einen Test-Admin hinzu (wird später durch echten Admin ersetzt)
INSERT INTO public.admin_profiles (user_id, email, role, is_active)
VALUES (
  gen_random_uuid(), -- Temporäre UUID
  'test@admin.com',
  'super_admin',
  true
) ON CONFLICT (user_id) DO NOTHING;
