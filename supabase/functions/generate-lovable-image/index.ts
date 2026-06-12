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
    const { prompt, width = 1200, height = 630 } = await req.json();

    if (!prompt) {
      throw new Error('Prompt ist erforderlich');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY ist nicht konfiguriert');
    }

    console.log('🎨 Generiere Bild mit Lovable AI (Nano Banana)...');

    // Lovable AI Gateway mit Nano Banana Model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Generate a professional, high-quality image: ${prompt}. IMPORTANT: No text, no labels, no logos in the image.`
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI Gateway Fehler:', response.status, errorText);
      throw new Error(`Lovable AI Gateway Fehler: ${response.status}`);
    }

    const data = await response.json();
    
    // Extrahiere das Bild aus der Antwort
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('❌ Keine Bild-URL in Antwort gefunden');
      throw new Error('Keine Bild-URL in Antwort');
    }

    console.log('✅ Bild erfolgreich mit Lovable AI generiert');

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        provider: 'lovable-ai'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Fehler in generate-lovable-image:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
