-- Create web_push_subscriptions table if not exists
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(endpoint)
);

-- Enable RLS
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies für öffentlichen Zugriff (da Admin-Benachrichtigungen)
CREATE POLICY "Anyone can insert push subscriptions"
ON public.web_push_subscriptions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view push subscriptions"
ON public.web_push_subscriptions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update push subscriptions"
ON public.web_push_subscriptions
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete push subscriptions"
ON public.web_push_subscriptions
FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_web_push_subscriptions_updated_at
    BEFORE UPDATE ON public.web_push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();