
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🎨 REPARIERTER Hero-Bild Generator v5.0:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, topic, contentType } = await req.json();
    
    console.log('📸 Generiere Hero-Bild für:', {
      topic: topic?.substring(0, 50),
      contentType,
      prompt: prompt?.substring(0, 100) + '...'
    });

    // UPDATED: Verwende Gemini AI statt Pollinations für bessere Hero-Bilder
    const optimizedPrompt = `Professional, high-quality blog hero image about "${topic}". 
    Modern, clean design. Premium photography style. 
    Content type: ${contentType}. 
    Suitable for web header, 16:9 aspect ratio. 
    No text overlay, professional lighting, sophisticated composition.
    High resolution, hotel industry style if relevant.
    ${prompt}`;

    console.log('🎯 Verwende Gemini AI mit Prompt:', optimizedPrompt.substring(0, 200));

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
        prompt: optimizedPrompt,
        config: {
          aspectRatio: 'LANDSCAPE',
          safetyFilterLevel: 'BLOCK_ONLY_HIGH',
          personGeneration: 'ALLOW_ADULT'
        }
      })
    });

    if (!geminiResponse.ok) {
      console.error('❌ Gemini API Fehler:', geminiResponse.status);
      throw new Error(`Gemini API request failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();

    if (!geminiData.generatedImages || geminiData.generatedImages.length === 0) {
      throw new Error('Keine Bilder von Gemini AI erhalten');
    }

    const imageBase64 = geminiData.generatedImages[0].imageBase64;
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    console.log('✅ Hero-Bild erfolgreich mit Gemini AI generiert');

    return new Response(
      JSON.stringify({
        success: true,
        image: imageUrl,
        topic,
        contentType,
        source: 'gemini-ai',
        format: 'png',
        size: '1200x675'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Hero-Bild Generation fehlgeschlagen:', error);
    
    // REPARIERT: Besseres Fallback-System mit themenrelevanten Bildern
    const topicKeywords = (topic || '').toLowerCase();
    let fallbackImage = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=675&fit=crop&q=80';
    
    if (topicKeywords.includes('porsche') || topicKeywords.includes('auto') || topicKeywords.includes('car')) {
      fallbackImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=675&fit=crop&q=80';
    } else if (topicKeywords.includes('wellness') || topicKeywords.includes('spa') || topicKeywords.includes('hotel')) {
      fallbackImage = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=675&fit=crop&q=80';
    } else if (topicKeywords.includes('technology') || topicKeywords.includes('tech')) {
      fallbackImage = 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=675&fit=crop&q=80';
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        image: fallbackImage,
        topic,
        contentType,
        source: 'unsplash-fallback',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
