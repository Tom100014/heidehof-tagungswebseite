import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting weather cache generation...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine current time window
    const now = new Date();
    const hour = now.getHours();
    
    let windowLabel: string;
    let windowStart: Date;
    let windowEnd: Date;
    
    if (hour >= 4 && hour < 12) {
      windowLabel = 'morning';
      windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0);
      windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    } else if (hour >= 12 && hour < 18) {
      windowLabel = 'noon';
      windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
      windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
    } else {
      windowLabel = 'evening';
      if (hour >= 18) {
        windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
        windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 4, 0, 0);
      } else {
        windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18, 0, 0);
        windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0);
      }
    }

    console.log(`📅 Window: ${windowLabel} (${windowStart.toISOString()} - ${windowEnd.toISOString()})`);

    // Fetch weather (today + tomorrow)
    let todayWeather, tomorrowWeather;
    try {
      const { data: weatherResponse, error: weatherError } = await supabase.functions.invoke('weather-integration', {
        body: { location: 'Ingolstadt' }
      });
      
      if (weatherError || !weatherResponse?.today) {
        throw new Error('Weather data unavailable');
      }
      
      todayWeather = weatherResponse.today;
      tomorrowWeather = weatherResponse.tomorrow;
      console.log('✅ Weather data fetched:', { today: todayWeather, tomorrow: tomorrowWeather });
    } catch (error) {
      console.error('❌ Weather API Error:', error);
      // Fallback weather if API fails
      todayWeather = {
        temp: 15,
        condition: 'Bewölkt',
        precipitation: 60,
        windSpeed: 15,
        icon: '☁️'
      };
      tomorrowWeather = {
        temp: 18,
        condition: 'Teilweise bewölkt',
        precipitation: 20,
        windSpeed: 10,
        icon: '🌤️'
      };
    }

    console.log('🌤️ Weather:', { today: todayWeather, tomorrow: tomorrowWeather });

    // Fetch snapshots
    const { data: snapshots, error: snapshotError } = await supabase
      .from('ingolstadt_live_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (snapshotError) {
      console.error('❌ Error fetching snapshots:', snapshotError);
      throw snapshotError;
    }

    // Parse activities correctly
    const activities = snapshots?.flatMap(s => {
      if (!s.payload || !Array.isArray(s.payload)) return [];
      return s.payload.map((item: any, index: number) => ({
        id: `${s.id}_${index}`,
        title: item.title || item.name || 'Event',
        category: s.category || 'general',
        description: item.description || item.shortDescription || '',
        location: item.location || 'Ingolstadt',
        time: item.time || item.openingHours || '',
        vibe: item.vibe || [],
        priceRange: item.priceRange || '',
        websiteUrl: item.websiteUrl || item.url || ''
      }));
    }) || [];

    console.log(`📊 Parsed ${activities.length} activities from ${snapshots?.length || 0} snapshots`);

    // Build AI prompt with time context and 2-day weather
    const systemPrompt = `Du bist ein lokaler Concierge für Ingolstadt, Deutschland.

AKTUELLES WETTER (HEUTE):
- Zeitfenster: ${windowLabel} (${hour}:00 Uhr)
- Temperatur: ${todayWeather.temp}°C
- Bedingung: ${todayWeather.condition}
- Niederschlag: ${todayWeather.precipitation}%
- Wind: ${todayWeather.windSpeed} km/h

MORGEN'S WETTER-PROGNOSE:
- Temperatur: ${tomorrowWeather.temp}°C (Min: ${tomorrowWeather.tempMin}°C, Max: ${tomorrowWeather.tempMax}°C)
- Bedingung: ${tomorrowWeather.condition}
- Niederschlag: ${tomorrowWeather.precipitation}%
- Wind: ${tomorrowWeather.windSpeed} km/h

VERFÜGBARE AKTIVITÄTEN:
${JSON.stringify(activities.slice(0, 50), null, 2)}

KATEGORISIERUNGS-REGELN:

1️⃣ PERFEKT FÜR HEUTE (5-8 Aktivitäten):
- Passen OPTIMAL zu HEUTIGEM Wetter + Zeitfenster
- morning (4-12h): Museen, Cafés, Shopping, Frühstück
- noon (12-18h): Restaurants, Parks, Sightseeing, Mittagessen
- evening (18-4h): Bars, Theater, Events, Abendessen
- Bei Regen/kalt (<10°C oder >60% Niederschlag): NUR Indoor-Aktivitäten
- Bei Sonne/warm (>15°C und <30% Niederschlag): Bevorzuge Outdoor-Aktivitäten

2️⃣ ALTERNATIVE BEI REGEN (3-5 Aktivitäten):
- NUR INDOOR-AKTIVITÄTEN die man heute bei schlechtem Wetter machen kann
- Museen, Kinos, Indoor-Sport, Shopping-Center, Wellness, Spa
- KEINE Outdoor-Aktivitäten wie Parks, Radfahren, Baggersee
- Diese Kategorie ist für: "Was kann ich heute machen wenn es regnet?"

3️⃣ FÜR MORGEN VORMERKEN (3-5 Aktivitäten):
- WICHTIG: Basiere die Auswahl auf MORGEN'S WETTER-PROGNOSE!
- Wenn morgen BESSER als heute (wärmer, weniger Regen): Outdoor-Aktivitäten (Parks, Radfahren, Baggersee, Biergarten)
- Wenn morgen SCHLECHTER als heute (kälter, mehr Regen): Indoor-Aktivitäten (Museen, Shopping, Wellness, Kino)
- Wenn morgen ÄHNLICH wie heute: Mix aus Indoor/Outdoor passend zur Temperatur und Niederschlag
- Events mit morgigem Datum immer einbeziehen

WICHTIG: 
- Nutze die ECHTE Wetterprognose für morgen, nicht raten!
- Gib vollständige Activity-Objekte mit allen Feldern zurück (id, title, category, description, location, time, vibe, priceRange, websiteUrl)

Antworte im JSON Format:
{
  "reasoning": "1-2 Sätze über heutiges und morgiges Wetter + Kategorisierung",
  "categories": {
    "perfect": [vollständige Activity-Objekte],
    "alternative": [vollständige Activity-Objekte],
    "tomorrow": [vollständige Activity-Objekte]
  }
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Kategorisiere die Aktivitäten für ${windowLabel}. Heute: ${todayWeather.temp}°C, ${todayWeather.condition}. Morgen: ${tomorrowWeather.temp}°C, ${tomorrowWeather.condition}.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    console.log('🤖 AI Response received');

    // Parse AI response
    let parsedResponse;
    try {
      const jsonMatch = aiMessage.match(/```json\n([\s\S]*?)\n```/) || aiMessage.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiMessage;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('⚠️ JSON Parse Error, using fallback categorization');
      const isGoodWeather = weatherData.temp > 15 && weatherData.precipitation < 30;
      parsedResponse = {
        reasoning: `Heute ${todayWeather.temp}°C (${todayWeather.condition}), morgen ${tomorrowWeather.temp}°C (${tomorrowWeather.condition}). Empfehlung: ${isGoodWeather ? 'Outdoor' : 'Indoor'}-Aktivitäten.`,
        categories: {
          perfect: activities.slice(0, 8),
          alternative: activities.slice(8, 13),
          tomorrow: activities.slice(13, 18)
        }
      };
    }

    // Save to cache
    const windowDate = new Date(windowStart.getFullYear(), windowStart.getMonth(), windowStart.getDate());
    
    const { error: cacheError } = await supabase
      .from('weather_activity_cache')
      .upsert({
        window_label: windowLabel,
        window_date: windowDate.toISOString().split('T')[0],
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        weather_condition: todayWeather.condition,
        temperature: todayWeather.temp,
        categorized_activities: parsedResponse.categories,
        reasoning: parsedResponse.reasoning,
        generated_at: now.toISOString()
      }, {
        onConflict: 'window_label,window_date',
        ignoreDuplicates: false
      });

    if (cacheError) {
      console.error('❌ Error saving cache:', cacheError);
      throw cacheError;
    }

    console.log('✅ Cache saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        windowLabel,
        activitiesCount: {
          perfect: parsedResponse.categories.perfect?.length || 0,
          alternative: parsedResponse.categories.alternative?.length || 0,
          tomorrow: parsedResponse.categories.tomorrow?.length || 0
        },
        message: 'Cache generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in generate-weather-cache:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
