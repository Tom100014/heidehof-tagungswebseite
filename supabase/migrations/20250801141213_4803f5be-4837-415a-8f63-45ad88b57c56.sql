-- Test: Erstelle eine admin_message für Restaurant-Bestellung
INSERT INTO admin_messages (
  message_type,
  source_form,
  recipient_type,
  recipient_contact,
  message_content,
  customer_name,
  room_number,
  order_reference,
  metadata,
  status,
  sent_at,
  priority
) VALUES (
  'restaurant_order',
  'Restaurant Maxwell Bestellung Test',
  'whatsapp',
  '+4917634177214',
  '*🍽️ Restaurant Maxwell Test Bestellung*

👤 *Kunde:* Test User Dashboard
📍 *Zustellort:* Zimmer 123
⏰ *Gewünschte Zeit:* jetzt

*📋 Bestellung:*
Test Speise

Vielen Dank für Ihre Bestellung!',
  'Test User Dashboard',
  '123',
  'TEST-DASHBOARD-' || extract(epoch from now()),
  '{"order_type": "restaurant_maxwell", "test": true}'::jsonb,
  'sent',
  now(),
  true
);