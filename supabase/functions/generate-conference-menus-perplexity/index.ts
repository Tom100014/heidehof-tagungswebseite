
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dateFrom, dateTo, prompt, usePerplexity } = await req.json();
    
    console.log('Generating menus with Perplexity for date range:', dateFrom, 'to', dateTo);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate number of days
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

    console.log(`Generating menus for ${dayCount} days with Perplexity`);

    // Create enhanced system prompt for Perplexity
    const systemPrompt = `Du bist ein erfahrener Küchenchef und Menü-Planer für ein gehobenes Hotel. 
    Erstelle ${dayCount} verschiedene, saisonale und abwechslungsreiche Menüs für Tagungsgäste.
    
    Anforderungen:
    - Jedes Tagesmenü braucht Mittagessen und Abendessen
    - Jede Mahlzeit hat: Vorspeise, 3 Hauptgerichte (Fisch, Fleisch, Vegetarisch), Nachspeise
    - Verwende aktuelle Trends und saisonale Zutaten
    - Berücksichtige verschiedene Ernährungsformen
    - Die Menüs sollen sich täglich unterscheiden
    
    ${prompt}
    
    Antworte ausschließlich mit einem JSON Array in folgendem Format:
    [
      {
        "date": "2024-01-15",
        "lunch_appetizer": "Gemischter Salat mit Hausdressing",
        "lunch_main_dish_fish": {
          "id": "lunch_fish",
          "name": "Gebratenes Lachsfilet",
          "description": "mit Zitronenbutter und Gemüse",
          "type": "fish"
        },
        "lunch_main_dish_meat": {
          "id": "lunch_meat", 
          "name": "Rinderfilet",
          "description": "mit Rotweinsoße und Kartoffelgratin",
          "type": "meat"
        },
        "lunch_main_dish_vegetarian": {
          "id": "lunch_veg",
          "name": "Gefüllte Paprika", 
          "description": "mit Quinoa und mediterranem Gemüse",
          "type": "vegetarian"
        },
        "lunch_dessert": "Hausgemachtes Tiramisu",
        "dinner_appetizer": "Tomatensuppe mit frischem Basilikum",
        "dinner_main_dish_fish": {
          "id": "dinner_fish",
          "name": "Doradenfilet",
          "description": "mit Knoblauchöl und Ofengemüse", 
          "type": "fish"
        },
        "dinner_main_dish_meat": {
          "id": "dinner_meat",
          "name": "Kalbsschnitzel",
          "description": "mit Champignonrahmsauce und Spätzle",
          "type": "meat"
        },
        "dinner_main_dish_vegetarian": {
          "id": "dinner_veg",
          "name": "Gemüse-Risotto",
          "description": "mit Parmesan und Rucola",
          "type": "vegetarian"
        },
        "dinner_dessert": "Crème Brûlée mit frischen Beeren"
      }
    ]`;

    console.log('Calling Perplexity API...');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { 
            role: 'system', 
            content: 'Du bist ein professioneller Küchenchef. Nutze aktuelle Kochtrends und saisonale Informationen für innovative Menüs.' 
          },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        search_domain_filter: ['cooking.com', 'food.com', 'allrecipes.com'],
        search_recency_filter: 'month'
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Perplexity response received');

    // Parse the JSON response from Perplexity
    let menuData;
    try {
      const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        menuData = JSON.parse(jsonMatch[0]);
      } else {
        menuData = JSON.parse(generatedContent);
      }
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      throw new Error('Invalid JSON response from Perplexity');
    }

    console.log(`Parsed ${menuData.length} menus from Perplexity response`);

    // Save each menu to the database
    const savedMenus = [];
    for (const menu of menuData) {
      try {
        const menuToSave = {
          menu_date: menu.date,
          lunch_appetizer: menu.lunch_appetizer,
          lunch_main_dish_fish: menu.lunch_main_dish_fish,
          lunch_main_dish_meat: menu.lunch_main_dish_meat,
          lunch_main_dish_vegetarian: menu.lunch_main_dish_vegetarian,
          lunch_dessert: menu.lunch_dessert,
          dinner_appetizer: menu.dinner_appetizer,
          dinner_main_dish_fish: menu.dinner_main_dish_fish,
          dinner_main_dish_meat: menu.dinner_main_dish_meat,
          dinner_main_dish_vegetarian: menu.dinner_main_dish_vegetarian,
          dinner_dessert: menu.dinner_dessert
        };

        const { data: savedMenu, error } = await supabase
          .from('conference_menus')
          .upsert(menuToSave, { onConflict: 'menu_date' })
          .select()
          .single();

        if (error) {
          console.error('Error saving menu for', menu.date, ':', error);
          throw error;
        }

        savedMenus.push(savedMenu);
        console.log('Saved Perplexity menu for', menu.date);

      } catch (saveError) {
        console.error('Failed to save menu for', menu.date, ':', saveError);
        throw saveError;
      }
    }

    console.log(`Successfully saved ${savedMenus.length} Perplexity menus`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        menusCreated: savedMenus.length,
        menus: savedMenus,
        source: 'perplexity'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-conference-menus-perplexity function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Generieren der Menüs mit Perplexity', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
