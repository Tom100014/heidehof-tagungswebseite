-- Temporäre RLS-Policy für Admin-Nachrichten um alle Nachrichten anzuzeigen
DROP POLICY IF EXISTS "Admins can view all messages" ON admin_messages;
DROP POLICY IF EXISTS "Service role can insert messages" ON admin_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON admin_messages;

-- Neue Policy: Admins können alle Nachrichten sehen
CREATE POLICY "Admins can view all messages" 
ON admin_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = true
  ) OR auth.uid() IS NOT NULL -- Temporär für alle authentifizierten Benutzer
);

-- Policy für Updates durch Admins
CREATE POLICY "Admins can update messages" 
ON admin_messages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = true
  ) OR auth.uid() IS NOT NULL -- Temporär für alle authentifizierten Benutzer
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND is_active = true
  ) OR auth.uid() IS NOT NULL -- Temporär für alle authentifizierten Benutzer
);

-- Policy für Inserts (Service Role und Edge Functions)
CREATE POLICY "Service role can insert messages" 
ON admin_messages FOR INSERT 
WITH CHECK (true);