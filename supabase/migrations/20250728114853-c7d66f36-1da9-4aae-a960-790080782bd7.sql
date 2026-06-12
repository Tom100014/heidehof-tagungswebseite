-- Migration: Tagungsgast-Bestellungen in conference_orders Tabelle übertragen (korrigiert)
-- Kopiere alle conference_order Messages in die conference_orders Tabelle

INSERT INTO conference_orders (
  id,
  guest_info,
  lunch_menu,
  dinner_menu,
  order_date,
  created_at,
  status,
  send_method,
  guest_name,
  company,
  conference_room
)
SELECT 
  id,
  -- guest_info als JSON Object
  jsonb_build_object(
    'guestName', metadata->>'guestName',
    'company', metadata->>'company',
    'guestType', metadata->>'guestType',
    'conferenceRoom', COALESCE(metadata->>'conferenceRoom', ''),
    'contactMethod', recipient_type,
    'contactValue', recipient_contact
  ) as guest_info,
  -- lunch_menu als JSON Object falls vorhanden
  CASE 
    WHEN metadata->>'lunchSelection' IS NOT NULL THEN
      jsonb_build_object(
        'selection', metadata->>'lunchSelection',
        'category', CASE 
          WHEN LOWER(metadata->>'lunchSelection') LIKE '%fisch%' THEN 'fish'
          WHEN LOWER(metadata->>'lunchSelection') LIKE '%fleisch%' OR LOWER(metadata->>'lunchSelection') LIKE '%rind%' THEN 'meat'
          ELSE 'vegetarian'
        END
      )
    ELSE NULL
  END as lunch_menu,
  -- dinner_menu als JSON Object falls vorhanden  
  CASE 
    WHEN metadata->>'dinnerSelection' IS NOT NULL THEN
      jsonb_build_object(
        'selection', metadata->>'dinnerSelection',
        'category', CASE 
          WHEN LOWER(metadata->>'dinnerSelection') LIKE '%fisch%' THEN 'fish'
          WHEN LOWER(metadata->>'dinnerSelection') LIKE '%fleisch%' OR LOWER(metadata->>'dinnerSelection') LIKE '%rind%' THEN 'meat'
          ELSE 'vegetarian'
        END
      )
    ELSE NULL
  END as dinner_menu,
  -- order_date aus menuDate extrahieren und als DATE konvertieren
  CASE 
    WHEN metadata->>'menuDate' LIKE '%28. July 2025%' THEN DATE '2025-07-28'
    WHEN metadata->>'menuDate' LIKE '%29. July 2025%' THEN DATE '2025-07-29'
    WHEN metadata->>'menuDate' LIKE '%30. July 2025%' THEN DATE '2025-07-30'
    ELSE DATE(created_at)
  END as order_date,
  created_at,
  status,
  recipient_type as send_method,
  customer_name as guest_name,
  metadata->>'company' as company,
  metadata->>'conferenceRoom' as conference_room
FROM admin_messages 
WHERE message_type = 'conference_order'
  AND id NOT IN (SELECT id FROM conference_orders)
ON CONFLICT (id) DO NOTHING;