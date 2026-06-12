-- Create room_numbers table for managing room and spa key numbers
CREATE TABLE public.room_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('room', 'spa_key')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.room_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage room numbers" 
ON public.room_numbers 
FOR ALL 
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_room_numbers_updated_at
  BEFORE UPDATE ON public.room_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint for number and type combination
ALTER TABLE public.room_numbers 
ADD CONSTRAINT unique_number_type UNIQUE (number, type);