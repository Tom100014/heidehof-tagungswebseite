-- Add phone_number column to appointments table to store customer phone numbers
ALTER TABLE public.appointments 
ADD COLUMN phone_number TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.appointments.phone_number IS 'Customer phone number for SMS/WhatsApp communication';