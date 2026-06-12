DO $$ BEGIN
  CREATE TYPE inquiry_status AS ENUM ('neu','in_bearbeitung','angebot_gesendet','gewonnen','abgesagt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tagungs_inquiries
  ADD COLUMN IF NOT EXISTS status inquiry_status NOT NULL DEFAULT 'neu',
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS guest_notified_at timestamptz;
