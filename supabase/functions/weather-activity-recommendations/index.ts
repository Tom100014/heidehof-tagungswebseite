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
    const { 
      temp = 8, 
      condition = 'Bewölkt', 
      precipitation = 60, 
      windSpeed = 15,
      timeOfDay = 'afternoon',
      currentHour = 14,
      mode = 'short' 
    } = await req.json();
    
    console.log('🌤️ Weather Activity Recommendations Request:', { temp, condition, precipitation, windSpeed, timeOfDay, currentHour, mode });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch activities from Supabase snapshot cache
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: snapshots, error: snapshotError } = await supabase
      .from('ingolstadt_live_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (snapshotError) {
      console.error('Error fetching snapshots:', snapshotError);
    }

    // Parse activities correctly - payload is an array!
    const activities = snapshots?.flatMap(s => {
      if (!s.payload || !Array.isArray(s.payload)) return [];
      return s.payload.map((item: any, index: number) => ({
        id: `${s.id}_${index}`,
        title: item.title || item.name || 'Unbekanntes Event',
        category: s.category || 'general',
        description: item.description || item.shortDescription || '',
        location: item.location || 'Ingolstadt',
        time: item.time || item.openingHours || '',
        vibe: item.vibe || [],
        priceRange: item.priceRange || '',
        websiteUrl: item.websiteUrl || item.url || ''
      }));
    }) || [];

    console.log(`📊 Fetched ${activities.length} activities from snapshot cache`);

    // Filter for TODAY ONLY - Parse German dates and check if event is today
    const parseGermanDate = (timeStr: string): Date | null => {
      if (!timeStr) return null;
      
      // Match patterns like "30. Oktober 2025" or "30.10.2025" or "30. Okt 2025"
      const germanMonths: Record<string, number> = {
        'januar': 0, 'februar': 1, 'märz': 2, 'april': 3, 'mai': 4, 'juni': 5,
        'juli': 6, 'august': 7, 'september': 8, 'oktober': 9, 'november': 10, 'dezember': 11,
        'jan': 0, 'feb': 1, 'mär': 2, 'apr': 3, 'mai': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dez': 11
      };
      
      const match = timeStr.match(/(\d{1,2})\.\s*(\w+)\s*(\d{4})/i);
      if (match) {
        const day = parseInt(match[1]);
        const monthStr = match[2].toLowerCase();
        const year = parseInt(match[3]);
        const month = germanMonths[monthStr];
        
        if (month !== undefined) {
          return new Date(year, month, day);
        }
      }
      
      return null;
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayActivities = activities.filter(activity => {
      const eventDate = parseGermanDate(activity.time);
      
      if (!eventDate) {
        // Permanent offers (restaurants, museums) - always available
        if (activity.category === 'restaurant' || activity.category === 'museum' || 
            activity.category === 'wellness' || activity.time.toLowerCase().includes('täglich')) {
          return true;
        }
        return false;
      }
      
      // Check if event is today
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      return eventDay.getTime() === today.getTime();
    });

    console.log(`✅ Filtered to ${todayActivities.length} activities available TODAY (${today.toLocaleDateString('de-DE')})`);

    // Build AI prompt with time context
    const timeLabels: Record<string, string> = {
      morning: 'Morgen (5-12 Uhr)',
      afternoon: 'Nachmittag (12-18 Uhr)',
      evening: 'Abend (18-22 Uhr)',
      night: 'Nacht (22-5 Uhr)'
    };

    const todayDateStr = today.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

    const systemPrompt = `Du bist ein lokaler Concierge für Ingolstadt, Deutschland. 
Analysiere das aktuelle Wetter UND die Tageszeit und gib spezifische Vorschläge für JETZT - in diesem Moment!

🔴 WICHTIG: Empfehle NUR Aktivitäten die HEUTE (${todayDateStr}) stattfinden oder verfügbar sind!
Ignoriere alle Events in der Zukunft oder Vergangenheit. Keine November/Dezember Events wenn heute Oktober ist!

AKTUELLE SITUATION:
- HEUTE ist: ${todayDateStr}
- Uhrzeit: ${currentHour}:00 Uhr (${timeLabels[timeOfDay]})
- Temperatur: ${temp}°C
- Bedingung: ${condition}
- Niederschlag: ${precipitation}%
- Wind: ${windSpeed} km/h

Verfügbare Aktivitäten für HEUTE:
${JSON.stringify(todayActivities, null, 2)}

${mode === 'short' 
  ? `Erstelle eine kurze, zeitspezifische Empfehlung (1-2 Sätze) was der Gast JETZT in diesem Moment tun sollte. 
Berücksichtige die Tageszeit ${timeLabels[timeOfDay]} und das aktuelle Wetter.
NUR Aktivitäten die HEUTE verfügbar sind!
Sei konkret und handlungsorientiert!`
  : `Kategorisiere die Aktivitäten in 3 Gruppen:
1. PERFEKT FÜR HEUTE: Ideal bei diesem Wetter (5-8 Aktivitäten)
2. ALTERNATIV: Falls Wetter sich verschlechtert (3-5 Aktivitäten)  
3. FÜR MORGEN: Bei besserem Wetter (3-5 Aktivitäten)

Füge eine kurze Begründung hinzu (1 Satz).

Antworte im JSON Format:
{
  "reasoning": "Begründung",
  "categories": {
    "perfect": [{"id": "...", "title": "...", "category": "...", "description": "...", "location": "..."}],
    "alternative": [...],
    "tomorrow": [...]
  }
}`
}`;

    // Call Lovable AI (Gemini 2.5 Flash)
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
          { role: 'user', content: `Analysiere das Wetter und ${mode === 'short' ? 'gib eine kurze Empfehlung' : 'kategorisiere die Aktivitäten'}.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    console.log('🤖 AI Response:', aiMessage);

    // Parse response
    if (mode === 'short') {
      return new Response(
        JSON.stringify({
          success: true,
          shortRecommendation: aiMessage.trim()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse detailed JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = aiMessage.match(/```json\n([\s\S]*?)\n```/) || aiMessage.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiMessage;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // Fallback: return activities in simple categorization
      const isGoodWeather = temp > 15 && precipitation < 30;
      parsedResponse = {
        reasoning: `Bei ${temp}°C und ${condition} empfehlen wir ${isGoodWeather ? 'Outdoor' : 'Indoor'}-Aktivitäten.`,
        categories: {
          perfect: todayActivities.slice(0, 6),
          alternative: todayActivities.slice(6, 10),
          tomorrow: todayActivities.slice(10, 14)
        }
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        reasoning: parsedResponse.reasoning,
        categories: parsedResponse.categories,
        weather: { temp, condition, precipitation, windSpeed }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in weather-activity-recommendations:', error);
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
