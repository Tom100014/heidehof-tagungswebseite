import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🎨 Gemini AI Image Generator v1.0:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, width, height, style, aspectRatio, negativePrompt } = await req.json();
    
    console.log('🖼️ Generiere Bild mit Gemini AI:', {
      prompt: prompt?.substring(0, 100),
      style,
      dimensions: `${width}x${height}`
    });

    // Get Lovable API key from secrets (auto-configured)
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('❌ LOVABLE_API_KEY nicht konfiguriert');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Lovable API Key nicht konfiguriert' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Optimize prompt for image generation
    const optimizedPrompt = `${prompt}. Professional high-quality image, ${style || 'photographic'} style, crisp details, excellent composition, proper lighting. ${negativePrompt ? `Avoid: ${negativePrompt}` : ''}`;

    console.log('🎯 Optimierter Prompt für Gemini:', optimizedPrompt.substring(0, 200));

    // Call Lovable AI Gateway for Gemini image generation
    const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: optimizedPrompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Lovable AI Gateway Fehler:', geminiResponse.status, errorText);
      throw new Error(`Lovable AI Gateway request failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('📸 Gemini AI Antwort erhalten');

    // Extract image from chat completion response
    const images = geminiData.choices?.[0]?.message?.images;
    if (!images || images.length === 0) {
      console.error('❌ Keine Bilder von Gemini AI erhalten');
      throw new Error('Keine Bilder generiert');
    }

    // Get the first generated image
    const imageUrl = images[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('❌ Kein Bild-URL von Gemini AI erhalten');
      throw new Error('Ungültiges Bildformat');
    }
    
    console.log('✅ Bild erfolgreich mit Gemini AI generiert');

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: imageUrl,
        source: 'gemini-ai',
        format: 'png',
        size: `${width}x${height}`,
        style: style || 'photographic'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Gemini AI Bildgenerierung fehlgeschlagen:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Gemini AI Bildgenerierung fehlgeschlagen',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});