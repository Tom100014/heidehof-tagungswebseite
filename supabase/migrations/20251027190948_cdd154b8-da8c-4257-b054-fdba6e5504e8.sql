-- Add recipe system columns to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS recipe JSONB,
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';

-- Add helpful comment
COMMENT ON COLUMN menu_items.recipe IS 'Recipe data including ingredients, instructions, garnish, glass_type, and difficulty';
COMMENT ON COLUMN menu_items.preparation_time_minutes IS 'Estimated preparation time in minutes for bartenders/kitchen staff';
COMMENT ON COLUMN menu_items.allergens IS 'Array of allergen identifiers (e.g., Alkohol, Milch, Nüsse, etc.)';

-- Create index for better performance when querying recipes
CREATE INDEX IF NOT EXISTS idx_menu_items_preparation_time ON menu_items(preparation_time_minutes);

-- Add recipe data to some existing cocktails as examples
UPDATE menu_items 
SET 
  recipe = jsonb_build_object(
    'ingredients', jsonb_build_array(
      jsonb_build_object('item', 'Weißer Rum', 'amount', '5cl'),
      jsonb_build_object('item', 'Frischer Limettensaft', 'amount', '2cl'),
      jsonb_build_object('item', 'Frische Minzblätter', 'amount', '8-10 Stück'),
      jsonb_build_object('item', 'Brauner Zucker', 'amount', '1 TL'),
      jsonb_build_object('item', 'Sodawasser', 'amount', 'nach Bedarf'),
      jsonb_build_object('item', 'Crushed Ice', 'amount', 'nach Bedarf')
    ),
    'instructions', jsonb_build_array(
      'Minze mit Zucker im Glas zerstoßen (muddeln)',
      'Limettensaft hinzufügen und leicht umrühren',
      'Rum hinzugießen',
      'Glas mit Crushed Ice füllen',
      'Mit Sodawasser auffüllen',
      'Mit Minzzweig und Limettenscheibe garnieren'
    ),
    'garnish', 'Minzzweig, Limettenscheibe',
    'glass_type', 'Highball-Glas',
    'difficulty', 'einfach'
  ),
  preparation_time_minutes = 4,
  allergens = ARRAY['Alkohol']
WHERE LOWER(name) LIKE '%mojito%' AND recipe IS NULL;

UPDATE menu_items 
SET 
  recipe = jsonb_build_object(
    'ingredients', jsonb_build_array(
      jsonb_build_object('item', 'Prosecco', 'amount', '10cl'),
      jsonb_build_object('item', 'Aperol', 'amount', '6cl'),
      jsonb_build_object('item', 'Sodawasser', 'amount', '1 Spritzer'),
      jsonb_build_object('item', 'Eiswürfel', 'amount', 'nach Bedarf'),
      jsonb_build_object('item', 'Orangenscheibe', 'amount', '1 Stück')
    ),
    'instructions', jsonb_build_array(
      'Eiswürfel in Weinglas geben',
      'Prosecco eingießen',
      'Aperol hinzufügen',
      'Sodawasser hinzufügen',
      'Vorsichtig umrühren',
      'Mit Orangenscheibe garnieren'
    ),
    'garnish', 'Orangenscheibe',
    'glass_type', 'Weinglas / Balloon-Glas',
    'difficulty', 'sehr einfach'
  ),
  preparation_time_minutes = 2,
  allergens = ARRAY['Alkohol']
WHERE LOWER(name) LIKE '%aperol%spritz%' AND recipe IS NULL;

UPDATE menu_items 
SET 
  recipe = jsonb_build_object(
    'ingredients', jsonb_build_array(
      jsonb_build_object('item', 'Gin', 'amount', '5cl'),
      jsonb_build_object('item', 'Tonic Water', 'amount', '15cl'),
      jsonb_build_object('item', 'Eiswürfel', 'amount', 'nach Bedarf'),
      jsonb_build_object('item', 'Limettenscheibe', 'amount', '1 Stück')
    ),
    'instructions', jsonb_build_array(
      'Longdrink-Glas mit Eiswürfeln füllen',
      'Gin über das Eis gießen',
      'Mit Tonic Water auffüllen',
      'Vorsichtig umrühren',
      'Mit Limettenscheibe garnieren'
    ),
    'garnish', 'Limettenscheibe',
    'glass_type', 'Longdrink-Glas / Highball',
    'difficulty', 'sehr einfach'
  ),
  preparation_time_minutes = 2,
  allergens = ARRAY['Alkohol']
WHERE LOWER(name) LIKE '%gin%tonic%' AND recipe IS NULL;

UPDATE menu_items 
SET 
  recipe = jsonb_build_object(
    'ingredients', jsonb_build_array(
      jsonb_build_object('item', 'Wodka', 'amount', '4cl'),
      jsonb_build_object('item', 'Triple Sec / Cointreau', 'amount', '2cl'),
      jsonb_build_object('item', 'Limettensaft', 'amount', '2cl'),
      jsonb_build_object('item', 'Cranberrysaft', 'amount', '3cl'),
      jsonb_build_object('item', 'Eiswürfel', 'amount', 'nach Bedarf')
    ),
    'instructions', jsonb_build_array(
      'Alle Zutaten in einen Shaker geben',
      'Eiswürfel hinzufügen',
      'Kräftig shaken (ca. 15 Sekunden)',
      'In gekühltes Martini-Glas abseihen',
      'Optional: Limettenschale als Garnish'
    ),
    'garnish', 'Limettenschale (optional)',
    'glass_type', 'Martini-Glas / Cocktailschale',
    'difficulty', 'mittel'
  ),
  preparation_time_minutes = 3,
  allergens = ARRAY['Alkohol']
WHERE LOWER(name) LIKE '%cosmopolitan%' AND recipe IS NULL;