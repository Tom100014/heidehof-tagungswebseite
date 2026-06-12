
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Blog Content Generator v6.0:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      topic, 
      keywords, 
      contentType, 
      tone, 
      wordCount, 
      targetAudience, 
      customInstructions,
      provider = 'openai'
    } = await req.json();
    
    console.log('📝 Generiere Blog-Content mit:', {
      topic: topic?.substring(0, 50),
      provider,
      contentType,
      tone,
      wordCount
    });

    let generatedContent = '';
    
    // Fallback Chain: OpenAI -> Perplexity -> Hugging Face
    try {
      console.log(`🎯 Trying primary provider: ${provider}`);
      
      if (provider === 'openai') {
        generatedContent = await generateWithOpenAI({
          topic, keywords, contentType, tone, wordCount, targetAudience, customInstructions
        });
      } else if (provider === 'perplexity') {
        generatedContent = await generateWithPerplexity({
          topic, keywords, contentType, tone, wordCount, targetAudience, customInstructions
        });
      } else if (provider === 'huggingface') {
        generatedContent = await generateWithHuggingFace({
          topic, keywords, contentType, tone, wordCount, targetAudience, customInstructions
        });
      } else {
        throw new Error(`Unbekannter Provider: ${provider}`);
      }
    } catch (primaryError) {
      console.warn(`⚠️ Primary provider ${provider} failed:`, primaryError.message);
      
      // Try OpenAI fallback if not already primary
      if (provider !== 'openai') {
        try {
          console.log('🔄 Fallback zu OpenAI...');
          generatedContent = await generateWithOpenAI({
            topic, keywords, contentType, tone, wordCount, targetAudience, customInstructions
          });
        } catch (openaiError) {
          console.warn('⚠️ OpenAI fallback failed:', openaiError.message);
          
          // Try Perplexity fallback if available
          if (provider !== 'perplexity') {
            try {
              console.log('🔄 Fallback zu Perplexity...');
              generatedContent = await generateWithPerplexity({
                topic, keywords, contentType, tone, wordCount, targetAudience, customInstructions
              });
            } catch (perplexityError) {
              console.warn('⚠️ Perplexity fallback failed:', perplexityError.message);
              throw primaryError; // Throw original error
            }
          } else {
            throw primaryError;
          }
        }
      } else {
        // Try Perplexity fallback
        try {
          console.log('🔄 Fallback zu Perplexity...');
          generatedContent = await generateWithPerplexity({
            topic, keywords, contentType, tone, wordCount, targetAudience, customInstructions
          });
        } catch (perplexityError) {
          console.warn('⚠️ Perplexity fallback failed:', perplexityError.message);
          throw primaryError;
        }
      }
    }

    if (!generatedContent) {
      throw new Error('Kein Content generiert');
    }

    console.log('✅ Blog-Content erfolgreich generiert:', generatedContent.substring(0, 200));

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        provider,
        topic,
        contentType
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Blog Content Generation fehlgeschlagen:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback: generateFallbackContent(topic, keywords)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Perplexity AI Blog Generation
const generateWithPerplexity = async (params) => {
  console.log('🧠 Verwende Perplexity AI für aktuellen Content...');
  
  const prompt = buildMasterPrompt(params);
  
  const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein professioneller Blog-Autor für Hotel "Der Heidehof" in Geimersheim bei Ingolstadt, Bayern. Erstelle hochwertige, SEO-optimierte Artikel mit lokalem GEO-Fokus auf Ingolstadt, Geimersheim und Umgebung.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
      top_p: 0.9
    }),
  });

  if (!perplexityResponse.ok) {
    const errorText = await perplexityResponse.text();
    console.error('❌ Perplexity API Fehler:', errorText);
    throw new Error(`Perplexity API Fehler: ${perplexityResponse.status}`);
  }

  const perplexityData = await perplexityResponse.json();
  
  if (!perplexityData.choices?.[0]?.message?.content) {
    throw new Error('Keine Inhalte von Perplexity erhalten');
  }

  return perplexityData.choices[0].message.content;
};

// OpenAI Blog Generation
const generateWithOpenAI = async (params) => {
  console.log('🤖 Verwende OpenAI für Blog-Content...');
  
  const prompt = buildMasterPrompt(params);
  
  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein professioneller Blog-Autor für Hotel "Der Heidehof" in Geimersheim bei Ingolstadt, Bayern. Erstelle hochwertige, SEO-optimierte Artikel mit lokalem GEO-Fokus auf Ingolstadt, Geimersheim und Umgebung. Integriere lokale Keywords und regionale Bezüge natürlich in den Content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    }),
  });

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text();
    console.error('❌ OpenAI API Fehler:', errorText);
    throw new Error(`OpenAI API Fehler: ${openaiResponse.status}`);
  }

  const openaiData = await openaiResponse.json();
  
  if (!openaiData.choices?.[0]?.message?.content) {
    throw new Error('Keine Inhalte von OpenAI erhalten');
  }

  return openaiData.choices[0].message.content;
};

