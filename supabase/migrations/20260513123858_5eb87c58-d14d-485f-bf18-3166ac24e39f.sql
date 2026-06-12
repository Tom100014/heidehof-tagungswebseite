INSERT INTO public.app_settings (key, value, updated_at) VALUES
  ('clara_tts_provider', '"cartesia"'::jsonb, now()),
  ('clara_cartesia_voice_id', '"b9de4a89-2257-424b-94c2-db18ba68c81a"'::jsonb, now()),
  ('clara_cartesia_model', '"sonic-2"'::jsonb, now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();