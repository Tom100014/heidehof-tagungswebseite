-- Test: Jetzt sollte restaurant_order funktionieren
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
  'Restaurant Maxwell Test',
  'whatsapp',
  '+4917634177214',
  '*🍽️ Restaurant Maxwell FUNKTIONIERT*

👤 *Kunde:* Test Dashboard Fix
📍 *Zustellort:* Zimmer 999
⏰ *Gewünschte Zeit:* jetzt

*📋 Bestellung:*
Test Speise - Das Dashboard Problem ist gelöst!

Vielen Dank für Ihre Bestellung!',
  'Test Dashboard Fix',
  '999',
  'DASHBOARD-FIX-' || extract(epoch from now()),
  '{"order_type": "restaurant_maxwell", "fix": "dashboard_working"}'::jsonb,
  'sent',
  now(),
  true
);