-- Add service_instructions column to restaurant_bar_orders table
ALTER TABLE restaurant_bar_orders 
ADD COLUMN service_instructions TEXT;