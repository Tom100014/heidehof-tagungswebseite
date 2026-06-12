
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KitchenRequest {
  menuId: string;
  actionType: 'recipes' | 'shopping_list' | 'calculation' | 'kitchen_plan';
  guestCount: number;
  guestDistribution: {
    dayGuests: number;
    overnightGuests: number;
    vegetarian: number;
    meat: number;
    fish: number;
  };
}

// Professional 4-Star Hotel Prompts
const defaultPrompts = {
  recipes: `Sie sind der Küchenchef eines 4-Sterne Tagungshotels. Erstellen Sie professionelle Rezepte für folgende Menüs:

TAGESMENÜ: {menuDate}
GÄSTEVERTEILUNG: {totalGuests} Gäste ({dayGuests} Tagung + {overnightGuests} Übernachtung)
HAUPTGERICHTE: {vegetarian} Vegetarisch | {meat} Fleisch | {fish} Fisch

MITTAGSMENÜ (für alle {totalGuests} Gäste):
• Vorspeise: {lunchAppetizer}
• Hauptgang Fisch: {lunchFish}
• Hauptgang Fleisch: {lunchMeat}  
• Hauptgang Vegetarisch: {lunchVegetarian}
• Dessert: {lunchDessert}

ABENDMENÜ (nur für {overnightGuests} Übernachtungsgäste):
• Vorspeise: {dinnerAppetizer}
• Hauptgang Fisch: {dinnerFish}
• Hauptgang Fleisch: {dinnerMeat}
• Hauptgang Vegetarisch: {dinnerVegetarian}
• Dessert: {dinnerDessert}

ANTWORTEN SIE NUR MIT DIESEM JSON-FORMAT:

{
  "recipes": [
    {
      "dish_name": "Präziser Gerichtname",
      "dish_type": "lunch_appetizer|lunch_main_fish|lunch_main_meat|lunch_main_vegetarian|lunch_dessert|dinner_appetizer|dinner_main_fish|dinner_main_meat|dinner_main_vegetarian|dinner_dessert",
      "portions": "Exakte Portionsanzahl für dieses Gericht",
      "preparation_time_minutes": "Vorbereitungszeit in Minuten",
      "cooking_time_minutes": "Garzeit in Minuten", 
      "difficulty_level": "professional",
      "ingredients": [
        {
          "name": "Zutat",
          "quantity": "Menge für alle Portionen",
          "unit": "g|kg|ml|l|Stück|Bund|etc."
        }
      ],
      "instructions": [
        "1. MISE EN PLACE: Detaillierte Vorbereitung...",
        "2. ZUBEREITUNG: Schritt-für-Schritt Anleitung...",
        "3. ANRICHTEN: Professionelle Präsentation...",
        "4. SERVICE: Temperatur und Timing..."
      ],
      "chef_tips": [
        "4-Sterne Hotel Qualitätskontrolle",
        "Optimierte Arbeitsabläufe für Großküche",
        "Presentation und Garnierung"
      ],
      "temperature_control": {
        "preparation_temp": "Lagertemperatur",
        "cooking_temp": "Gartemperatur", 
        "serving_temp": "Servicetemperatur"
      },
      "presentation": "Professionelle Anrichtung für 4-Sterne Standard",
      "haccp_notes": "HACCP-Kontrollpunkte und Hygienemaßnahmen",
      "storage_instructions": "Lagerung und Haltbarkeit",
      "allergens": ["Gluten", "Laktose", "etc."],
      "nutritional_notes": "Nährwerte und Diäthinweise"
    }
  ]
}

WICHTIG: 
- Berechnen Sie Portionen exakt (Mittagsmenü: {totalGuests}, Abendmenü: {overnightGuests})
- Verwenden Sie professionelle Küchenterminologie
- Alle Mengen für Großküche berechnen
- 4-Sterne Qualitätsstandards einhalten
- NUR JSON antworten, kein zusätzlicher Text`,

  shopping_list: `Sie sind der Einkaufsleiter eines 4-Sterne Tagungshotels. Erstellen Sie eine professionelle Einkaufsliste:

TAGESMENÜ: {menuDate}
GÄSTEVERTEILUNG: {totalGuests} Gäste ({dayGuests} Tagung + {overnightGuests} Übernachtung)
HAUPTGERICHTE: {vegetarian} Vegetarisch | {meat} Fleisch | {fish} Fisch

MITTAGSMENÜ: {lunchAppetizer} | {lunchFish} | {lunchMeat} | {lunchVegetarian} | {lunchDessert}
ABENDMENÜ: {dinnerAppetizer} | {dinnerFish} | {dinnerMeat} | {dinnerVegetarian} | {dinnerDessert}

ANTWORTEN SIE NUR MIT DIESEM JSON-FORMAT:

{
  "categories": [
    {
      "name": "Frisches Fleisch & Geflügel",
      "items": [
        {
          "name": "Produktname",
          "quantity": "Menge für alle Portionen",
          "unit": "kg|g|Stück",
          "estimated_cost": "Geschätzte Kosten in EUR",
          "supplier": "Premium-Lieferant für 4-Sterne Hotels",
          "quality_notes": "Qualitätsanforderungen (Bio, Regional, etc.)",
          "storage_requirements": "Lagerung und Temperatur"
        }
      ]
    },
    {
      "name": "Frischer Fisch & Meeresfrüchte",
      "items": [...]
    },
    {
      "name": "Gemüse & Salate (regional/saisonal)",
      "items": [...]
    },
    {
      "name": "Milchprodukte & Eier",
      "items": [...]
    },
    {
      "name": "Gewürze & Kräuter",
      "items": [...]
    },
    {
      "name": "Backwaren & Beilagen",
      "items": [...]
    },
    {
      "name": "Getränke & Begleitungen",
      "items": [...]
    }
  ],
  "delivery_schedule": {
    "fresh_items": "Lieferung am Vorabend bis 16:00 Uhr",
    "dry_goods": "Wöchentliche Lieferung möglich",
    "special_orders": "48h Vorlaufzeit für Premium-Produkte"
  },
  "total_estimated_cost": "Gesamtkosten in EUR (realistisch für 4-Sterne Hotel)",
  "cost_breakdown": {
    "food_cost_per_guest": "Food Cost pro Gast",
    "total_food_cost": "Gesamte Wareneinsatzkosten",
    "premium_surcharge": "Aufschlag für 4-Sterne Qualität"
  }
}

WICHTIG:
- Realistische Preise für 4-Sterne Hotels
- Premium-Qualität und regionale Lieferanten
- Exakte Mengenberechnung für alle Gäste
- Berücksichtigung von Verschnitt und Reserve
- NUR JSON antworten`,

  calculation: `Sie sind der Controlling-Leiter eines 4-Sterne Tagungshotels. Erstellen Sie eine detaillierte Kostenkalkulation:

TAGESMENÜ: {menuDate}
GÄSTEVERTEILUNG: {totalGuests} Gäste ({dayGuests} Tagung + {overnightGuests} Übernachtung)
HAUPTGERICHTE: {vegetarian} Vegetarisch | {meat} Fleisch | {fish} Fisch

MITTAGSMENÜ: {lunchAppetizer} | {lunchFish} | {lunchMeat} | {lunchVegetarian} | {lunchDessert}
ABENDMENÜ: {dinnerAppetizer} | {dinnerFish} | {dinnerMeat} | {dinnerVegetarian} | {dinnerDessert}

ANTWORTEN SIE NUR MIT DIESEM JSON-FORMAT:

{
  "calculation_breakdown": {
    "lunch": {
      "appetizer": {
        "dish_name": "{lunchAppetizer}",
        "portions": {totalGuests},
        "food_cost_per_portion": "Wareneinsatz pro Portion (EUR)",
        "labor_cost_per_portion": "Personalkosten pro Portion (EUR)",
        "overhead_cost_per_portion": "Gemeinkosten pro Portion (EUR)",
        "total_cost_per_portion": "Gesamtkosten pro Portion (EUR)",
        "suggested_price_per_portion": "Verkaufspreis-Empfehlung (EUR)",
        "profit_margin_percent": "Gewinnmarge in %",
        "total_food_cost": "Gesamter Wareneinsatz (EUR)",
        "total_cost": "Gesamtkosten (EUR)",
        "total_revenue": "Gesamtumsatz (EUR)"
      },
      "main_dishes": {
        "fish": {
          "dish_name": "{lunchFish}",
          "portions": {fish},
          "food_cost_per_portion": 18.50,
          "labor_cost_per_portion": 8.20,
          "overhead_cost_per_portion": 4.30,
          "total_cost_per_portion": 31.00,
          "suggested_price_per_portion": 42.00,
          "profit_margin_percent": 26.2,
          "total_food_cost": "Berechnung",
          "total_cost": "Berechnung", 
          "total_revenue": "Berechnung"
        },
        "meat": {
          "dish_name": "{lunchMeat}",
          "portions": {meat},
          "food_cost_per_portion": 16.80,
          "labor_cost_per_portion": 7.50,
          "overhead_cost_per_portion": 4.20,
          "total_cost_per_portion": 28.50,
          "suggested_price_per_portion": 38.00,
          "profit_margin_percent": 25.0,
          "total_food_cost": "Berechnung",
          "total_cost": "Berechnung",
          "total_revenue": "Berechnung"
        },
        "vegetarian": {
          "dish_name": "{lunchVegetarian}",
          "portions": {vegetarian},
          "food_cost_per_portion": 12.20,
          "labor_cost_per_portion": 6.80,
          "overhead_cost_per_portion": 3.50,
          "total_cost_per_portion": 22.50,
          "suggested_price_per_portion": 32.00,
          "profit_margin_percent": 29.7,
          "total_food_cost": "Berechnung",
          "total_cost": "Berechnung",
          "total_revenue": "Berechnung"
        }
      },
      "dessert": {
        "dish_name": "{lunchDessert}",
        "portions": {totalGuests},
        "food_cost_per_portion": 4.50,
        "labor_cost_per_portion": 2.20,
        "overhead_cost_per_portion": 1.30,
        "total_cost_per_portion": 8.00,
        "suggested_price_per_portion": 12.00,
        "profit_margin_percent": 33.3,
        "total_food_cost": "Berechnung",
        "total_cost": "Berechnung",
        "total_revenue": "Berechnung"
      },
      "lunch_totals": {
        "total_food_cost": "Summe aller Wareneinsätze",
        "total_labor_cost": "Summe aller Personalkosten",
        "total_overhead_cost": "Summe aller Gemeinkosten",
        "total_cost": "Gesamtkosten Mittagsmenü",
        "total_revenue": "Gesamtumsatz Mittagsmenü",
        "total_profit": "Gewinn Mittagsmenü",
        "overall_margin_percent": "Gesamtmarge Mittagsmenü"
      }
    },
    "dinner": {
      "appetizer": {
        "dish_name": "{dinnerAppetizer}",
        "portions": {overnightGuests},
        "food_cost_per_portion": 8.50,
        "labor_cost_per_portion": 4.20,
        "overhead_cost_per_portion": 2.30,
        "total_cost_per_portion": 15.00,
        "suggested_price_per_portion": 22.00,
        "profit_margin_percent": 31.8,
        "total_food_cost": "Berechnung",
        "total_cost": "Berechnung",
        "total_revenue": "Berechnung"
      },
      "main_dishes": {
        "fish": {
          "dish_name": "{dinnerFish}",
          "portions": {fish},
          "food_cost_per_portion": 22.50,
          "labor_cost_per_portion": 9.80,
          "overhead_cost_per_portion": 5.20,
          "total_cost_per_portion": 37.50,
          "suggested_price_per_portion": 52.00,
          "profit_margin_percent": 27.9,
          "total_food_cost": "Berechnung",
          "total_cost": "Berechnung",
          "total_revenue": "Berechnung"
        },
        "meat": {
          "dish_name": "{dinnerMeat}",
          "portions": {meat},
          "food_cost_per_portion": 24.80,
          "labor_cost_per_portion": 10.20,
          "overhead_cost_per_portion": 5.50,
          "total_cost_per_portion": 40.50,
          "suggested_price_per_portion": 56.00,
          "profit_margin_percent": 27.7,
          "total_food_cost": "Berechnung",
          "total_cost": "Berechnung",
          "total_revenue": "Berechnung"
        },
        "vegetarian": {
          "dish_name": "{dinnerVegetarian}",
          "portions": {vegetarian},
          "food_cost_per_portion": 16.50,
          "labor_cost_per_portion": 8.20,
          "overhead_cost_per_portion": 4.30,
          "total_cost_per_portion": 29.00,
          "suggested_price_per_portion": 42.00,
          "profit_margin_percent": 31.0,
          "total_food_cost": "Berechnung",
          "total_cost": "Berechnung",
          "total_revenue": "Berechnung"
        }
      },
      "dessert": {
        "dish_name": "{dinnerDessert}",
        "portions": {overnightGuests},
        "food_cost_per_portion": 6.50,
        "labor_cost_per_portion": 3.20,
        "overhead_cost_per_portion": 1.80,
        "total_cost_per_portion": 11.50,
        "suggested_price_per_portion": 16.00,
        "profit_margin_percent": 28.1,
        "total_food_cost": "Berechnung",
        "total_cost": "Berechnung",
        "total_revenue": "Berechnung"
      },
      "dinner_totals": {
        "total_food_cost": "Summe aller Wareneinsätze",
        "total_labor_cost": "Summe aller Personalkosten", 
        "total_overhead_cost": "Summe aller Gemeinkosten",
        "total_cost": "Gesamtkosten Abendmenü",
        "total_revenue": "Gesamtumsatz Abendmenü",
        "total_profit": "Gewinn Abendmenü",
        "overall_margin_percent": "Gesamtmarge Abendmenü"
      }
    },
    "grand_totals": {
      "total_food_cost": "Gesamter Wareneinsatz des Tages",
      "total_labor_cost": "Gesamte Personalkosten des Tages",
      "total_overhead_cost": "Gesamte Gemeinkosten des Tages", 
      "total_cost": "Gesamtkosten des Tages",
      "total_revenue": "Gesamtumsatz des Tages",
      "total_profit": "Gesamtgewinn des Tages",
      "overall_margin_percent": "Gesamtmarge des Tages"
    }
  },
  "kpi_analysis": {
    "food_cost_percentage": "Food Cost % vom Umsatz",
    "labor_cost_percentage": "Personalkosten % vom Umsatz",
    "profit_per_guest": "Gewinn pro Gast",
    "break_even_guests": "Break-Even Gästeanzahl"
  }
}

WICHTIG:
- Realistische Preise für 4-Sterne Tagungshotels
- Food Cost: 25-30% vom Verkaufspreis
- Personalkosten: 15-20% vom Verkaufspreis
- Zielgewinnmarge: 25-35%
- Alle Beträge in EUR mit 2 Nachkommastellen
- NUR JSON antworten`,

  kitchen_plan: `Sie sind der Küchenchef eines 4-Sterne Tagungshotels. Erstellen Sie einen detaillierten Küchenplan:

TAGESMENÜ: {menuDate}
GÄSTEVERTEILUNG: {totalGuests} Gäste ({dayGuests} Tagung + {overnightGuests} Übernachtung)
HAUPTGERICHTE: {vegetarian} Vegetarisch | {meat} Fleisch | {fish} Fisch

MITTAGSMENÜ (Service: 12:00 Uhr): {lunchAppetizer} | {lunchFish} | {lunchMeat} | {lunchVegetarian} | {lunchDessert}
ABENDMENÜ (Service: 19:00 Uhr): {dinnerAppetizer} | {dinnerFish} | {dinnerMeat} | {dinnerVegetarian} | {dinnerDessert}

ANTWORTEN SIE NUR MIT DIESEM JSON-FORMAT:

{
  "daily_schedule": [
    {
      "time": "06:00",
      "task": "Mise en Place Start - Wareneingang kontrollieren",
      "dish": "Allgemein",
      "duration_minutes": 30,
      "station": "Wareneingangskontrolle",
      "staff_needed": "Küchenchef + 1 Commis",
      "priority": "high"
    },
    {
      "time": "06:30", 
      "task": "Vorspeisen-Vorbereitung: {lunchAppetizer}",
      "dish": "Lunch Vorspeise",
      "duration_minutes": 90,
      "station": "Garde Manger",
      "staff_needed": "1 Commis de Cuisine",
      "priority": "high"
    },
    {
      "time": "08:00",
      "task": "Fisch-Vorbereitung für Mittagsservice: {lunchFish}",
      "dish": "Lunch Fisch",
      "duration_minutes": 120,
      "station": "Fischstation",
      "staff_needed": "1 Chef de Partie Fisch",
      "priority": "high"
    },
    {
      "time": "08:00",
      "task": "Fleisch-Vorbereitung: {lunchMeat}",
      "dish": "Lunch Fleisch",
      "duration_minutes": 150,
      "station": "Fleischstation",
      "staff_needed": "1 Chef de Partie Fleisch",
      "priority": "high"
    },
    {
      "time": "08:30",
      "task": "Vegetarische Gerichte vorbereiten: {lunchVegetarian}",
      "dish": "Lunch Vegetarisch",
      "duration_minutes": 120,
      "station": "Gemüsestation",
      "staff_needed": "1 Commis de Cuisine",
      "priority": "medium"
    },
    {
      "time": "09:00",
      "task": "Dessert-Vorbereitung: {lunchDessert}",
      "dish": "Lunch Dessert",
      "duration_minutes": 180,
      "station": "Pâtisserie",
      "staff_needed": "1 Pâtissier",
      "priority": "medium"
    },
    {
      "time": "11:00",
      "task": "Finale Vorbereitung Mittagsservice - Geschmackskontrollen",
      "dish": "Alle Mittagsgerichte",
      "duration_minutes": 60,
      "station": "Hauptküche",
      "staff_needed": "Küchenchef + Sous Chef",
      "priority": "critical"
    },
    {
      "time": "11:30",
      "task": "Service-Briefing und Personalzuteilung",
      "dish": "Allgemein",
      "duration_minutes": 30,
      "station": "Küche",
      "staff_needed": "Gesamtes Küchenteam",
      "priority": "critical"
    },
    {
      "time": "12:00",
      "task": "MITTAGSSERVICE - {totalGuests} Gäste",
      "dish": "Komplettes Mittagsmenü",
      "duration_minutes": 120,
      "station": "Alle Stationen",
      "staff_needed": "Vollbesetzung",
      "priority": "critical"
    },
    {
      "time": "14:00",
      "task": "Nachbereitung Mittagsservice und Reinigung",
      "dish": "Allgemein",
      "duration_minutes": 60,
      "station": "Alle Stationen",
      "staff_needed": "Küchenteam",
      "priority": "high"
    },
    {
      "time": "15:00",
      "task": "Pause und Personalwechsel",
      "dish": "Allgemein",
      "duration_minutes": 60,
      "station": "Pausenraum",
      "staff_needed": "Schichtübergabe",
      "priority": "medium"
    },
    {
      "time": "16:00",
      "task": "Abendmenü-Vorbereitung Start: {dinnerAppetizer}",
      "dish": "Dinner Vorspeise",
      "duration_minutes": 90,
      "station": "Garde Manger",
      "staff_needed": "1 Commis de Cuisine",
      "priority": "high"
    },
    {
      "time": "16:30",
      "task": "Abend-Fischgerichte vorbereiten: {dinnerFish}",
      "dish": "Dinner Fisch",
      "duration_minutes": 120,
      "station": "Fischstation",
      "staff_needed": "1 Chef de Partie Fisch",
      "priority": "high"
    },
    {
      "time": "16:30",
      "task": "Abend-Fleischgerichte vorbereiten: {dinnerMeat}",
      "dish": "Dinner Fleisch",
      "duration_minutes": 120,
      "station": "Fleischstation", 
      "staff_needed": "1 Chef de Partie Fleisch",
      "priority": "high"
    },
    {
      "time": "17:00",
      "task": "Vegetarische Abendgerichte: {dinnerVegetarian}",
      "dish": "Dinner Vegetarisch",
      "duration_minutes": 90,
      "station": "Gemüsestation",
      "staff_needed": "1 Commis de Cuisine",
      "priority": "medium"
    },
    {
      "time": "17:00",
      "task": "Abend-Desserts vorbereiten: {dinnerDessert}",
      "dish": "Dinner Dessert",
      "duration_minutes": 120,
      "station": "Pâtisserie",
      "staff_needed": "1 Pâtissier",
      "priority": "medium"
    },
    {
      "time": "18:30",
      "task": "Finale Vorbereitung Abendservice - Qualitätskontrolle",
      "dish": "Alle Abendgerichte",
      "duration_minutes": 30,
      "station": "Hauptküche",
      "staff_needed": "Küchenchef + Sous Chef",
      "priority": "critical"
    },
    {
      "time": "19:00",
      "task": "ABENDSERVICE - {overnightGuests} Gäste",
      "dish": "Komplettes Abendmenü",
      "duration_minutes": 150,
      "station": "Alle Stationen",
      "staff_needed": "Vollbesetzung",
      "priority": "critical"
    },
    {
      "time": "21:30",
      "task": "Service-Ende und Tagesabschluss",
      "dish": "Allgemein",
      "duration_minutes": 90,
      "station": "Alle Stationen",
      "staff_needed": "Küchenteam",
      "priority": "high"
    }
  ],
  "mise_en_place": [
    {
      "category": "Vorspeisen-Mise en Place",
      "deadline": "11:00 Uhr",
      "tasks": [
        "Suppen-Grundzubereitungen fertigstellen",
        "Garnierungen für Vorspeisen vorbereiten",
        "Brot und Beilagen bereitstellen",
        "Temperaturkontrollen durchführen"
      ]
    },
    {
      "category": "Hauptgang-Mise en Place",
      "deadline": "11:30 Uhr",
      "tasks": [
        "Alle Proteine portioniert und gewürzt",
        "Gemüse-Beilagen vorbereitet",
        "Saucen und Jus fertig",
        "Garnituren und Dekoration bereit"
      ]
    },
    {
      "category": "Dessert-Mise en Place",
      "deadline": "12:00 Uhr",
      "tasks": [
        "Desserts portioniert und dekoriert",
        "Saucen und Coulis fertig",
        "Begleitungen wie Eis bereit",
        "Präsentationsteller vorbereitet"
      ]
    },
    {
      "category": "Abendservice-Mise en Place",
      "deadline": "18:30 Uhr",
      "tasks": [
        "Alle Komponenten für Abendmenü bereit",
        "Service-Equipment kontrolliert",
        "Temperaturzonen eingestellt",
        "Personal-Briefing abgeschlossen"
      ]
    }
  ],
  "equipment_schedule": {
    "ovens": [
      "Kombidämpfer 1: Fleischgerichte (08:00-14:00, 16:30-21:30)",
      "Kombidämpfer 2: Fischgerichte und Gemüse (08:00-21:30)",
      "Backofen 1: Desserts und Backwaren (07:00-19:00)",
      "Backofen 2: Vorrat für Beilagen (ganztägig)"
    ],
    "hobs": [
      "Herd 1-2: Saucen und Suppen (07:00-21:30)",
      "Herd 3-4: Fleisch- und Fischzubereitung (08:00-21:30)",
      "Herd 5-6: Gemüse und Beilagen (08:00-21:30)"
    ],
    "specialized": [
      "Salamander: Service-Finishing (11:30-14:00, 18:30-21:30)",
      "Plancha: Kurzbratungen (11:30-14:00, 18:30-21:30)",
      "Presse/Grill: Spezielle Zubereitungen (ganztägig)",
      "Eis-Maschine: Dessert-Herstellung (15:00-18:00)"
    ]
  },
  "staff_assignments": {
    "morning_shift": {
      "06:00-15:00": [
        {
          "position": "Küchenchef",
          "count": 1,
          "responsibilities": [
            "Gesamtleitung und Qualitätskontrolle",
            "Wareneingangskontrolle",
            "Mise en Place Überwachung",
            "Service-Koordination"
          ]
        },
        {
          "position": "Sous Chef",
          "count": 1,
          "responsibilities": [
            "Mittagsservice-Leitung",
            "Personalführung",
            "Qualitätskontrolle",
            "Expedit-Station"
          ]
        },
        {
          "position": "Chef de Partie Fleisch",
          "count": 1,
          "responsibilities": [
            "Fleischgerichte-Vorbereitung",
            "Sauce-Herstellung",
            "Service Fleischstation"
          ]
        },
        {
          "position": "Chef de Partie Fisch",
          "count": 1,
          "responsibilities": [
            "Fischgerichte-Vorbereitung",
            "Meeresfrüchte-Verarbeitung",
            "Service Fischstation"
          ]
        },
        {
          "position": "Garde Manger",
          "count": 1,
          "responsibilities": [
            "Vorspeisen-Vorbereitung",
            "Kalte Küche",
            "Salate und Garnierungen"
          ]
        },
        {
          "position": "Pâtissier",
          "count": 1,
          "responsibilities": [
            "Dessert-Herstellung",
            "Backwaren-Produktion",
            "Dessert-Service"
          ]
        },
        {
          "position": "Commis de Cuisine",
          "count": 3,
          "responsibilities": [
            "Gemüse-Vorbereitung",
            "Assistenz bei allen Stationen",
            "Reinigungsarbeiten"
          ]
        }
      ]
    },
    "evening_shift": {
      "15:00-23:00": [
        {
          "position": "Küchenchef",
          "count": 1,
          "responsibilities": [
            "Abendservice-Leitung",
            "Qualitätskontrolle",
            "Tagesabschluss"
          ]
        },
        {
          "position": "Sous Chef",
          "count": 1,
          "responsibilities": [
            "Service-Koordination",
            "Expedit-Station",
            "Personalführung"
          ]
        },
        {
          "position": "Chef de Partie Fleisch",
          "count": 1,
          "responsibilities": [
            "Abend-Fleischgerichte",
            "Service-Leitung Fleischstation"
          ]
        },
        {
          "position": "Chef de Partie Fisch", 
          "count": 1,
          "responsibilities": [
            "Abend-Fischgerichte",
            "Service-Leitung Fischstation"
          ]
        },
        {
          "position": "Garde Manger",
          "count": 1,
          "responsibilities": [
            "Abend-Vorspeisen",
            "Service kalte Küche"
          ]
        },
        {
          "position": "Pâtissier",
          "count": 1,
          "responsibilities": [
            "Dessert-Service",
            "Nachproduktion"
          ]
        },
        {
          "position": "Commis de Cuisine",
          "count": 2,
          "responsibilities": [
            "Service-Assistenz",
            "Abschlussreinigung"
          ]
        }
      ]
    }
  },
  "service_timeline": [
    {
      "time": "11:45",
      "event": "Service-Briefing Mittagsmenü",
      "tasks": [
        "Menü-Durchsprache mit allen Köchen",
        "Allergene und Besonderheiten besprechen", 
        "Portionsgrößen und Präsentation abstimmen",
        "Service-Geschwindigkeit koordinieren"
      ],
      "critical": true
    },
    {
      "time": "12:00",
      "event": "MITTAGSSERVICE START",
      "tasks": [
        "Erste Vorspeisen ausgeben",
        "Hauptgänge nach Bestellung",
        "Qualitätskontrolle jeder Portion",
        "Timing zwischen den Gängen beachten"
      ],
      "critical": true
    },
    {
      "time": "12:30",
      "event": "Service-Peak Mittagsmenü",
      "tasks": [
        "Maximale Ausgabegeschwindigkeit",
        "Alle Stationen koordiniert",
        "Nachschub gewährleisten",
        "Qualität unter Zeitdruck halten"
      ],
      "critical": true
    },
    {
      "time": "18:45",
      "event": "Service-Briefing Abendmenü",
      "tasks": [
        "Abendmenü-Details besprechen",
        "Gäste-Besonderheiten klären",
        "Service-Reihenfolge abstimmen",
        "Last-Minute Qualitätskontrolle"
      ],
      "critical": true
    },
    {
      "time": "19:00",
      "event": "ABENDSERVICE START",
      "tasks": [
        "Vorspeisen-Service beginnen",
        "Hauptgänge zeitversetzt",
        "Premium-Qualität sicherstellen",
        "Gäste-Feedback berücksichtigen"
      ],
      "critical": true
    }
  ],
  "quality_control": [
    {
      "time": "07:00",
      "checkpoint": "Wareneingangskontrolle",
      "responsible": "Küchenchef",
      "criteria": [
        "Frische und Qualität aller Lieferungen",
        "Temperatur-Kontrolle bei kritischen Produkten",
        "Vollständigkeit der Bestellung",
        "Dokumentation für HACCP"
      ]
    },
    {
      "time": "11:30",
      "checkpoint": "Mise en Place Kontrolle",
      "responsible": "Sous Chef",
      "criteria": [
        "Vollständigkeit aller Vorbereitungen",
        "Temperatur-Kontrolle der vorbereiteten Speisen",
        "Qualität und Konsistenz prüfen",
        "Service-Bereitschaft aller Stationen"
      ]
    },
    {
      "time": "12:00-14:00",
      "checkpoint": "Service-Qualitätskontrolle",
      "responsible": "Küchenchef + Sous Chef",
      "criteria": [
        "Jede Portion vor Ausgabe kontrollieren",
        "Temperatur und Präsentation prüfen",
        "Portionsgrößen einhalten",
        "4-Sterne Standard gewährleisten"
      ]
    },
    {
      "time": "19:00-21:30",
      "checkpoint": "Abendservice-Qualitätskontrolle",
      "responsible": "Küchenchef + Sous Chef", 
      "criteria": [
        "Premium-Qualität für Abendgäste",
        "Perfekte Präsentation",
        "Optimale Serviertemperatur",
        "Konsistenz über gesamten Service"
      ]
    }
  ]
}

WICHTIG:
- Realistische Zeitplanung für 4-Sterne Hotel
- Professionelle Küchen-Hierarchie
- HACCP und Qualitätsstandards
- Effiziente Personal- und Geräte-Nutzung  
- Service-Excellence für Tagungsgäste
- NUR JSON antworten`
};

