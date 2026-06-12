
DROP POLICY IF EXISTS "Public can read clara public settings" ON public.app_settings;
CREATE POLICY "Public can read clara public settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (key = ANY (ARRAY[
  'elevenlabs_mode'::text,
  'clara_voice_id'::text,
  'clara_tts_model'::text,
  'assistant_mode'::text,
  'active_assistant'::text,
  'elevenlabs_enabled'::text
]));
