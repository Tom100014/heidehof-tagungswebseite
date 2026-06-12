
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, contentType } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate keywords and description using OpenAI
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
            content: `Du bist ein Experte für Hotel- und Gastronomie-Marketing. Generiere für Blog-Artikel relevante Keywords und Beschreibungen. 
            
            Antworte immer im folgenden JSON-Format:
            {
              "keywords": ["keyword1", "keyword2", ...],
              "description": "Beschreibung des Themas in 2-3 Sätzen"
            }
            
            Keywords sollen:
            - 5-10 relevante Begriffe umfassen
            - SEO-optimiert sein
            - Haupt- und Nebenkeywords enthalten
            - Für die Hotel-/Gastronomiebranche relevant sein
            
            Beschreibung soll:
            - 2-3 prägnante Sätze
            - Informativ und ansprechend
            - Für Blog-Artikel geeignet sein`
          },
          {
            role: 'user',
            content: `Thema: "${topic}"
            Content-Typ: ${contentType}
            
            Generiere passende Keywords und eine Beschreibung für einen Blog-Artikel zu diesem Thema.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API Error:', response.status, response.statusText);
      return new Response(JSON.stringify({ error: 'Failed to generate content' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', generatedContent);
      return new Response(JSON.stringify({ error: 'Invalid response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generated keywords and description for topic:', topic);
    
    return new Response(JSON.stringify({
      keywords: parsedContent.keywords || [],
      description: parsedContent.description || '',
      topic: topic
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-topic-keywords function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