// Helper function to safely extract dish details
const getDishDetails = (dishData: any): string => {
  if (!dishData) return 'Nicht definiert';

  if (typeof dishData === 'string') {
    try {
      const parsed = JSON.parse(dishData);
      return parsed?.name || parsed?.title || dishData;
    } catch {
      return dishData;
    }
  }

  if (typeof dishData === 'object' && dishData !== null) {
    return dishData.name || dishData.title || 'Nicht definiert';
  }
  
  return 'Nicht definiert';
};

// Function to parse JSON content safely
function parseJsonContent(content: string): any {
  try {
    // Try to find JSON in the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, try to parse the entire content
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse JSON content:', error);
    console.error('Content was:', content);
    return null;
  }
}

// Function to parse and save recipes
async function saveRecipesToDatabase(content: string, menuId: string, guestCount: number) {
  console.log('Saving recipes to database...');
  
  try {
    const parsedContent = parseJsonContent(content);
    
    if (!parsedContent || !parsedContent.recipes) {
      console.log('No structured recipes found, saving as full content');
      // Fallback: save as full content
      const recipeData = {
        id: crypto.randomUUID(),
        menu_id: menuId,
        dish_type: 'mixed_menu',
        portions: guestCount,
        preparation_time_minutes: 180,
        cooking_time_minutes: 120,
        difficulty_level: 'professional',
        recipe_content: {
          full_content: content,
          generated_at: new Date().toISOString()
        },
        chef_notes: 'KI-generiertes Rezeptpaket für 4-Sterne Tagungshotel'
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select();

      if (error) throw error;
      return data;
    }

    // Save each recipe separately
    const recipeInserts = [];
    for (const recipe of parsedContent.recipes) {
      const recipeData = {
        id: crypto.randomUUID(),
        menu_id: menuId,
        dish_type: recipe.dish_type || 'mixed_menu',
        portions: recipe.portions || guestCount,
        preparation_time_minutes: recipe.preparation_time_minutes || 60,
        cooking_time_minutes: recipe.cooking_time_minutes || 60,
        difficulty_level: recipe.difficulty_level || 'professional',
        recipe_content: {
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
          chef_tips: recipe.chef_tips || [],
          temperature_control: recipe.temperature_control || {},
          presentation: recipe.presentation || '',
          haccp_notes: recipe.haccp_notes || '',
          storage_instructions: recipe.storage_instructions || '',
          allergens: recipe.allergens || [],
          nutritional_notes: recipe.nutritional_notes || '',
          dish_name: recipe.dish_name || '',
          generated_at: new Date().toISOString()
        },
        chef_notes: `4-Sterne Hotel Rezept für ${recipe.dish_name || 'Gericht'}`
      };
      recipeInserts.push(recipeData);
    }

    const { data, error } = await supabase
      .from('recipes')
      .insert(recipeInserts)
      .select();

    if (error) {
      console.error('Error saving structured recipes:', error);
      throw error;
    }

    console.log('Professional recipes saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveRecipesToDatabase:', error);
    throw error;
  }
}

// Function to parse and save shopping list
async function saveShoppingListToDatabase(content: string, menuId: string, guestCount: number) {
  console.log('Saving professional shopping list to database...');
  
  try {
    const parsedContent = parseJsonContent(content);
    
    const shoppingListData = {
      id: crypto.randomUUID(),
      menu_id: menuId,
      guest_count: guestCount,
      shopping_items: parsedContent || {
        full_content: content,
        generated_at: new Date().toISOString(),
        categories: [],
        hotel_grade: '4-star'
      },
      total_estimated_cost: parsedContent?.total_estimated_cost || 0,
      status: 'generated'
    };

    const { data, error } = await supabase
      .from('shopping_lists')
      .insert(shoppingListData)
      .select();

    if (error) {
      console.error('Error saving shopping list:', error);
      throw error;
    }

    console.log('Professional shopping list saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveShoppingListToDatabase:', error);
    throw error;
  }
}

// Function to parse and save calculation
async function saveCalculationToDatabase(content: string, menuId: string, guestCount: number) {
  console.log('Saving professional calculation to database...');
  
  try {
    const parsedContent = parseJsonContent(content);
    
    let totalFoodCost = 0;
    let totalCost = 0;
    let suggestedPrice = 0;
    let profitMargin = 0;

    if (parsedContent?.calculation_breakdown) {
      const breakdown = parsedContent.calculation_breakdown;
      if (breakdown.grand_totals) {
        totalFoodCost = breakdown.grand_totals.total_food_cost || 0;
        totalCost = breakdown.grand_totals.total_cost || 0;
        suggestedPrice = breakdown.grand_totals.total_revenue || 0;
        profitMargin = breakdown.grand_totals.overall_margin_percent || 0;
      }
    }

    const calculationData = {
      id: crypto.randomUUID(),
      menu_id: menuId,
      guest_count: guestCount,
      cost_breakdown: parsedContent || {
        full_content: content,
        generated_at: new Date().toISOString(),
        hotel_grade: '4-star'
      },
      total_food_cost: totalFoodCost,
      total_cost: totalCost,
      suggested_price: suggestedPrice,
      profit_margin: profitMargin
    };

    const { data, error } = await supabase
      .from('menu_calculations')
      .insert(calculationData)
      .select();

    if (error) {
      console.error('Error saving calculation:', error);
      throw error;
    }

    console.log('Professional calculation saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveCalculationToDatabase:', error);
    throw error;
  }
}

// Function to parse and save kitchen plan
async function saveKitchenPlanToDatabase(content: string, menuId: string, guestCount: number) {
  console.log('Saving professional kitchen plan to database...');
  
  try {
    const parsedContent = parseJsonContent(content);
    
    const kitchenPlanData = {
      id: crypto.randomUUID(),
      menu_id: menuId,
      guest_count: guestCount,
      preparation_schedule: parsedContent || {
        full_content: content,
        generated_at: new Date().toISOString(),
        daily_schedule: [],
        hotel_grade: '4-star'
      },
      mise_en_place: parsedContent?.mise_en_place || [],
      equipment_needed: parsedContent?.equipment_schedule || {},
      staff_requirements: parsedContent?.staff_assignments || {},
      service_timeline: parsedContent?.service_timeline || [],
      special_instructions: parsedContent?.quality_control ? 
        'Professionelle 4-Sterne Hotel Standards mit umfassender Qualitätskontrolle' : 
        '4-Sterne Tagungshotel Küchenplan'
    };

    const { data, error } = await supabase
      .from('kitchen_plans')
      .insert(kitchenPlanData)
      .select();

    if (error) {
      console.error('Error saving kitchen plan:', error);
      throw error;
    }

    console.log('Professional kitchen plan saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveKitchenPlanToDatabase:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: KitchenRequest = await req.json();
    console.log('4-Star Hotel Kitchen Management Request:', requestData);
    
    const { actionType, menuId, guestCount, guestDistribution } = requestData;
    
    if (!actionType || !['recipes', 'shopping_list', 'calculation', 'kitchen_plan'].includes(actionType)) {
      console.error('Ungültiger actionType:', actionType);
      throw new Error('Ungültiger Action Type');
    }

    // Use optimized prompts for 4-star hotel
    let systemPrompt = defaultPrompts[actionType];
    console.log(`Verwende optimierten 4-Sterne Hotel Prompt für ${actionType}`);
    
    // Try to load custom prompt from database
    try {
      const { data: promptData, error: promptError } = await supabase
        .from('hotel_settings')
        .select('value')
        .eq('id', `${actionType}_prompt`)
        .maybeSingle();

      if (!promptError && promptData?.value && typeof promptData.value === 'object' && 'prompt' in promptData.value) {
        const customPrompt = (promptData.value as { prompt: string }).prompt;
        if (customPrompt && customPrompt.trim().length > 0) {
          systemPrompt = customPrompt;
          console.log(`Benutzerdefinierten ${actionType}-Prompt geladen`);
        }
      }
    } catch (promptFetchError) {
      console.log(`Verwende Standard 4-Sterne Hotel Prompt für ${actionType}:`, promptFetchError);
    }

    // Ensure systemPrompt is never undefined
    if (!systemPrompt || typeof systemPrompt !== 'string') {
      console.log(`WARNUNG: Ungültiger Prompt für ${actionType}, verwende Fallback`);
      systemPrompt = defaultPrompts[actionType] || defaultPrompts.recipes;
    }

    console.log(`Professional prompt type: ${typeof systemPrompt}, length: ${systemPrompt?.length || 0}`);

    // Load menu for data replacement
    const { data: menuData, error: menuError } = await supabase
      .from('conference_menus')
      .select('*')
      .eq('id', menuId)
      .single();

    if (menuError || !menuData) {
      throw new Error('Menü nicht gefunden');
    }

    console.log('4-Star Hotel Menu Data:', menuData);

    // Extract dish details safely
    const lunchFish = getDishDetails(menuData.lunch_main_dish_fish);
    const lunchMeat = getDishDetails(menuData.lunch_main_dish_meat);
    const lunchVeg = getDishDetails(menuData.lunch_main_dish_vegetarian);
    const dinnerFish = getDishDetails(menuData.dinner_main_dish_fish);
    const dinnerMeat = getDishDetails(menuData.dinner_main_dish_meat);
    const dinnerVeg = getDishDetails(menuData.dinner_main_dish_vegetarian);

    // Replace placeholders in prompt with current data
    let processedPrompt = systemPrompt;
    try {
      processedPrompt = systemPrompt
        .replace(/{menuDate}/g, menuData.menu_date || 'Nicht definiert')
        .replace(/{totalGuests}/g, guestCount.toString())
        .replace(/{dayGuests}/g, guestDistribution.dayGuests.toString())
        .replace(/{overnightGuests}/g, guestDistribution.overnightGuests.toString())
        .replace(/{vegetarian}/g, guestDistribution.vegetarian.toString())
        .replace(/{meat}/g, guestDistribution.meat.toString())
        .replace(/{fish}/g, guestDistribution.fish.toString())
        .replace(/{lunchAppetizer}/g, menuData.lunch_appetizer || 'Nicht definiert')
        .replace(/{lunchFish}/g, lunchFish)
        .replace(/{lunchMeat}/g, lunchMeat)
        .replace(/{lunchVegetarian}/g, lunchVeg)
        .replace(/{lunchDessert}/g, menuData.lunch_dessert || 'Nicht definiert')
        .replace(/{dinnerAppetizer}/g, menuData.dinner_appetizer || 'Nicht definiert')
        .replace(/{dinnerFish}/g, dinnerFish)
        .replace(/{dinnerMeat}/g, dinnerMeat)
        .replace(/{dinnerVegetarian}/g, dinnerVeg)
        .replace(/{dinnerDessert}/g, menuData.dinner_dessert || 'Nicht definiert');
    } catch (replaceError) {
      console.error('Fehler beim Ersetzen der Platzhalter:', replaceError);
      processedPrompt = systemPrompt;
    }

    console.log('Professional 4-Star Hotel Processed Prompt length:', processedPrompt.length);

    // Generate content with OpenAI using professional system prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Sie sind ein erfahrener Küchenchef und Gastronomiebetriebswirt eines renommierten 4-Sterne Tagungshotels. Ihre Expertise umfasst professionelle Küchenführung, Kostenkalkulation, Warenwirtschaft und Personalmanagement. Erstellen Sie ausschließlich strukturierte, praxistaugliche und detaillierte Inhalte die den höchsten Standards der Hotellerie entsprechen. Wenn JSON angefordert wird, antworten Sie NUR mit gültigem JSON ohne zusätzlichen Text.' 
          },
          { role: 'user', content: processedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log(`Professional 4-Star ${actionType} content generated, now saving to database...`);

    // Save generated content to database based on action type
    let savedData;
    switch (actionType) {
      case 'recipes':
        savedData = await saveRecipesToDatabase(generatedContent, menuId, guestCount);
        break;
      case 'shopping_list':
        savedData = await saveShoppingListToDatabase(generatedContent, menuId, guestCount);
        break;
      case 'calculation':
        savedData = await saveCalculationToDatabase(generatedContent, menuId, guestCount);
        break;
      case 'kitchen_plan':
        savedData = await saveKitchenPlanToDatabase(generatedContent, menuId, guestCount);
        break;
      default:
        throw new Error(`Unbekannter actionType: ${actionType}`);
    }

    console.log(`Professional 4-Star ${actionType} erfolgreich generiert und gespeichert für Menü:`, menuId);

    return new Response(JSON.stringify({ 
      content: generatedContent,
      success: true,
      actionType: actionType,
      menuId: menuId,
      savedData: savedData,
      hotelGrade: '4-star'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fehler bei der 4-Sterne Hotel Küchenmanagement-Generierung:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
