-- Fix venue für alle Bar Mäx Bestellungen in restaurant_bar_orders
UPDATE restaurant_bar_orders 
SET venue = CASE 
  WHEN order_type = 'bar_max' THEN 'Bar Mäx'
  WHEN order_type = 'bar_max_snacks' THEN 'Bar Mäx Snacks'
  WHEN order_type = 'restaurant_maxwell' THEN 'Restaurant Maxwell'
  ELSE venue
END
WHERE order_type IN ('bar_max', 'bar_max_snacks', 'restaurant_maxwell');