// Hugging Face Blog Generation
const generateWithHuggingFace = async (params) => {
  console.log('🤗 Verwende Hugging Face für kostenlosen Content...');
  
  const prompt = buildMasterPrompt(params);
  
  const hfResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('HUGGINGFACE_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false
      }
    }),
  });

  if (!hfResponse.ok) {
    const errorText = await hfResponse.text();
    console.error('❌ Hugging Face API Fehler:', errorText);
    throw new Error(`Hugging Face API Fehler: ${hfResponse.status}`);
  }

  const hfData = await hfResponse.json();
  
  if (!hfData?.[0]?.generated_text) {
    throw new Error('Keine Inhalte von Hugging Face erhalten');
  }

  return hfData[0].generated_text;
};

// Master Prompt Builder mit automatischer Heidehof-Integration
const buildMasterPrompt = (params) => {
  const { topic, keywords, contentType, tone, wordCount, targetAudience, customInstructions } = params;
  
  // Automatische Heidehof-Integration basierend auf dem Thema
  const heidehofIntegration = generateSmartHeidehofIntegration(topic);
  
  return `Erstelle einen professionellen Blog-Artikel für Hotel "Der Heidehof" in Geimersheim bei Ingolstadt, Bayern.

🎯 GEO-TARGETING (PRIORITÄT):
- Hauptstandort: Geimersheim bei Ingolstadt, Bayern
- Zielregion: Ingolstadt, Neuburg, Pfaffenhofen, Eichstätt, Donau-Isar-Region
- Lokale SEO-Keywords: "Geimersheim", "Ingolstadt", "Bayern", "Donau", "Audi-Stadt"

THEMA: ${topic}
KEYWORDS: ${keywords}
CONTENT-TYP: ${contentType}
TONFALL: ${tone}
WORTANZAHL: ${wordCount} Wörter
ZIELGRUPPE: ${targetAudience}

ZUSÄTZLICHE ANWEISUNGEN:
${customInstructions || 'Fokus auf lokale Relevanz und GEO-SEO für Geimersheim/Ingolstadt'}

HEIDEHOF-INTEGRATION (WICHTIG):
${heidehofIntegration}

GEO-SEO ANFORDERUNGEN:
1. Verwende "Geimersheim bei Ingolstadt" mindestens 3x im Text
2. Erwähne lokale Sehenswürdigkeiten: Audi Forum, Kreuztor, Donau
3. Regionale Bezüge: Bayern, Oberbayern, Donau-Isar-Region
4. Lokale Events und Termine wenn relevant
5. Entfernungsangaben zu wichtigen Städten (München 80km, Nürnberg 90km)

TECHNISCHE SEO:
1. Verwende aktuelle und relevante Informationen
2. Integriere "Der Heidehof" charmant und natürlich
3. SEO-optimierte Struktur mit H2/H3-Überschriften
4. Lokale Keywords natürlich einbauen
5. Emotionale und ansprechende Sprache
6. Klare Call-to-Actions mit Geimersheim-Bezug
7. Schema.org LocalBusiness relevante Infos

WICHTIG: Füge KEINE technischen SEO-Kommentare oder Meta-Beschreibungen am Ende des Artikels hinzu. Der Artikel soll nur den eigentlichen Content enthalten, ohne interne Notizen oder Analysen!

HEIDEHOF-STIL:
- Charmant und witzig, aber nie übertrieben
- Ehrlich: "Wir können nicht alles, aber..."
- Starke regionale Verbindung zu Geimersheim/Ingolstadt
- Authentische Empfehlungen nur für das, was wirklich geboten wird
- Lokale Insidertipps und Perspektiven

STRUKTUR:
- Hook-Einstieg mit Geimersheim/Ingolstadt-Bezug
- 3-4 Hauptabschnitte mit lokalen H2-Überschriften
- Praktische Tipps mit regionalem Fokus
- Natürliche Heidehof-Integration mit Standort-Erwähnung
- Abschluss mit lokalem Call-to-Action

Erstelle jetzt den vollständigen GEO-optimierten Blog-Artikel für Geimersheim bei Ingolstadt:`;
};

