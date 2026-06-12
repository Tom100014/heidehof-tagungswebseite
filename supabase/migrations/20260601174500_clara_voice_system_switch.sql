INSERT INTO public.app_settings (key, value, updated_at) VALUES
  ('clara_voice_system', '"cartesia_pipeline"'::jsonb, now()),
  ('clara_realtime_model', '"gpt-realtime"'::jsonb, now()),
  ('clara_realtime_voice', '"marin"'::jsonb, now())
ON CONFLICT (key) DO NOTHING;
