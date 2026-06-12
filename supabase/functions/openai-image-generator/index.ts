import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 DALL-E 3 Edge Function gestartet');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('📥 Request Body:', JSON.stringify(requestBody, null, 2));

    const { prompt, width = 1024, height = 1024, quality = 'standard', category = 'general' } = requestBody;

    if (!prompt) {
      console.error('❌ Kein Prompt angegeben');
      return new Response(
        JSON.stringify({ success: false, error: 'Prompt erforderlich' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('🔑 OpenAI API Key vorhanden:', openAIApiKey ? 'JA' : 'NEIN');
    
    if (!openAIApiKey) {
      console.error('❌ OpenAI API Key fehlt');
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API Key nicht konfiguriert' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Kategorie-spezifische Prompt-Verbesserungen
    const categoryEnhancements: Record<string, string> = {
      shop: "Professional e-commerce product photography, clean white background, studio lighting, commercial quality, crisp details",
      blog: "Professional blog header image, modern design, web-optimized, editorial style, high quality",
      restaurant: "Professional food photography, appetizing presentation, studio lighting, elegant plating, gourmet style",
      bar: "Professional beverage photography, atmospheric lighting, sophisticated presentation, luxury bar setting",
      beauty: "Luxury spa and wellness photography, clean aesthetic, serene atmosphere, premium quality",
      hotel: "Elegant hospitality photography, inviting atmosphere, premium quality, luxury hotel style",
      general: "Professional high-quality photography, clean composition, modern style"
    };

    const enhancement = categoryEnhancements[category] || categoryEnhancements.general;
    const finalPrompt = `${prompt}. ${enhancement}. Ultra high resolution, detailed, crisp, no text, no labels, no logos in the image.`;

    console.log('📝 Kategorie:', category);
    console.log('📝 Finaler Prompt:', finalPrompt);

    // Bestimme optimale Bildgröße für DALL-E 3
    let imageSize = '1024x1024';
    if (width === 1200 && height === 630) {
      imageSize = '1792x1024'; // Blog header format
    } else if (width > height) {
      imageSize = '1792x1024'; // Landscape
    } else if (height > width) {
      imageSize = '1024x1792'; // Portrait
    }

    console.log('📐 Bildgröße:', imageSize);
    console.log('🔄 Rufe OpenAI DALL-E 3 API auf...');

    const openAIResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: 1,
        size: imageSize,
        quality: quality === 'high' || quality === 'hd' ? 'hd' : 'standard',
        style: 'natural'
      }),
    });

    console.log('📡 OpenAI Response Status:', openAIResponse.status);

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI API Fehler:', openAIResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `OpenAI API Fehler: ${openAIResponse.status} - ${errorText}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const openAIData = await openAIResponse.json();
    console.log('📦 OpenAI Response Data:', JSON.stringify(openAIData, null, 2));
    
    if (!openAIData.data?.[0]?.url) {
      console.error('❌ Keine Bild-URL in der OpenAI Antwort');
      return new Response(
        JSON.stringify({ success: false, error: 'Keine Bild-URL von OpenAI erhalten' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const imageUrl = openAIData.data[0].url;
    console.log('✅ DALL-E 3 Bild erfolgreich generiert:', imageUrl);

    const successResponse = {
      success: true, 
      image: imageUrl,
      imageUrl: imageUrl,
      model: 'dall-e-3',
      prompt: finalPrompt,
      category: category,
      size: imageSize,
      quality: quality
    };

    console.log('🎉 Erfolgreiche Antwort:', JSON.stringify(successResponse, null, 2));

    return new Response(
      JSON.stringify(successResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Edge Function Fehler:', error);
    console.error('Error Details:', error.message);
    console.error('Error Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Server Fehler: ${error.message}`,
        details: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});