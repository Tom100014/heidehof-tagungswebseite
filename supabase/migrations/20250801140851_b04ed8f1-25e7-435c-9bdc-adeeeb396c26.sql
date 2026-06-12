-- Test: Versuche eine neue Bestellung zu erstellen
INSERT INTO restaurant_bar_orders (
  order_type,
  customer_name,
  delivery_location,
  contact_method,
  contact_value,
  items,
  items_text,
  desired_time,
  status,
  priority,
  privacy_accepted,
  venue
) VALUES (
  'restaurant_maxwell',
  'Test User Debug',
  'Test Zimmer 999',
  'whatsapp',
  '+4917634177214',
  '[]'::jsonb,
  'Debug Test Bestellung',
  'jetzt',
  'neu',
  true,
  true,
  'Restaurant Maxwell'
);