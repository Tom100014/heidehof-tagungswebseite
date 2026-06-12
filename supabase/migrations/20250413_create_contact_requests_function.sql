
-- Function to create the contact_requests table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_contact_requests_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the contact_requests table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'contact_requests'
  ) THEN
    -- Create the contact_requests table
    CREATE TABLE public.contact_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      contact_type TEXT NOT NULL CHECK (contact_type IN ('email', 'whatsapp')),
      contact_value TEXT NOT NULL,
      service_context TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow users to view their own contact requests
    CREATE POLICY "Users can view their own contact requests"
      ON public.contact_requests FOR SELECT
      USING (user_id = auth.uid() OR user_id IS NULL);

    -- Create policy to allow admin to view all contact requests
    CREATE POLICY "Admins can view all contact requests" 
      ON public.contact_requests FOR ALL 
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END;
$$;
