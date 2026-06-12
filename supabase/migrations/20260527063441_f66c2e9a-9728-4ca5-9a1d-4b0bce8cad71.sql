ALTER TABLE public.prompt_layouts
  ADD COLUMN IF NOT EXISTS reference_roles jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.prompt_layouts.reference_roles IS
  'Map of reference_image_id -> { role: background|plates|cutlery|glassware|lighting|style|decoration|subject, notes: string }';
