-- Übertrage die fehlende Bestellung von Deiekrk Kekrjf in conference_orders
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
  -- lunch_menu als JSON Object - NIEMALS NULL
  COALESCE(
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
    END,
    '{}'::jsonb  -- Fallback zu leerem JSON Object
  ) as lunch_menu,
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
  -- order_date für heute (28.7.2025)
  DATE '2025-07-28' as order_date,
  created_at,
  status,
  recipient_type as send_method,
  customer_name as guest_name,
  metadata->>'company' as company,
  metadata->>'conferenceRoom' as conference_room
FROM admin_messages 
WHERE id = 'af8c5864-c20b-4b12-9acf-4e8c56efb368'
  AND id NOT IN (SELECT id FROM conference_orders)
ON CONFLICT (id) DO NOTHING;