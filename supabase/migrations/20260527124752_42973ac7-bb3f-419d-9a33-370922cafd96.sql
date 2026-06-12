ALTER TABLE public.wellness_sections
  ADD COLUMN IF NOT EXISTS eyebrow text NOT NULL DEFAULT 'Erlebniswelt',
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;