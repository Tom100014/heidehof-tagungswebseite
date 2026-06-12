import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🎣 Hook Generation Edge Function started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords, tone, coreTheme } = await req.json();
    
    console.log('📝 Hook Generation Parameters:', { topic, keywords, tone, coreTheme });

    if (!topic?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Topic is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OpenAI API Key not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API Key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const effectiveTopic = coreTheme || topic;
    
    // Extrahiere Kernbegriffe aus dem Thema für bessere Hook-Relevanz
    const topicKeywords = extractTopicKeywords(topic);
    const mainConcept = extractMainConcept(topic);
    
    const hookPrompt = `Du bist ein professioneller deutscher Copywriter. Erstelle 5 thematisch EXAKT passende Hooks zum Thema "${topic}".

VOLLSTÄNDIGES THEMA: ${topic}
KERNKONZEPT: ${mainConcept}
SCHLÜSSELWÖRTER: ${topicKeywords.join(', ')}
ZUSÄTZLICHE KEYWORDS: ${keywords || 'keine'}
TONFALL: ${tone || 'ansprechend'}

WICHTIGE REGELN FÜR THEMATISCH PASSENDE HOOKS:
- Jeder Hook EXAKT 8-15 Wörter
- Perfekte deutsche Grammatik und Rechtschreibung
- DIREKT und SPEZIFISCH zum Thema "${topic}" passend
- Verwende die Kernwörter: ${topicKeywords.slice(0, 3).join(', ')}
- Emotional ansprechend aber thematisch korrekt
- Verschiedene ansprechende Ansätze

THEMATISCH PASSENDE HOOK-STILE für "${mainConcept}":
1. Neugierig: "Das sollten Sie über ${mainConcept} wissen"
2. Nutzenorientiert: "Wie ${mainConcept} Ihr Leben verbessert"
3. Geheimtipp: "Der ${mainConcept}-Insider-Tipp den keiner kennt"
4. Praktisch: "${mainConcept}: Der ultimative Guide für 2025"
5. Emotional: "Warum ${mainConcept} mehr als nur Luxus ist"

ANTWORT NUR ALS REINES JSON-ARRAY (kein Markdown, keine Erklärungen):
[
  {
    "id": "hook_1",
    "text": "Thematisch passender 8-15 Wörter Hook zu '${topic}'",
    "style": "Neugierig",
    "description": "Beschreibung der thematischen Relevanz",
    "relevance": "hoch"
  },
  {
    "id": "hook_2", 
    "text": "Thematisch passender 8-15 Wörter Hook zu '${topic}'",
    "style": "Nutzenorientiert",
    "description": "Beschreibung des praktischen Nutzens",
    "relevance": "hoch"
  },
  {
    "id": "hook_3",
    "text": "Thematisch passender 8-15 Wörter Hook zu '${topic}'",
    "style": "Geheimtipp", 
    "description": "Beschreibung der Insider-Information",
    "relevance": "hoch"
  },
  {
    "id": "hook_4",
    "text": "Thematisch passender 8-15 Wörter Hook zu '${topic}'",
    "style": "Praktisch",
    "description": "Beschreibung der praktischen Anwendung", 
    "relevance": "hoch"
  },
  {
    "id": "hook_5",
    "text": "Thematisch passender 8-15 Wörter Hook zu '${topic}'",
    "style": "Emotional",
    "description": "Beschreibung der emotionalen Verbindung",
    "relevance": "mittel"
  }
]`;

    // Hilfsfunktionen für bessere Themen-Extraktion
    function extractTopicKeywords(topic: string): string[] {
      const commonWords = ['der', 'die', 'das', 'und', 'oder', 'für', 'im', 'am', 'ein', 'eine', 'zu', 'von', 'mit', 'bei', 'auf', 'in'];
      return topic
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word))
        .slice(0, 5);
    }
    
    function extractMainConcept(topic: string): string {
      // Extrahiere das Hauptkonzept aus dem Thema
      const keywords = extractTopicKeywords(topic);
      if (keywords.length > 0) {
        return keywords[0];
      }
      return topic.split(' ').slice(0, 2).join(' ');
    }

    console.log('📤 Sending hook prompt to OpenAI...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'Du bist ein Experte für thematisch relevante, ansprechende deutsche Headlines. Erstelle Hooks die EXAKT zum gegebenen Thema passen. Antworte NUR mit validen JSON-Arrays.' 
          },
          { role: 'user', content: hookPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI API Error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API Error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    let content = openAIData.choices[0].message.content.trim();
    
    console.log('📝 OpenAI Response received:', content.substring(0, 200));

    // Robuste JSON-Bereinigung
    content = content.replace(/```json\s*/gi, '');
    content = content.replace(/```\s*/gi, '');
    content = content.replace(/^```.*$/gmi, '');
    
    // Finde JSON-Array
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']') + 1;
    
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      content = content.substring(jsonStart, jsonEnd);
    }

    try {
      const hooks = JSON.parse(content);
      
      if (Array.isArray(hooks) && hooks.length > 0) {
        // Validiere und bereinige Hooks
        const validHooks = hooks.filter(hook => {
          const hasValidStructure = hook && 
            typeof hook.id === 'string' && 
            typeof hook.text === 'string' && 
            typeof hook.style === 'string' && 
            typeof hook.description === 'string';
          
          if (!hasValidStructure) return false;
          
          const wordCount = hook.text.split(' ').length;
          const isValidLength = wordCount >= 8 && wordCount <= 15;
          
          return hasValidStructure && isValidLength;
        }).map(hook => ({
          ...hook,
          relevance: hook.relevance || hook.controversy || 'hoch'
        }));
        
        if (validHooks.length >= 3) {
          console.log('✅ Generated valid hooks:', validHooks.length);
          return new Response(
            JSON.stringify({ 
              success: true, 
              hooks: validHooks.slice(0, 5),
              count: validHooks.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Fallback hooks basierend auf tatsächlichem Thema
      console.log('🔄 Using thematic fallback hooks for topic:', topic);
      const topicKeywords = extractTopicKeywords(topic);
      const mainConcept = extractMainConcept(topic);
      
      const fallbackHooks = [
        {
          id: 'fallback_1',
          text: `${mainConcept}: Das sollten Sie unbedingt wissen`,
          style: 'Informativ',
          description: 'Weckt Interesse am Hauptthema',
          relevance: 'hoch'
        },
        {
          id: 'fallback_2',
          text: `Die besten ${mainConcept}-Tipps für 2025`,
          style: 'Praktisch',
          description: 'Bietet praktischen Nutzen',
          relevance: 'hoch'
        },
        {
          id: 'fallback_3',
          text: `${mainConcept}: Ihr ultimativer Guide`,
          style: 'Umfassend',
          description: 'Verspricht vollständige Information',
          relevance: 'hoch'
        }
      ];
      
      // Hilfsfunktionen für bessere Themen-Extraktion (falls nicht bereits definiert)
      function extractTopicKeywords(topic: string): string[] {
        const commonWords = ['der', 'die', 'das', 'und', 'oder', 'für', 'im', 'am', 'ein', 'eine', 'zu', 'von', 'mit', 'bei', 'auf', 'in'];
        return topic
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3 && !commonWords.includes(word))
          .slice(0, 5);
      }
      
      function extractMainConcept(topic: string): string {
        // Extrahiere das Hauptkonzept aus dem Thema
        const keywords = extractTopicKeywords(topic);
        if (keywords.length > 0) {
          return keywords[0];
        }
        return topic.split(' ').slice(0, 2).join(' ');
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          hooks: fallbackHooks,
          fallback: true,
          count: fallbackHooks.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Problematic content:', content);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }

  } catch (error) {
    console.error('❌ Hook generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Hook generation failed' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});