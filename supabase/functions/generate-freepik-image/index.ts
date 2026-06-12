import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== OpenAI Image Generation für Menu Cards Started ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY not configured');
      throw new Error('OPENAI_API_KEY not configured');
    }

    const requestBody = await req.json();
    const { prompt, width = 1024, height = 1024, quality = 'standard', category = 'menu' } = requestBody;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('📝 Menu Card Prompt:', prompt);

    // Enhance prompt for professional food photography
    const enhancedPrompt = `Professional food photography: ${prompt}. High-end restaurant presentation, perfect lighting, elegant plating, appetizing colors, clean background, commercial quality, no text overlay, 4K resolution.`;

    // Map dimensions to valid DALL-E 3 sizes
    let size = '1024x1024';
    if (width === 1792 || height === 1792) {
      size = width > height ? '1792x1024' : '1024x1792';
    }

    // Call OpenAI DALL-E 3 API
    const openAIResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: quality === 'hd' ? 'hd' : 'standard',
        response_format: 'url'
      }),
    });

    console.log('OpenAI Response Status:', openAIResponse.status);

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI API Error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API Error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIResult = await openAIResponse.json();
    console.log('✅ OpenAI Response received');

    if (!openAIResult.data || !openAIResult.data[0]) {
      throw new Error('No image data received from OpenAI');
    }

    const imageUrl = openAIResult.data[0].url;
    
    if (!imageUrl) {
      throw new Error('No image URL received from OpenAI');
    }

    console.log('✅ Menu Card Bild erfolgreich generiert');

    const successResponse = {
      success: true,
      image: imageUrl,
      imageUrl: imageUrl,
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      category: category,
      message: 'Menu card image generated successfully with OpenAI DALL-E 3'
    };

    return new Response(
      JSON.stringify(successResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('=== Menu Card Image Generation FEHLER ===');
    console.error('Error:', error);

    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      message: 'Menu card image generation failed'
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});