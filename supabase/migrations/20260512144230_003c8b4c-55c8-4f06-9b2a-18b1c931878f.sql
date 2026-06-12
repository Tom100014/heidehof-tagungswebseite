DO $$ BEGIN
  CREATE TYPE public.conference_order_status AS ENUM ('new','confirmed','in_kitchen','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.conference_orders
  ADD COLUMN IF NOT EXISTS status public.conference_order_status NOT NULL DEFAULT 'new';

CREATE INDEX IF NOT EXISTS idx_conference_orders_status ON public.conference_orders(status);
CREATE INDEX IF NOT EXISTS idx_conference_orders_service_date ON public.conference_orders(service_date);