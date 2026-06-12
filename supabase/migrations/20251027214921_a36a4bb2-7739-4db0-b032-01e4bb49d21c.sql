-- =====================================================
-- AUTO AI REPLY TRIGGER FÜR ALLE BESTELLSYSTEME
-- =====================================================

-- Erstelle Trigger-Funktion
CREATE OR REPLACE FUNCTION trigger_auto_ai_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Fire-and-Forget HTTP-Aufruf an Edge Function
  PERFORM net.http_post(
    url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/auto-generate-order-reply',
    headers => jsonb_build_object('Content-Type', 'application/json'),
    body => jsonb_build_object(
      'message_id', NEW.id::text,
      'message_type', NEW.message_type,
      'customer_name', NEW.customer_name,
      'guest_phone', NEW.guest_phone_number,
      'metadata', NEW.metadata
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Lösche alten Trigger falls vorhanden
DROP TRIGGER IF EXISTS auto_ai_reply_on_new_order ON admin_messages;

-- Erstelle neuen Trigger für ALLE Bestelltypen
CREATE TRIGGER auto_ai_reply_on_new_order
AFTER INSERT ON admin_messages
FOR EACH ROW
WHEN (NEW.message_type IN (
  'bar_max_order',
  'restaurant_order', 
  'beauty_appointment',
  'shop_order',
  'conference_order',
  'contact_request'
))
EXECUTE FUNCTION trigger_auto_ai_reply();

-- Audit-Log
INSERT INTO api_logs (endpoint, request_data, status_code)
VALUES (
  'auto_ai_reply_trigger_created',
  jsonb_build_object(
    'timestamp', now(),
    'supported_types', ARRAY[
      'bar_max_order',
      'restaurant_order',
      'beauty_appointment', 
      'shop_order',
      'conference_order',
      'contact_request'
    ]
  ),
  200
);