-- Create web_push_subscriptions table if not exists
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create RLS policies
CREATE POLICY "Users can view their own push subscriptions"
ON public.web_push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
ON public.web_push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
ON public.web_push_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
ON public.web_push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Admin can view all push subscriptions
CREATE POLICY "Admins can view all push subscriptions"
ON public.web_push_subscriptions
FOR ALL
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_web_push_subscriptions_updated_at
    BEFORE UPDATE ON public.web_push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();