-- Fix Blog Automation: Switch all schedules to OpenAI and optimize settings
UPDATE automated_blog_schedules 
SET 
  ai_provider = 'openai',
  ai_model = 'gpt-4o-mini',
  tone = 'luxuriös',
  content_type = 'premium-artikel',
  word_count = 1200,
  generate_hero_image = true,
  include_cta_buttons = true,
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
  geo_keywords = ARRAY[
    'Geimersheim bei Ingolstadt',
    'Bayern Hotel',
    'Donau Region',
    'Audi-Stadt Ingolstadt',
    'Oberbayern Wellness',
    'Geschäftshotel Bayern'
  ],
  updated_at = now()
WHERE is_active = true;

-- Ensure at least one active schedule exists with optimal settings
INSERT INTO automated_blog_schedules (
  schedule_name,
  trigger_time,
  ai_provider,
  ai_model,
  tone,
  content_type,
  word_count,
  generate_hero_image,
  include_cta_buttons,
  is_active,
  topics_pool,
  geo_keywords
) VALUES (
  'Heidehof Premium Blog Automation',
  'morning',
  'openai',
  'gpt-4o-mini',
  'luxuriös',
  'premium-artikel',
  1200,
  true,
  true,
  true,
  ARRAY[
    'Luxuriöse Wellness-Auszeiten im Hotel Der Heidehof - Spa und Entspannung in Geimersheim bei Ingolstadt',
    'Business-Hotel der Extraklasse: Der Heidehof in Geimersheim - Ihr Partner für erfolgreiche Geschäftsreisen',
    'Kulinarische Höhepunkte im Der Heidehof: Regionale bayerische Küche trifft moderne Gastronomie',
    'Perfekte Veranstaltungslocation in Ingolstadt: Der Heidehof für unvergessliche Events',
    'Erholung pur in Geimersheim: Warum Der Heidehof Ihr ideales Wochenend-Refugium ist'
  ],
  ARRAY[
    'Geimersheim bei Ingolstadt',
    'Bayern Hotel',
    'Donau Region',
    'Audi-Stadt Ingolstadt',
    'Oberbayern Wellness',
    'Geschäftshotel Bayern'
  ]
) ON CONFLICT (schedule_name) DO UPDATE SET
  ai_provider = EXCLUDED.ai_provider,
  ai_model = EXCLUDED.ai_model,
  tone = EXCLUDED.tone,
  content_type = EXCLUDED.content_type,
  word_count = EXCLUDED.word_count,
  generate_hero_image = EXCLUDED.generate_hero_image,
  include_cta_buttons = EXCLUDED.include_cta_buttons,
  topics_pool = EXCLUDED.topics_pool,
  geo_keywords = EXCLUDED.geo_keywords,
  updated_at = now();