
ALTER TABLE public.conference_menus
  ADD COLUMN IF NOT EXISTS allergens jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.daily_menu_assets
  ADD COLUMN IF NOT EXISTS layout_template text;
