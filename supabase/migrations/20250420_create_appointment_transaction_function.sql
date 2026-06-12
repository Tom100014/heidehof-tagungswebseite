
-- Add request_id column to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS request_id TEXT;
CREATE INDEX IF NOT EXISTS idx_appointments_request_id ON public.appointments(request_id);

-- Create function to handle appointments with transaction safety
CREATE OR REPLACE FUNCTION public.create_appointment_with_transaction(
  p_name TEXT,
  p_room_number TEXT,
  p_appointment_date DATE,
  p_time_preference TEXT,
  p_contact_method TEXT,
  p_contact_value TEXT,
  p_notes TEXT,
  p_treatment_id TEXT,
  p_treatment_name TEXT,
  p_request_id TEXT,
  p_guest_type TEXT DEFAULT 'room_guest'
) RETURNS SETOF appointments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment appointments;
  v_time_slot_available BOOLEAN;
BEGIN
  -- Check if appointment already exists with this request ID
  IF p_request_id IS NOT NULL THEN
    SELECT * INTO v_appointment FROM appointments WHERE request_id = p_request_id LIMIT 1;
    IF FOUND THEN
      RETURN NEXT v_appointment;
      RETURN;
    END IF;
  END IF;

  -- Check if timeslot is available
  SELECT COUNT(*) = 0 INTO v_time_slot_available
  FROM appointments
  WHERE 
    appointment_date = p_appointment_date AND 
    time_preference = p_time_preference AND
    status NOT IN ('cancelled', 'rejected');
    
  IF NOT v_time_slot_available THEN
    RAISE EXCEPTION 'Der gewünschte Termin ist bereits vergeben';
  END IF;

  -- Insert appointment within transaction
  INSERT INTO appointments(
    name, room_number, appointment_date, time_preference, contact_method,
    contact_value, notes, treatment_id, treatment_name, status, request_id, guest_type
  )
  VALUES(
    p_name, p_room_number, p_appointment_date, p_time_preference,
    p_contact_method, p_contact_value, p_notes, p_treatment_id, p_treatment_name,
    'pending', p_request_id, p_guest_type
  )
  RETURNING * INTO v_appointment;
  
  RETURN NEXT v_appointment;
  RETURN;
END;
$$;
