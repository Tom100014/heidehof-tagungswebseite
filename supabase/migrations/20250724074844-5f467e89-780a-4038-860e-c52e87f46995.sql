-- Temporäre RLS-Policy um allen Benutzern (auch nicht-authentifizierten) Zugriff zu gewähren
-- Dies ist NUR für Entwicklungszwecke!
DROP POLICY IF EXISTS "Admins can view all messages" ON admin_messages;

-- Neue Policy: Alle können Admin-Nachrichten sehen (TEMPORÄR für Entwicklung)
CREATE POLICY "Anyone can view messages temporarily" 
ON admin_messages FOR SELECT 
USING (true);

-- Auch Updates für alle erlauben (TEMPORÄR)
DROP POLICY IF EXISTS "Admins can update messages" ON admin_messages;
CREATE POLICY "Anyone can update messages temporarily" 
ON admin_messages FOR UPDATE 
USING (true)
WITH CHECK (true);