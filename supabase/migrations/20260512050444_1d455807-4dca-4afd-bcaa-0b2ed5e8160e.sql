CREATE POLICY "Public can read clara public settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('elevenlabs_agent_id','elevenlabs_mode','elevenlabs_custom_agent_id','clara_voice_id','clara_tts_model'));