-- Erstelle Tabelle für tägliche Küchenberichte
CREATE TABLE IF NOT EXISTS public.kitchen_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL UNIQUE,
  menu_data JSONB NOT NULL DEFAULT '{}',
  orders_data JSONB NOT NULL DEFAULT '{}',
  statistics JSONB NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  csv_url TEXT,
  total_orders INTEGER DEFAULT 0,
  total_guests INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kitchen_daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage kitchen daily reports"
  ON public.kitchen_daily_reports FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view kitchen daily reports"
  ON public.kitchen_daily_reports FOR SELECT
  USING (true);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION public.update_kitchen_daily_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kitchen_daily_reports_updated_at
  BEFORE UPDATE ON public.kitchen_daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kitchen_daily_reports_updated_at();

-- Index für bessere Performance
CREATE INDEX idx_kitchen_daily_reports_date ON public.kitchen_daily_reports(report_date DESC);

-- Tabelle für Cron Job Status
CREATE TABLE IF NOT EXISTS public.kitchen_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- 'daily_archive' oder 'menu_activation'
  execution_date DATE NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'error', 'running'
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS für Automation Logs
ALTER TABLE public.kitchen_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage kitchen automation logs"
  ON public.kitchen_automation_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());