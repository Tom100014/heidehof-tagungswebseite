-- Entferne alten Trigger falls vorhanden
DROP TRIGGER IF EXISTS trigger_new_conference_order_notification ON conference_orders;
DROP FUNCTION IF EXISTS notify_admin_new_conference_order();

-- Neue verbesserte Funktion die BEIDE Tabellen befüllt
CREATE OR REPLACE FUNCTION notify_admin_new_conference_order()
RETURNS TRIGGER AS $$
DECLARE
  v_guest_name TEXT;
  v_company TEXT;
  v_conference_room TEXT;
  v_guest_type TEXT;
  v_phone_number TEXT;
  v_lunch_selection TEXT;
  v_dinner_selection TEXT;
  v_contact_method TEXT;
BEGIN
  -- Extrahiere Daten aus guest_info JSONB
  v_guest_name := COALESCE(NEW.guest_info->>'firstName', '') || ' ' || COALESCE(NEW.guest_info->>'lastName', '');
  v_company := NEW.guest_info->>'company';
  v_conference_room := NEW.guest_info->>'conferenceRoom';
  v_guest_type := NEW.guest_info->>'guestType';
  v_phone_number := COALESCE(NEW.guest_info->>'phoneNumber', '+49 8458 64-0');
  v_contact_method := COALESCE(NEW.guest_info->>'contactMethod', 'phone');
  v_lunch_selection := COALESCE(NEW.lunch_menu->>'selection', NEW.lunch_menu->>'category', 'Keine Auswahl');
  v_dinner_selection := CASE 
    WHEN NEW.dinner_menu IS NOT NULL 
    THEN COALESCE(NEW.dinner_menu->>'selection', NEW.dinner_menu->>'category', 'Keine Auswahl')
    ELSE NULL 
  END;
  
  -- Erstelle admin_messages Eintrag für Dashboard-Benachrichtigung
  INSERT INTO admin_messages (
    message_type,
    source_form,
    customer_name,
    recipient_contact,
    recipient_type,
    message_content,
    guest_phone_number,
    order_reference,
    status,
    metadata,
    created_at
  ) VALUES (
    'conference_order',
    'Konferenz Bestellung',
    v_guest_name,
    v_phone_number,
    CASE 
      WHEN v_contact_method = 'phone' THEN 'sms'
      WHEN v_contact_method = 'whatsapp' THEN 'whatsapp'
      ELSE 'email'
    END,
    format(
      E'✅ NEUE TAGUNGSGAST-BESTELLUNG\n\n👤 Gast: %s\n🏢 Firma: %s\n📍 Raum: %s\n👥 Typ: %s\n\n🍽️ MITTAGSMENÜ:\n%s\n%s\n📅 Datum: %s\n⏰ Erstellt: %s',
      v_guest_name,
      COALESCE(v_company, 'N/A'),
      v_conference_room,
      CASE 
        WHEN v_guest_type = 'day_guest' THEN 'Tagungsgast'
        WHEN v_guest_type = 'overnight_guest' THEN 'Tagungsgast + Übernachtung'
        ELSE 'Unbekannt'
      END,
      v_lunch_selection,
      CASE 
        WHEN v_dinner_selection IS NOT NULL THEN format(E'\n🍷 ABENDMENÜ:\n%s', v_dinner_selection)
        ELSE ''
      END,
      NEW.order_date,
      NOW()
    ),
    v_phone_number,
    CONCAT('CONF-', EXTRACT(EPOCH FROM NOW())::BIGINT),
    'new',
    jsonb_build_object(
      'guestName', v_guest_name,
      'company', v_company,
      'conferenceRoom', v_conference_room,
      'guestType', v_guest_type,
      'contactMethod', v_contact_method,
      'contactValue', v_phone_number,
      'lunchSelection', v_lunch_selection,
      'dinnerSelection', v_dinner_selection,
      'orderDateIso', NEW.order_date,
      'menuDate', TO_CHAR(NEW.order_date::DATE, 'DD. FMMonth YYYY'),
      'type', 'conference_order',
      'source', 'Konferenz Bestellung'
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Erstelle Trigger
CREATE TRIGGER trigger_new_conference_order_notification
AFTER INSERT ON conference_orders
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_conference_order();