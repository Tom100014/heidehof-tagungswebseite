-- Fix RLS policies for generated_menu_cards table
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own menu cards" ON public.generated_menu_cards;
DROP POLICY IF EXISTS "Users can create their own menu cards" ON public.generated_menu_cards;
DROP POLICY IF EXISTS "Users can update their own menu cards" ON public.generated_menu_cards;
DROP POLICY IF EXISTS "Users can delete their own menu cards" ON public.generated_menu_cards;

-- Create proper RLS policies that don't reference auth.users directly
CREATE POLICY "Allow public insert to generated_menu_cards" 
ON public.generated_menu_cards 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select from generated_menu_cards" 
ON public.generated_menu_cards 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage generated_menu_cards" 
ON public.generated_menu_cards 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = true
  )
);