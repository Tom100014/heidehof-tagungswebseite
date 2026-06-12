-- Erstelle Tabelle für Web Push Subscriptions
CREATE TABLE public.web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Benutzer können ihre eigenen Subscriptions verwalten
CREATE POLICY "Users can manage their own push subscriptions"
ON public.web_push_subscriptions
FOR ALL
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Admins können alle Subscriptions einsehen
CREATE POLICY "Admins can view all push subscriptions"
ON public.web_push_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Services können Subscriptions erstellen/updaten
CREATE POLICY "Services can manage push subscriptions"
ON public.web_push_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger für updated_at
CREATE TRIGGER update_web_push_subscriptions_updated_at
  BEFORE UPDATE ON public.web_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index für bessere Performance
CREATE INDEX idx_web_push_subscriptions_user_id ON public.web_push_subscriptions(user_id);
CREATE INDEX idx_web_push_subscriptions_endpoint ON public.web_push_subscriptions(endpoint);
CREATE INDEX idx_web_push_subscriptions_active ON public.web_push_subscriptions(is_active) WHERE is_active = true;