// Intelligente Heidehof-Integration basierend auf Thema
const generateSmartHeidehofIntegration = (topic) => {
  const topicLower = topic?.toLowerCase() || '';
  
  // Verschiedene Integrationsansätze je nach Thema
  if (topicLower.includes('wellness') || topicLower.includes('spa') || topicLower.includes('entspannung')) {
    return `Der Heidehof-Bezug: "Während wir im Heidehof kein großes Spa-Resort sind, bieten wir eine intime Wellness-Atmosphäre in zentraler Ingolstädter Lage. Was uns auszeichnet, ist die persönliche Betreuung und die Ruhe, die man in unseren komfortablen Räumen findet."`;
  }
  
  if (topicLower.includes('business') || topicLower.includes('tagung') || topicLower.includes('meeting')) {
    return `Der Heidehof-Bezug: "Der Heidehof ist zwar kein Kongresszentrum, dafür aber der perfekte Ort für kleinere Business-Gespräche in entspannter Atmosphäre. Unsere zentrale Lage in Ingolstadt macht uns zum idealen Ausgangspunkt für Geschäftstermine in der Region."`;
  }
  
  if (topicLower.includes('restaurant') || topicLower.includes('essen') || topicLower.includes('gastronomie')) {
    return `Der Heidehof-Bezug: "Wir haben zwar kein Hauben-Restaurant, aber unser Maxwell's und die Bar Max bieten ehrliche, gute Küche in gemütlicher Atmosphäre. Was bei uns zählt, ist die Qualität der Zutaten und die Herzlichkeit des Services."`;
  }
  
  if (topicLower.includes('ingolstadt') || topicLower.includes('geimersheim') || topicLower.includes('bayern') || topicLower.includes('münchen')) {
    return `Der Heidehof-Bezug: "Der Heidehof in Geimersheim bei Ingolstadt ist der perfekte Ausgangspunkt, um die Donau-Isar-Region zu erkunden. Was uns besonders macht, ist unsere tiefe lokale Verwurzelung - wir kennen die schönsten Ecken zwischen Ingolstadt und der Donau und geben gerne authentische Insidertipps."`;
  }
  
  if (topicLower.includes('hotel') || topicLower.includes('übernachtung') || topicLower.includes('zimmer')) {
    return `Der Heidehof-Bezug: "Der Heidehof ist kein Luxusresort, aber ein charmantes Stadthotel mit Seele. Was uns auszeichnet, ist die persönliche Atmosphäre - bei uns sind Sie Gast, nicht nur Zimmernummer."`;
  }
  
  // Standard-Integration für alle anderen Themen
  return `Der Heidehof-Bezug: "Im Hotel Der Heidehof in Geimersheim bei Ingolstadt verstehen wir, dass nicht jeder Gast die gleichen Bedürfnisse hat. Wir können nicht alles bieten, aber was wir haben, machen wir mit Leidenschaft und tiefer regionaler Verbundenheit zur Donau-Isar-Region."`;
};

// Fallback Content Generator
const generateFallbackContent = (topic, keywords) => {
  const safeDefaults = {
    topic: topic || 'Wellness und Entspannung im Der Heidehof',
    keywords: keywords || 'Hotel, Geimersheim, Ingolstadt, Bayern'
  };
  
  return `
# ${safeDefaults.topic}

Willkommen zu einem besonderen Erlebnis im Hotel "Der Heidehof" in Geimersheim bei Ingolstadt, Bayern.

## Einleitung

${topic || 'Wellness und Entspannung'} sind wichtige Aspekte für einen erholsamen Aufenthalt. In unserem Hotel bieten wir Ihnen die perfekte Kombination aus Komfort und Service.

## Unsere Angebote

Im Der Heidehof erwarten Sie:
- Komfortable Zimmer und Suiten
- Exzellenter Service
- Zentrale Lage in Ingolstadt
- Persönliche Betreuung

## Der Heidehof-Charme

Wir können nicht alles bieten, aber was wir haben, machen wir mit Herzblut und regionaler Verbundenheit. Der Heidehof ist mehr als nur ein Hotel - es ist Ihr Zuhause auf Zeit in Ingolstadt.

## Keywords Integration

${keywords ? `Relevante Themen: ${keywords}` : 'Entdecken Sie unsere vielfältigen Angebote'}

## Fazit

Buchen Sie noch heute Ihren Aufenthalt im Der Heidehof und erleben Sie Gastlichkeit auf höchstem Niveau mit dem charmanten Touch eines echten Ingolstädter Stadthotels.

*Generiert als Fallback-Content mit automatischer Heidehof-Integration*
  `;
};
