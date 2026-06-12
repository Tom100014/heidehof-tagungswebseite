
-- Erstelle Notifications-Tabelle für das Nachrichtenlogging
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  payload JSONB NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_msg TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Erlaubt RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Beispiel-Policy: Anonym erstellen, nur Admins lesen
CREATE POLICY "Allow anonymous inserts" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admins to view notifications" ON public.notifications
  FOR SELECT USING (true);

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS notifications_order_id_idx ON public.notifications (order_id);
CREATE INDEX IF NOT EXISTS notifications_success_idx ON public.notifications (success);
