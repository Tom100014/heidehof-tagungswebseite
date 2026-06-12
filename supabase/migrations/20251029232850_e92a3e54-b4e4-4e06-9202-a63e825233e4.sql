-- =====================================================
-- Event Pop-up System für Hotel der Heidehof
-- =====================================================

-- Event-Typ ENUM
CREATE TYPE event_type AS ENUM (
  'daily_menu',           -- Tagesmenü
  'le_petit_chef',        -- Le Petit Chef (Kinder-Koch)
  'shop_highlight',       -- Shop Produkt des Tages
  'spa_month',            -- Spa des Monats
  'wellness_escape',      -- Wellness Escape Paket
  'romantic_weekend',     -- Romantik Wochenende
  'business_lunch',       -- Business Lunch Express
  'afternoon_tea',        -- Afternoon Tea Luxus
  'seasonal_special',     -- Saisonales Special
  'happy_hour'            -- Happy Hour Bar-Special
);

-- =====================================================
-- Tabelle: popup_events
-- =====================================================
CREATE TABLE public.popup_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  image_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Styling & Layout
  background_image TEXT,
  theme_color TEXT DEFAULT '#D4AF37',
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_duration CHECK (end_date <= start_date + INTERVAL '180 days')
);

-- Index für Performance
CREATE INDEX idx_popup_events_active ON public.popup_events(is_active, start_date, end_date);
CREATE INDEX idx_popup_events_type ON public.popup_events(event_type);

-- =====================================================
-- Tabelle: popup_event_products
-- =====================================================
CREATE TABLE public.popup_event_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.popup_events(id) ON DELETE CASCADE,
  
  -- Produkt-Info
  product_type TEXT NOT NULL CHECK (product_type IN ('restaurant', 'shop', 'beauty', 'custom')),
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_price TEXT,
  product_image TEXT,
  
  -- Anzeige
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index für Sortierung
CREATE INDEX idx_popup_event_products_order ON public.popup_event_products(event_id, display_order);

-- =====================================================
-- Tabelle: popup_event_views (Tracking)
-- =====================================================
CREATE TABLE public.popup_event_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.popup_events(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- User Agent Info
  user_agent TEXT,
  ip_address TEXT,
  
  -- Actions
  clicked_through BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false
);

-- Index für Session-Check
CREATE INDEX idx_popup_event_views_session ON public.popup_event_views(session_id, event_id);
CREATE INDEX idx_popup_event_views_date ON public.popup_event_views(viewed_at);

-- =====================================================
-- RLS Policies
-- =====================================================

-- popup_events
ALTER TABLE public.popup_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann aktive Events sehen"
  ON public.popup_events FOR SELECT
  USING (
    is_active = true 
    AND start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE
  );

CREATE POLICY "Admins können alle Events verwalten"
  ON public.popup_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- popup_event_products
ALTER TABLE public.popup_event_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Produkte von aktiven Events sehen"
  ON public.popup_event_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.popup_events
      WHERE id = event_id
        AND is_active = true
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
    )
  );

CREATE POLICY "Admins können alle Event-Produkte verwalten"
  ON public.popup_event_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- popup_event_views
ALTER TABLE public.popup_event_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Event-Views erstellen"
  ON public.popup_event_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins können alle Views sehen"
  ON public.popup_event_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- =====================================================
-- Funktionen
-- =====================================================

-- Update Timestamp Trigger
CREATE TRIGGER update_popup_events_updated_at
  BEFORE UPDATE ON public.popup_events
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

-- Funktion: Aktives Event für Gast holen
CREATE OR REPLACE FUNCTION public.get_active_popup_event(p_session_id TEXT)
RETURNS TABLE(
  event_id UUID,
  title TEXT,
  description TEXT,
  event_type event_type,
  image_url TEXT,
  background_image TEXT,
  theme_color TEXT,
  products JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as event_id,
    e.title,
    e.description,
    e.event_type,
    e.image_url,
    e.background_image,
    e.theme_color,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'name', p.product_name,
            'description', p.product_description,
            'price', p.product_price,
            'image', p.product_image,
            'type', p.product_type
          ) ORDER BY p.display_order
        )
        FROM popup_event_products p
        WHERE p.event_id = e.id
      ),
      '[]'::jsonb
    ) as products
  FROM popup_events e
  WHERE 
    e.is_active = true
    AND e.start_date <= CURRENT_DATE
    AND e.end_date >= CURRENT_DATE
    -- Nur zeigen wenn noch nicht gesehen in dieser Session
    AND NOT EXISTS (
      SELECT 1 FROM popup_event_views v
      WHERE v.event_id = e.id 
        AND v.session_id = p_session_id
    )
  ORDER BY e.created_at DESC
  LIMIT 1;
END;
$$;

-- Funktion: Event als gesehen markieren
CREATE OR REPLACE FUNCTION public.mark_popup_event_viewed(
  p_event_id UUID,
  p_session_id TEXT,
  p_clicked BOOLEAN DEFAULT false,
  p_dismissed BOOLEAN DEFAULT false,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_view_id UUID;
BEGIN
  INSERT INTO popup_event_views (
    event_id,
    session_id,
    clicked_through,
    dismissed,
    user_agent,
    ip_address
  ) VALUES (
    p_event_id,
    p_session_id,
    p_clicked,
    p_dismissed,
    p_user_agent,
    p_ip_address
  )
  RETURNING id INTO v_view_id;
  
  RETURN v_view_id;
END;
$$;

-- Funktion: Event-Statistiken für Admin
CREATE OR REPLACE FUNCTION public.get_popup_event_stats(p_event_id UUID)
RETURNS TABLE(
  total_views BIGINT,
  total_clicks BIGINT,
  total_dismissals BIGINT,
  click_through_rate NUMERIC,
  views_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_views,
    COUNT(*) FILTER (WHERE clicked_through = true) as total_clicks,
    COUNT(*) FILTER (WHERE dismissed = true) as total_dismissals,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE clicked_through = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as click_through_rate,
    COUNT(*) FILTER (WHERE viewed_at::DATE = CURRENT_DATE) as views_today
  FROM popup_event_views
  WHERE event_id = p_event_id;
END;
$$;