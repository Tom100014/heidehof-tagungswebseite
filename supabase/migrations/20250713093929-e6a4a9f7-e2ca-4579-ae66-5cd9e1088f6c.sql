-- Fix RLS policies for contact_requests table to allow proper complaint submissions
-- First, drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Admin read access for contact_requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Admins can delete contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Admins can update contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Admins can view all contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Anyone can create contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Authenticated users can create contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Authenticated users can view own contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can view their own contact requests" ON public.contact_requests;

-- Create new, clear RLS policies
-- Allow anyone to create contact requests (for complaint submissions)
CREATE POLICY "Anyone can create contact requests"
  ON public.contact_requests 
  FOR INSERT 
  WITH CHECK (true);

-- Allow admins to view all contact requests
CREATE POLICY "Admins can view all contact requests"
  ON public.contact_requests 
  FOR SELECT 
  USING (is_admin());

-- Allow admins to update contact requests
CREATE POLICY "Admins can update contact requests"
  ON public.contact_requests 
  FOR UPDATE 
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admins to delete contact requests
CREATE POLICY "Admins can delete contact requests"
  ON public.contact_requests 
  FOR DELETE 
  USING (is_admin());

-- Update the structure to better match complaint requirements
ALTER TABLE public.contact_requests 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'complaint',
ADD COLUMN IF NOT EXISTS complaint_text TEXT,
ADD COLUMN IF NOT EXISTS assigned_staff TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;