-- Update existing 'cinema' snapshots to 'kino' to match frontend
UPDATE public.ingolstadt_live_snapshots 
SET category = 'kino' 
WHERE category = 'cinema';

-- Clean up old snapshots from September 8th to force new generation
DELETE FROM public.ingolstadt_live_snapshots 
WHERE generated_at < CURRENT_DATE;