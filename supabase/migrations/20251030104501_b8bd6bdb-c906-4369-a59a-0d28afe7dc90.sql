-- Drop existing table if it exists
DROP TABLE IF EXISTS public.menu_items CASCADE;

-- Create menu_items table for Restaurant Maxwell food items
CREATE TABLE public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  category TEXT NOT NULL,
  item_type TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  image_url TEXT,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_menu_items_type ON public.menu_items(item_type);
CREATE INDEX idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX idx_menu_items_category ON public.menu_items(category);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view available menu items"
ON public.menu_items FOR SELECT
USING (is_available = true);

-- Allow admins to manage menu items
CREATE POLICY "Admins can manage menu items"
ON public.menu_items FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Insert all 23 Restaurant Maxwell dishes
INSERT INTO public.menu_items (id, name, description, price, category, item_type, is_available) VALUES
('vorspeise-1', 'Carpaccio vom Rind', 'Hauchdünn geschnittenes Rindfleisch mit Rucola, Parmesan und Balsamico', '14.50 €', 'Vorspeisen', 'food', true),
('vorspeise-2', 'Bruschetta Tricolore', 'Geröstetes Ciabatta mit Tomaten, Mozzarella und Basilikum', '9.90 €', 'Vorspeisen', 'food', true),
('vorspeise-3', 'Garnelen in Knoblauch', 'Saftige Garnelen in Olivenöl mit Chili und Kräutern', '16.50 €', 'Vorspeisen', 'food', true),
('vorspeise-4', 'Vitello Tonnato', 'Kalbfleisch mit Thunfischcreme und Kapern', '13.90 €', 'Vorspeisen', 'food', true),
('salat-1', 'Caesar Salad', 'Römersalat mit Hähnchenbrust, Croutons und Parmesan', '12.90 €', 'Salate', 'food', true),
('salat-2', 'Mediterraner Salat', 'Gemischter Salat mit Feta, Oliven und Paprika', '11.50 €', 'Salate', 'food', true),
('salat-3', 'Rucola-Salat mit Garnelen', 'Frischer Rucola mit gegrillten Garnelen', '14.90 €', 'Salate', 'food', true),
('hauptgang-1', 'Rinderfilet Médaillons', 'Zartes Rinderfilet mit Pfeffersauce und Grillgemüse', '28.90 €', 'Hauptgänge', 'food', true),
('hauptgang-2', 'Lachsfilet gegrillt', 'Gegrilltes Lachsfilet mit Zitronen-Butter-Sauce', '24.50 €', 'Hauptgänge', 'food', true),
('hauptgang-3', 'Hühnerbrust Supreme', 'Gefüllte Hühnerbrust mit Spinat und Mozzarella', '19.90 €', 'Hauptgänge', 'food', true),
('hauptgang-4', 'Entenbrust rosa gebraten', 'Entenbrust mit Orangensauce und glasierten Karotten', '26.90 €', 'Hauptgänge', 'food', true),
('hauptgang-5', 'Kalbsschnitzel Wiener Art', 'Paniertes Kalbsschnitzel mit Kartoffelsalat', '22.50 €', 'Hauptgänge', 'food', true),
('hauptgang-6', 'Pasta Carbonara', 'Spaghetti mit Speck, Ei und Parmesan', '15.90 €', 'Hauptgänge', 'food', true),
('hauptgang-7', 'Risotto mit Steinpilzen', 'Cremiges Risotto mit frischen Steinpilzen', '17.90 €', 'Hauptgänge', 'food', true),
('beilage-1', 'Pommes Frites', 'Knusprige goldene Pommes', '4.50 €', 'Beilagen', 'food', true),
('beilage-2', 'Bratkartoffeln', 'Hausgemachte Bratkartoffeln mit Speck', '5.50 €', 'Beilagen', 'food', true),
('beilage-3', 'Grillgemüse', 'Mariniertes mediterranes Gemüse', '6.50 €', 'Beilagen', 'food', true),
('dessert-1', 'Tiramisu', 'Klassisches italienisches Dessert mit Mascarpone', '7.90 €', 'Desserts', 'food', true),
('dessert-2', 'Panna Cotta', 'Cremige Panna Cotta mit Beerensauce', '6.90 €', 'Desserts', 'food', true),
('dessert-3', 'Crème Brûlée', 'Karamellisierte Vanillecreme', '8.50 €', 'Desserts', 'food', true),
('dessert-4', 'Schokoladenmousse', 'Luftige Mousse aus dunkler Schokolade', '7.50 €', 'Desserts', 'food', true),
('dessert-5', 'Apfelstrudel', 'Hausgemachter Strudel mit Vanillesauce', '6.50 €', 'Desserts', 'food', true),
('dessert-6', 'Gemischtes Eis', 'Drei Kugeln nach Wahl mit Sahne', '5.90 €', 'Desserts', 'food', true);