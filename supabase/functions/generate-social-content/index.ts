
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, platform, style } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const platformPrompts = {
      instagram: {
        maxLength: 2200,
        style: 'Visuell ansprechend, mit Emojis, hashtag-freundlich',
        hashtags: '#heidehof #hotel #luxury #wellness #heide #entspannung #urlaub #spa'
      },
      pinterest: {
        maxLength: 500,
        style: 'Beschreibend, SEO-optimiert, inspirierend',
        hashtags: '#heidehof #hoteldesign #wellnesshotel #luxushotel #heide #entspannung'
      },
      facebook: {
        maxLength: 1000,
        style: 'Persönlich, einladend, community-orientiert',
        hashtags: '#heidehof #hotel #wellness #urlaub #entspannung'
      }
    };

    const currentPlatform = platformPrompts[platform] || platformPrompts.instagram;

    const prompt = `
Erstelle einen professionellen Social Media Post für das Hotel Heidehof zum Thema: "${topic}"

Plattform: ${platform}
Stil: ${style} und ${currentPlatform.style}
Maximale Länge: ${currentPlatform.maxLength} Zeichen

Der Post soll:
- Luxuriös und einladend wirken
- Die Einzigartigkeit des Hotel Heidehof betonen
- Emotionen wecken und zum Buchen motivieren
- Professionell aber nicht steif sein

Erstelle auch einen passenden Bild-Prompt für KI-Generierung und passende Hashtags.

Format:
{
  "text": "Post-Text hier",
  "imagePrompt": "Detaillierter Prompt für Bildgenerierung",
  "hashtags": "Hashtags getrennt durch Leerzeichen"
}
`;

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
            content: 'Du bist ein Experte für Social Media Marketing für Luxushotels. Erstelle ansprechende, professionelle Posts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate content');
    }

    try {
      const result = JSON.parse(data.choices[0].message.content);
      
      return new Response(JSON.stringify({
        text: result.text,
        imagePrompt: result.imagePrompt,
        hashtags: result.hashtags || currentPlatform.hashtags
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const content = data.choices[0].message.content;
      return new Response(JSON.stringify({
        text: content,
        imagePrompt: `Professional hotel photography: ${topic}, luxury interior, warm lighting, elegant atmosphere`,
        hashtags: currentPlatform.hashtags
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error generating social content:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
