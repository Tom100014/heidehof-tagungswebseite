-- Fix Blog Automation: Switch all schedules to OpenAI and optimize settings
UPDATE automated_blog_schedules 
SET 
  ai_provider = 'openai',
  tone = 'luxuriös',
  content_type = 'premium-artikel',
  word_count = 1200,
  enable_hero_images = true,
  topics_pool = ARRAY[
    'Luxuriöse Wellness-Auszeiten im Hotel Der Heidehof - Spa und Entspannung in Geimersheim bei Ingolstadt',
    'Business-Hotel der Extraklasse: Der Heidehof in Geimersheim - Ihr Partner für erfolgreiche Geschäftsreisen',
    'Kulinarische Höhepunkte im Der Heidehof: Regionale bayerische Küche trifft moderne Gastronomie',
    'Perfekte Veranstaltungslocation in Ingolstadt: Der Heidehof für unvergessliche Events',
    'Erholung pur in Geimersheim: Warum Der Heidehof Ihr ideales Wochenend-Refugium ist',
    'Golf und Genuss in Bayern: Der Heidehof als Ausgangspunkt für sportliche Aktivitäten',
    'Romantische Auszeiten für Paare: Der Heidehof in Geimersheim bei Ingolstadt',
    'Familienurlaub in Bayern: Der Heidehof bietet Komfort für alle Generationen'
  ],
  settings = jsonb_set(
    COALESCE(settings, '{}'),
    '{geo_keywords}', 
    '["Geimersheim bei Ingolstadt", "Bayern Hotel", "Donau Region", "Audi-Stadt Ingolstadt", "Oberbayern Wellness", "Geschäftshotel Bayern"]'::jsonb
  ),
  settings = jsonb_set(
    settings,
    '{include_cta_buttons}', 
    'true'::jsonb
  ),
  updated_at = now()
WHERE is_active = true;

-- Ensure at least one active schedule exists with optimal settings
INSERT INTO automated_blog_schedules (
  schedule_name,
  cron_expression,
  ai_provider,
  tone,
  content_type,
  word_count,
  enable_hero_images,
  is_active,
  topics_pool,
  settings
) VALUES (
  'Heidehof Premium Blog Automation',
  '0 8,16 * * *',
  'openai',
  'luxuriös',
  'premium-artikel',
  1200,
  true,
  true,
  ARRAY[
    'Luxuriöse Wellness-Auszeiten im Hotel Der Heidehof - Spa und Entspannung in Geimersheim bei Ingolstadt',
    'Business-Hotel der Extraklasse: Der Heidehof in Geimersheim - Ihr Partner für erfolgreiche Geschäftsreisen',
    'Kulinarische Höhepunkte im Der Heidehof: Regionale bayerische Küche trifft moderne Gastronomie',
    'Perfekte Veranstaltungslocation in Ingolstadt: Der Heidehof für unvergessliche Events',
    'Erholung pur in Geimersheim: Warum Der Heidehof Ihr ideales Wochenend-Refugium ist'
  ],
  jsonb_build_object(
    'geo_keywords', '["Geimersheim bei Ingolstadt", "Bayern Hotel", "Donau Region", "Audi-Stadt Ingolstadt", "Oberbayern Wellness", "Geschäftshotel Bayern"]'::jsonb,
    'include_cta_buttons', true,
    'hero_image_style', 'luxury-hotel'
  )
) ON CONFLICT (schedule_name) DO UPDATE SET
  ai_provider = EXCLUDED.ai_provider,
  tone = EXCLUDED.tone,
  content_type = EXCLUDED.content_type,
  word_count = EXCLUDED.word_count,
  enable_hero_images = EXCLUDED.enable_hero_images,
  topics_pool = EXCLUDED.topics_pool,
  settings = EXCLUDED.settings,
  updated_at = now();