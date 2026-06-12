-- Temporär die RLS-Policies für admin_messages lockern für Development
-- Aktuelle restriktive Policies entfernen und durch Development-freundliche ersetzen

DROP POLICY IF EXISTS "Admins can view admin messages" ON admin_messages;
DROP POLICY IF EXISTS "Admins can insert admin messages" ON admin_messages;
DROP POLICY IF EXISTS "Admins can update admin messages" ON admin_messages;

-- Neue permissive Policies für Development erstellen
CREATE POLICY "Anyone can view admin messages (dev)" ON admin_messages 
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert admin messages (dev)" ON admin_messages 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update admin messages (dev)" ON admin_messages 
FOR UPDATE USING (true);

-- Auch für admin_profiles die Policies lockern
DROP POLICY IF EXISTS "dev_read_admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "dev_insert_admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "dev_update_admin_profiles" ON admin_profiles;

CREATE POLICY "Anyone can read admin_profiles (dev)" ON admin_profiles 
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert admin_profiles (dev)" ON admin_profiles 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update admin_profiles (dev)" ON admin_profiles 
FOR UPDATE USING (true);