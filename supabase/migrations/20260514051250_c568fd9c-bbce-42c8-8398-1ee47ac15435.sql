INSERT INTO public.app_settings (key, value, updated_at)
VALUES ('clara_voice_widget_provider', '"cartesia"'::jsonb, now())
ON CONFLICT (key) DO NOTHING;