
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
    const { prompt, style, platform } = await req.json();
    
    const platformSpecs = {
      instagram: { width: 1080, height: 1080 },
      pinterest: { width: 1000, height: 1500 },
      facebook: { width: 1200, height: 630 },
      linkedin: { width: 1200, height: 627 },
      twitter: { width: 1200, height: 675 }
    };

    const specs = platformSpecs[platform] || platformSpecs.instagram;
    
    // Enhanced prompt for hotel content
    const enhancedPrompt = `
Professional luxury hotel photography: ${prompt}
Style: ${style || 'elegant and sophisticated'}
High-end hospitality, warm lighting, premium quality, 
elegant interior design, sophisticated atmosphere,
luxurious details, inviting ambiance, professional photography,
no text overlay, clean composition, hotel branding appropriate.
4K quality, sharp details, perfect lighting.
`;

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY nicht konfiguriert');
      throw new Error('Gemini API Key nicht konfiguriert');
    }

    // Call Gemini AI for image generation
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        config: {
          aspectRatio: specs.width > specs.height ? 'LANDSCAPE' : specs.width < specs.height ? 'PORTRAIT' : 'SQUARE',
          safetyFilterLevel: 'BLOCK_ONLY_HIGH',
          personGeneration: 'ALLOW_ADULT'
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API request failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const imageBase64 = geminiData.generatedImages[0].imageBase64;
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('Generated image with Gemini AI');

    return new Response(JSON.stringify({
      success: true,
      imageUrl: imageUrl,
      platform: platform,
      dimensions: specs
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating social image:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
