
INSERT INTO public.app_settings (key, value)
VALUES ('active_assistant', '"clara"'::jsonb)
ON CONFLICT (key) DO NOTHING;
