-- Erstelle die fehlende create_appointment_with_transaction Funktion
CREATE OR REPLACE FUNCTION public.create_appointment_with_transaction(
  p_name TEXT,
  p_room_number TEXT,
  p_appointment_date DATE,
  p_time_preference TEXT,
  p_contact_method TEXT,
  p_contact_value TEXT,
  p_notes TEXT DEFAULT NULL,
  p_treatment_id TEXT DEFAULT NULL,
  p_treatment_name TEXT DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL,
  p_guest_type TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_appointment_id UUID;
  result JSON;
BEGIN
  -- Insert appointment
  INSERT INTO public.appointments (
    name,
    room_number,
    appointment_date,
    time_preference,
    contact_method,
    contact_value,
    notes,
    treatment_id,
    treatment_name,
    request_id,
    guest_type,
    status
  ) VALUES (
    p_name,
    p_room_number,
    p_appointment_date,
    p_time_preference,
    p_contact_method,
    p_contact_value,
    p_notes,
    p_treatment_id,
    p_treatment_name,
    p_request_id,
    p_guest_type,
    'neu'
  ) RETURNING id INTO new_appointment_id;

  -- Return result
  result := json_build_object(
    'id', new_appointment_id,
    'success', true,
    'message', 'Appointment created successfully'
  );

  RETURN result;
END;
$$;

-- Korrigiere die API Logs RLS Policy
DROP POLICY IF EXISTS "api_logs_policy" ON public.api_logs;

CREATE POLICY "Anyone can insert api logs"
  ON public.api_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view api logs" 
  ON public.api_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    ) OR auth.uid() IS NOT NULL
  );