-- =====================================================
-- TAGUNGSGAST-SYSTEM: Automatische Admin-Benachrichtigungen
-- =====================================================
-- Diese Migration erstellt einen Trigger, der automatisch eine
-- Admin-Nachricht erstellt, wenn eine neue Tagungsgast-Bestellung eingeht

-- 1. Funktion: Erstelle Admin-Nachricht bei neuer Conference-Bestellung
CREATE OR REPLACE FUNCTION notify_admin_new_conference_order()
RETURNS TRIGGER AS $$
DECLARE
  v_guest_name TEXT;
  v_company TEXT;
  v_conference_room TEXT;
  v_guest_type TEXT;
  v_lunch_selection TEXT;
  v_dinner_selection TEXT;
  v_order_date TEXT;
  v_message_content TEXT;
  v_guest_type_label TEXT;
BEGIN
  -- Extrahiere Daten aus der neuen Bestellung
  v_guest_name := COALESCE(NEW.guest_name, 
    CONCAT(NEW.guest_info->>'firstName', ' ', NEW.guest_info->>'lastName'));
  v_company := COALESCE(NEW.company, NEW.guest_info->>'company', 'N/A');
  v_conference_room := COALESCE(NEW.conference_room, NEW.guest_info->>'conferenceRoom', 'N/A');
  v_guest_type := COALESCE(NEW.guest_type, NEW.guest_info->>'guestType', 'day_guest');
  
  -- Formatiere Lunch-Auswahl
  v_lunch_selection := COALESCE(
    CONCAT(NEW.lunch_category, ': ', NEW.lunch_selection),
    CONCAT(NEW.lunch_menu->>'category', ': ', NEW.lunch_menu->>'selection'),
    'Nicht angegeben'
  );
  
  -- Formatiere Dinner-Auswahl (nur wenn vorhanden)
  IF NEW.dinner_selection IS NOT NULL OR NEW.dinner_menu IS NOT NULL THEN
    v_dinner_selection := COALESCE(
      CONCAT(NEW.dinner_category, ': ', NEW.dinner_selection),
      CONCAT(NEW.dinner_menu->>'category', ': ', NEW.dinner_menu->>'selection'),
      'Nicht angegeben'
    );
  ELSE
    v_dinner_selection := NULL;
  END IF;
  
  v_order_date := TO_CHAR(NEW.order_date::DATE, 'DD.MM.YYYY');
  
  -- Gästyp-Label
  IF v_guest_type = 'overnight_guest' THEN
    v_guest_type_label := 'Tagungsgast + Übernachtung';
  ELSE
    v_guest_type_label := 'Tagungsgast';
  END IF;
  
  -- Erstelle formatierte Nachricht
  v_message_content := E'🏢 NEUE TAGUNGSGAST-BESTELLUNG\n\n';
  v_message_content := v_message_content || E'📅 Datum: ' || v_order_date || E'\n';
  v_message_content := v_message_content || E'👤 Gast: ' || v_guest_name || E'\n';
  v_message_content := v_message_content || E'🏢 Firma: ' || v_company || E'\n';
  v_message_content := v_message_content || E'📍 Tagungsraum: ' || v_conference_room || E'\n';
  v_message_content := v_message_content || E'🎫 Typ: ' || v_guest_type_label || E'\n\n';
  v_message_content := v_message_content || E'🍽️ MENÜAUSWAHL:\n';
  v_message_content := v_message_content || E'🍲 Mittagessen: ' || v_lunch_selection || E'\n';
  
  IF v_dinner_selection IS NOT NULL THEN
    v_message_content := v_message_content || E'🍷 Abendessen: ' || v_dinner_selection || E'\n';
  END IF;
  
  v_message_content := v_message_content || E'\n⚡ Status: Neu - Bitte bestätigen';
  
  -- Erstelle Admin-Nachricht
  INSERT INTO admin_messages (
    message_type,
    source_form,
    recipient_type,
    recipient_contact,
    customer_name,
    company,
    room_number,
    message_content,
    status,
    priority,
    metadata,
    sent_at,
    created_at
  ) VALUES (
    'conference_order',
    'conference-service',
    'admin',
    'internal',
    v_guest_name,
    v_company,
    v_conference_room,
    v_message_content,
    'pending',
    true,  -- Hohe Priorität für neue Bestellungen
    jsonb_build_object(
      'order_id', NEW.id,
      'order_date', v_order_date,
      'guest_type', v_guest_type,
      'lunch_selection', v_lunch_selection,
      'dinner_selection', v_dinner_selection,
      'conference_room', v_conference_room,
      'send_method', NEW.send_method
    ),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Admin-Nachricht erstellt für Bestellung: %', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger: Automatisch bei neuer Conference-Bestellung
DROP TRIGGER IF EXISTS trigger_new_conference_order_notification ON conference_orders;

CREATE TRIGGER trigger_new_conference_order_notification
  AFTER INSERT ON conference_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_conference_order();

-- 3. Index für Performance (Admin-Nachrichten nach Typ filtern)
CREATE INDEX IF NOT EXISTS idx_admin_messages_message_type 
  ON admin_messages(message_type);

CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at 
  ON admin_messages(created_at DESC);

-- 4. Kommentar zur Dokumentation
COMMENT ON FUNCTION notify_admin_new_conference_order() IS 
  'Erstellt automatisch eine Admin-Benachrichtigung wenn eine neue Tagungsgast-Bestellung eingeht. Trigger für conference_orders INSERT.';

COMMENT ON TRIGGER trigger_new_conference_order_notification ON conference_orders IS 
  'Sendet automatisch eine Benachrichtigung an das Admin-Dashboard bei neuen Tagungsgast-Bestellungen.';