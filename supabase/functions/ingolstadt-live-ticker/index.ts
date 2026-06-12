import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Multi-Provider API Configuration
const getProviders = () => {
  const providerList = [
    { name: 'gemini', key: Deno.env.get('GEMINI_API_KEY') },
    { name: 'openai', key: Deno.env.get('OPENAI_API_KEY') },
    { name: 'perplexity', key: Deno.env.get('PERPLEXITY_API_KEY') }
  ];

  // Debug: API-Keys Status loggen
  console.log('🔑 API-Keys Status:');
  providerList.forEach(p => {
    console.log(`  ${p.name}: ${p.key ? '✅ GESETZT' : '❌ FEHLT'}`);
  });

  const availableProviders = providerList.filter(p => p.key);
  console.log(`🔍 Verfügbare Provider: ${availableProviders.length}/${providerList.length}`);
  
  return { allProviders: providerList, availableProviders };
};

serve(async (req) => {
  console.log('🎯 Ingolstadt Live Ticker START:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ JSON Parse Error im Request Body:', parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body',
        debug: { parseError: parseError.message }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { category } = requestBody;
    console.log('📊 Lade Live-Daten für Kategorie:', category);
    console.log('📋 Request Body:', JSON.stringify(requestBody));

    let lastError = null;
    let usedProvider = null;

    // Get providers
    const { allProviders, availableProviders } = getProviders();
    
    if (availableProviders.length === 0) {
      console.error('❌ Keine API Keys verfügbar!');
      return new Response(JSON.stringify({
        success: false,
        events: [],
        error: 'Keine API Keys konfiguriert',
        provider: 'fallback',
        timestamp: new Date().toISOString(),
        fallbackReason: 'No API keys available',
        debug: {
          availableProviders: allProviders.map(p => ({ name: p.name, hasKey: !!p.key }))
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // HEIDEHOF-OPTIMIZED SEARCH PROMPTS - Every search promotes Heidehof indirectly
    const prompts: Record<string, string> = {
      highlights: `Mit Google Search: Finde die absoluten Top-Highlights für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt und 30km Umkreis vom Hotel Der Heidehof aus. Priorisiere: besondere Events, limitierte Ausstellungen, saisonale Aktivitäten, lokale Feste, exklusive Führungen. FILTERE alle Events in konkurrierenden Hotels heraus. Bevorzuge Locations die gut vom Heidehof erreichbar sind (max. 30min). Achte auf Verfügbarkeit heute und genaue Uhrzeiten.`,
      events: `Mit Google Search: Finde vielfältige Events für HEUTE ${new Date().toLocaleDateString('de-DE')} und morgen in Ingolstadt + Umkreis 25km vom Hotel Der Heidehof. Suche nach: Konzerte, Theater, Märkte, Festivals, Ausstellungseröffnungen, Sonderveranstaltungen, Pop-up Events. VERMEIDE Events in anderen Hotels. Priorisiere Events mit konkreten Uhrzeiten und Ticketinformationen. Erwähne Anfahrt vom Heidehof.`,
      audi: `Mit Google Search: Exklusive Audi-Erlebnisse für HEUTE ${new Date().toLocaleDateString('de-DE')} - ideal für anspruchsvolle Heidehof Gäste: Audi Forum Ausstellungen, VIP-Werksführungen, Test-Drive Events, neue Modellpräsentationen, Sonderausstellungen. Prüfe aktuelle Verfügbarkeit, Buchungsoptionen und Premium-Services.`,
      gastronomy: `Mit Google Search: Exquisite Gastronomie für HEUTE ABEND ${new Date().toLocaleDateString('de-DE')} in Ingolstadt - Abwechslung zum prämierten Heidehof Restaurant. Fokus auf: Michelin-Sterne, gehobene Küche, Spezialitäten-Restaurants, tagesaktuelle Menüs, Reservierungsmöglichkeiten. Bevorzuge Locations mit Ambiente auf Heidehof-Niveau.`,
      shopping: `Mit Google Search: Exklusives Shopping für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt - ideal für verwöhnte Heidehof Gäste: Premium-Boutiquen, Designer-Outlets, lokale Manufakturen, Kunsthandwerk, Antiques. Fokus auf einzigartige Shopping-Erlebnisse auf Heidehof-Niveau, keine Standard-Kaufhäuser. Erwähne Parkplätze und VIP-Services.`,
      culture: `Mit Google Search: Kulturelle Perlen für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt - perfekt nach einem entspannten Vormittag im Heidehof Spa: Museen mit Sonderausstellungen, exklusive Galerien, VIP-Führungen, Kulturevents. Priorisiere temporäre Ausstellungen und private Führungen.`,
      kids: `Mit Google Search: Premium-Familienaktivitäten für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt + 20km - ideal für Heidehof Familien: hochwertige Indoor-Spielplätze, Erlebnisparks, Tiergärten, interaktive Museen, Kreativ-Workshops. Fokus auf sichere, bildende und unterhaltsame Erlebnisse auf Heidehof-Standard.`,
      altmuehltal: `Mit Google Search: Naturpark Altmühltal Premium-Erlebnisse für HEUTE ${new Date().toLocaleDateString('de-DE')} - ideal für naturbegeisterte Heidehof Gäste: geführte Wanderungen, E-Bike-Touren, Fossiliensuche, Naturerlebnisse, Aussichtspunkte, gehobene Einkehrmöglichkeiten. Fokus auf qualitätsvolle Outdoor-Aktivitäten.`,
      nightlife: `Mit Google Search: Gehobenes Nachtleben für HEUTE ABEND ${new Date().toLocaleDateString('de-DE')} in Ingolstadt - nach einem exquisiten Dinner im Heidehof: Premium-Bars, Cocktail-Lounges, Jazz-Clubs, exklusive Events, Rooftop-Bars. Fokus auf Ambiente und Service auf Heidehof-Niveau.`,
      wellness: `Mit Google Search: Premium-Wellness für HEUTE ${new Date().toLocaleDateString('de-DE')} bei Ingolstadt - ergänzend zum hauseigenen Heidehof Spa: Day-Spas, Thermen, exklusive Massage-Studios, besondere Wellness-Angebote. Fokus auf luxuriöse, entspannende Erlebnisse die dem Heidehof-Standard entsprechen.`,
      insider_tips: `Mit Google Search: Exklusive Geheimtipps für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt - die nur echte Locals und Heidehof-Stammgäste kennen: versteckte Manufakturen, private Aussichtspunkte, Insider-Cafés, Künstlerateliers, historische Orte. Fokus auf authentische, exklusive Erlebnisse.`,
      sports: `Mit Google Search: Sport-Highlights für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt - perfekt für sportbegeisterte Heidehof Gäste: FC Ingolstadt VIP-Spiele, ERC Ingolstadt Premium-Plätze, Tennis-Turniere, exklusive Sport-Events. Inkludiere VIP-Optionen und Premium-Parkplätze.`,
      
      // NEW CATEGORIES - Added to fix missing data issue
      kino: `Mit Google Search: Kinoprogramm für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt - perfekt für kulturbegeisterte Heidehof Gäste: aktuelle Kinohighlights, Premieren, Special Screenings, IMAX-Filme, Art-House-Kino. Fokus auf gehobene Kino-Erlebnisse mit komfortablen Plätzen und Premium-Services. Erwähne Vorstellungszeiten und Ticketreservierung.`,
      museums: `Mit Google Search: Museen und Ausstellungen für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt + 25km - ideal für kulturinteressierte Heidehof Gäste: Sonderausstellungen, interaktive Museen, Kunstgalerien, historische Sammlungen, Führungen. Priorisiere temporäre Ausstellungen und VIP-Touren auf Premium-Niveau.`,
      live_music: `Mit Google Search: Live-Musik für HEUTE ABEND ${new Date().toLocaleDateString('de-DE')} in Ingolstadt - perfekt nach einem entspannten Tag im Heidehof: Jazz-Clubs, Konzerte, Live-Auftritte, Musikfestivals, Kammermusik, unplugged Sessions. Fokus auf hochwertige Live-Erlebnisse mit Atmosphäre auf Heidehof-Niveau.`,
      outdoor: `Mit Google Search: Outdoor-Aktivitäten für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt + Umgebung - ideal für aktive Heidehof Gäste: geführte Wanderungen, Radtouren, Klettern, Wassersport, Outdoor-Fitness, Naturerlebnisse. Fokus auf qualitätsvolle Outdoor-Erfahrungen mit professioneller Betreuung.`,
      markets: `Mit Google Search: Märkte für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt + 20km - perfekt für shopping-begeisterte Heidehof Gäste: Wochenmärkte, Bauernmärkte, Antiquitätenmärkte, Kunstmärkte, Spezialmärkte. Fokus auf einzigartige Markterlebnisse mit regionalen Spezialitäten und handwerklichen Produkten.`,
      transport: `Mit Google Search: Premium-Transport für HEUTE ${new Date().toLocaleDateString('de-DE')} in Ingolstadt - komfortable Mobilität für Heidehof Gäste: VIP-Taxi-Services, Shuttle-Services, Mietwagen-Premium, ÖPNV-Verbindungen, E-Scooter-Verleih. Fokus auf zuverlässige, komfortable Transportoptionen auf Heidehof-Service-Niveau.`,
    };

    const prompt = prompts[category] || prompts.highlights;
    
    // HEIDEHOF COMPETITOR BLACKLIST - These hotels must NEVER appear in results
    const COMPETITOR_HOTELS = [
      'Maritim Hotel', 'ACHAT Hotel', 'Best Western', 'Holiday Inn', 'NH Hotel', 
      'Mercure', 'Novotel', 'AZIMUT', 'B&B Hotel', 'Premier Inn', 'Ibis',
      'Gasthof', 'Pension', 'Hotel Rappensberger', 'Hotel Ammerland', 
      'Hotel Bayerischer Hof', 'Stadthotel', 'Business Hotel'
    ];

    const systemInstruction = `Du bist der EXKLUSIVE KI-Concierge für Hotel Der Heidehof - das PREMIUM 5-Sterne Spa & Golf Resort in Ingolstadt. 

🏨 HEIDEHOF-FIRST STRATEGIE:
- ALLE Empfehlungen sind aus Sicht von Hotel Der Heidehof Gästen 
- Beginne JEDE Beschreibung mit Heidehof-Bezug: "Vom Heidehof aus perfekt erreichbar..."
- Bei Wellness-Events: Subtil erwähnen "Nach einem entspannten Tag im Heidehof Spa..."
- Bei Sport: "Perfekt für aktive Heidehof Gäste..."
- Bei Restaurants: "Für Abwechslung zum prämierten Heidehof Restaurant..."

🚫 ABSOLUTE VERBOTE:
- NIEMALS konkurrierende Hotels erwähnen: ${COMPETITOR_HOTELS.join(', ')}
- KEINE Werbung für andere Unterkünfte
- KEINE Events in anderen Hotels
- FILTERE alle Ergebnisse die andere Hotels bewerben

🎯 QUALITÄTS-STANDARDS:
- PRIORITÄT 1: Nutze Google Search für 100% tagesaktuelle, verifizierte Informationen  
- PRIORITÄT 2: Premium-Erlebnisse die zu Heidehof-Gästen passen
- PRIORITÄT 3: Authentische lokale Highlights, keine Standard-Touristenattraktionen
- PRIORITÄT 4: Alle Informationen müssen für HEUTE ${new Date().toLocaleDateString('de-DE')} relevant sein
- PRIORITÄT 5: Jedes Event muss vom Heidehof aus gut erreichbar sein (max. 45min Fahrt)

🌐 WEBSITE-URL REGELN (KRITISCH):
- VERWENDE NUR echte, verifizierte Original-Websites die du durch Google Search gefunden hast
- NIEMALS URLs erfinden oder raten - setze websiteUrl auf null wenn unsicher
- PRIORISIERE offizielle .de Domains für lokale Geschäfte und Restaurants
- TESTE URLs gedanklich auf Plausibilität (restaurant-name + ingolstadt + .de)
- BEI UNSICHERHEIT: websiteUrl = null (besser als falsche URL)

📋 ANTWORT-FORMAT (STRIKT einhalten):
Formatiere als reines JSON-Array ohne Text oder Markdown. Jedes Event-Objekt:

{
  "title": "Prägnanter, verführerischer Titel",
  "description": "2-3 Sätze mit konkreten Details, Alleinstellungsmerkmalen und Nutzen für Gäste. Erwähne Besonderheiten, Qualität, Atmosphäre.",
  "location": "Vollständige Postadresse mit PLZ",
  "time": "Konkrete Uhrzeiten/Öffnungszeiten für heute",
  "websiteUrl": "NUR verifizierte Original-URLs aus Google Search. NULL wenn unsicher!",
  "latitude": 48.XXXXX (präzise Koordinaten),
  "longitude": 11.XXXXX (präzise Koordinaten),
  "vibe": ["2-4 prägnante Stimmungs-Tags"],
  "priceRange": "€/€€/€€€ oder 'Kostenlos'",
  "insider": "Geheimtipp oder besonderer Hinweis für VIP-Gäste",
  "availability": "Verfügbarkeit heute: 'Sofort', 'Reservierung empfohlen', etc."
}

🌟 QUALITÄTS-KRITERIEN:
- Mindestens 5-8 relevante Ergebnisse
- Keine Duplikate oder veraltete Informationen
- Bevorzuge Locations mit 4+ Sternen Bewertung
- Priorisiere einzigartige, Instagram-würdige Erlebnisse
- Berücksichtige die Saison und das Wetter
- Achte auf Barrierefreiheit für gehobene Ansprüche

🚫 BLACKLISTED URL PATTERNS (NIEMALS verwenden):
- Keine .com URLs für lokale deutsche Geschäfte
- Keine generischen URLs wie "restaurant-ingolstadt.de"
- Keine Facebook/Instagram URLs als Haupt-Website
- Keine erfundenen URLs die mit echten Domain-Namen "geraten" wurden

BEISPIEL-QUALITÄT:
[
  {
    "title": "Michelin-empfohlenes Esszimmer Ingolstadt",
    "description": "Exquisite bayerische Küche mit moderner Interpretation. Chef Thomas serviert heute ein 5-Gang-Menü mit regionalen Spezialitäten. Reservierung für 19:30 noch verfügbar.",
    "location": "Theresienstraße 15, 85049 Ingolstadt",
    "time": "18:00 - 22:30 Uhr (Küche bis 21:30)",
    "websiteUrl": "https://esszimmer-ingolstadt.de",
    "latitude": 48.7665,
    "longitude": 11.4257,
    "vibe": ["exklusiv", "romantisch", "kulinarisch", "regional"],
    "priceRange": "€€€",
    "insider": "Tisch am Fenster bietet Blick auf historischen Innenhof",
    "availability": "Reservierung empfohlen - noch 3 Tische frei"
  }
]`;

    // Try providers in order until one succeeds
    for (const provider of availableProviders) {
      if (!provider.key) {
        console.log(`⏭️ Skipping ${provider.name} - no API key`);
        continue;
      }

      try {
        console.log(`🤖 Trying ${provider.name} for category: ${category}`);
        
        let responseData;
        let sources = [];

        if (provider.name === 'gemini') {
          // Category-specific prompts
          let categoryPrompt = '';
          
          if (category.toLowerCase() === 'chauffeur') {
            categoryPrompt = `Liste mir 10-12 verschiedene Taxi-, Uber-, Bolt- und Chauffeur-Services in Ingolstadt auf. 

GEBE MINDESTENS 10 SEPARATE EINTRÄGE:

1. Taxi-Zentrale Ingolstadt (mit Telefon, Adresse, Preise zum Flughafen München ca. 90-110€)
2. Funk-Taxi Ingolstadt (mit Telefon, Adresse, Preise)
3. City Taxi Ingolstadt (mit Telefon, Adresse, Preise)
4. Taxi Gaimersheim (mit Telefon, Adresse, Preise)
5. Taxi Neuburg (mit Telefon, Adresse, Preise)
6. Uber Ingolstadt (App-Info, Verfügbarkeit, Durchschnittspreise)
7. Bolt Ingolstadt (App-Info, Verfügbarkeit, Durchschnittspreise)
8. FreeNow Ingolstadt (App-Info, Verfügbarkeit, Durchschnittspreise)
9. Limousinen-Service Ingolstadt (Premium Fahrzeuge, Preise)
10. Business Chauffeur Ingolstadt (für Geschäftsreisen, Preise)
11. VIP Transfer Service Ingolstadt (Flughafentransfer, Preise)
12. Mietwagen mit Fahrer Ingolstadt (Stundenpreise)

Jeder Eintrag muss vollständige Details haben: Name, echte Adresse in Ingolstadt, Telefonnummer (falls vorhanden), Preisbeispiele, Website.`;
          } else if (category.toLowerCase() === 'transport') {
            categoryPrompt = `Finde ALLE verfügbaren öffentliche Verkehrsmittel und Mobilitätsoptionen in Ingolstadt:

1. ÖFFENTLICHE VERKEHRSMITTEL:
   - Hauptbahnhof Ingolstadt (DB)
   - INVG Buslinien (wichtigste Routen)
   - Ticketpreise (Einzelticket, Tageskarte, Monatskarte)
   - MVV-Anbindung nach München

2. CARSHARING (ShareNow, Miles, Stadtmobil):
   - Verfügbare Anbieter
   - Preise pro Minute/Stunde
   - Standorte, App-Download

3. E-SCOOTER (Tier, Lime, Voi):
   - Verfügbare Anbieter in Ingolstadt
   - Preise pro Minute
   - Verfügbare Gebiete

4. BIKE-SHARING / FAHRRADVERLEIH:
   - Nextbike oder andere Anbieter
   - Preise, Stationen in Ingolstadt

5. PARK & RIDE:
   - P+R Parkplätze in Ingolstadt
   - Anbindung ÖPNV, Preise

Erstelle für JEDE Kategorie separate JSON-Einträge. Mindestens 8-10 Einträge insgesamt!`;
          } else {
            categoryPrompt = `Liste mir 3-5 aktuelle Events/Orte in Ingolstadt zum Thema "${category}".`;
          }

          const simplifiedPrompt = `${categoryPrompt}

Antworte NUR mit diesem JSON-Format (KEINE Erklärungen davor/danach):
[
  {
    "title": "Service/Event-Name",
    "description": "Detaillierte Beschreibung (100-150 Wörter)",
    "location": "Adresse mit PLZ",
    "time": "Öffnungszeiten/Verfügbarkeit",
    "websiteUrl": "https://...",
    "latitude": 48.7665,
    "longitude": 11.4257,
    "vibe": ["eigenschaft1", "eigenschaft2"],
    "priceRange": "Preisbeispiele",
    "insider": "Wichtiger Tipp",
    "availability": "Verfügbarkeit/Status"
  }
]

WICHTIG: Beginne direkt mit [ und ende mit ]. Keine Markdown, keine Code-Blöcke, kein Text außerhalb des JSON.`;

          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${provider.key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: simplifiedPrompt }] }],
              tools: [{ googleSearch: {} }],
              systemInstruction: { 
                parts: [{ 
                  text: `Du bist ein präziser JSON-Generator. Antworte IMMER nur mit validem JSON. 
Keine Erklärungen, keine Markdown-Formatierung, keine Code-Blöcke.
Beginne direkt mit [ und ende mit ].`
                }] 
              },
              generationConfig: { 
                temperature: 0.2,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 4000,
                candidateCount: 1
              }
            })
          });

          if (geminiResponse.status === 429) {
            console.log('⚠️ Gemini quota exceeded, falling back to next provider');
            lastError = 'Gemini quota exceeded';
            continue;
          }

          if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error(`❌ ${provider.name} API Error:`, geminiResponse.status, errorText);
            lastError = `${provider.name} API failed: ${geminiResponse.status}`;
            continue;
          }

          responseData = await geminiResponse.json();
          sources = responseData.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        } else if (provider.name === 'openai') {
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider.key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 4096
            })
          });

          if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error(`❌ ${provider.name} API Error:`, openaiResponse.status, errorText);
            lastError = `${provider.name} API failed: ${openaiResponse.status}`;
            continue;
          }

          responseData = await openaiResponse.json();
          responseData.candidates = [{ content: { parts: [{ text: responseData.choices[0].message.content }] } }];

        } else if (provider.name === 'perplexity') {
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider.key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-large-128k-online',
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 4000
            })
          });

          if (!perplexityResponse.ok) {
            const errorText = await perplexityResponse.text();
            console.error(`❌ ${provider.name} API Error:`, perplexityResponse.status, errorText);
            lastError = `${provider.name} API failed: ${perplexityResponse.status}`;
            continue;
          }

          responseData = await perplexityResponse.json();
          responseData.candidates = [{ content: { parts: [{ text: responseData.choices[0].message.content }] } }];
        }

        usedProvider = provider.name;
        console.log(`✅ Successfully used ${provider.name} for data generation`);
        
        // Process the response
        if (!responseData.candidates || responseData.candidates.length === 0) {
          console.error(`❌ No candidates from ${provider.name}`);
          lastError = `No data from ${provider.name}`;
          continue;
        }

        const candidate = responseData.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
          console.error(`❌ No content in ${provider.name} response`);
          lastError = `Empty response from ${provider.name}`;
          continue;
        }

        let jsonText = candidate.content.parts[0].text;
        console.log(`🔍 ${provider.name} RAW Response (length: ${jsonText.length}, first 200 chars):`, jsonText.substring(0, 200));
    
        // ULTRA-AGGRESSIVE JSON Cleaning
        const originalText = jsonText;
        
        // Remove markdown code blocks
        jsonText = jsonText.replace(/```json\s*/gi, '');
        jsonText = jsonText.replace(/```\s*/g, '');
        
        // Remove ALL text before first [ or {
        jsonText = jsonText.replace(/^[^\[\{]*/, '');
        // Remove ALL text after last ] or }
        jsonText = jsonText.replace(/[^\]\}]*$/, '');
        
        // Handle case where response is completely empty
        if (!jsonText || jsonText.trim().length === 0) {
          console.error(`❌ Empty response from ${provider.name} after cleaning`);
          console.error(`Original text was: "${originalText}"`);
          lastError = `Empty response from ${provider.name}`;
          continue;
        }
        
        // Fallback: Try to extract JSON from markdown
        if (!jsonText.startsWith('[')) {
          if (originalText.includes("```json")) {
            const match = originalText.match(/```json\s*([\s\S]*?)\s*```/);
            if (match) jsonText = match[1].trim();
          } else if (originalText.includes("```")) {
            const match = originalText.match(/```\s*([\s\S]*?)\s*```/);
            if (match) jsonText = match[1].trim();
          }
          
          // Last resort: Regex extract JSON array
          const jsonMatch = originalText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }
        }
        
        console.log(`🧹 ${provider.name} CLEANED Text (first 300 chars):`, jsonText.substring(0, 300));

        // Parse JSON response with multiple fallback strategies
        let parsedData;
        try {
          parsedData = JSON.parse(jsonText);
          console.log(`✅ JSON parsed successfully from ${provider.name}, got ${Array.isArray(parsedData) ? parsedData.length : 'non-array'} items`);
        } catch (parseError) {
          console.error(`❌ JSON Parse Error from ${provider.name}:`, parseError.message);
          console.error(`❌ Original Raw Text (first 500):`, originalText.substring(0, 500));
          console.error(`❌ Cleaned Text (first 500):`, jsonText.substring(0, 500));
          
          // Strategy 1: Try to find JSON array with regex
          const arrayMatch = originalText.match(/\[[\s\S]*?\]/);
          if (arrayMatch) {
            try {
              parsedData = JSON.parse(arrayMatch[0]);
              console.log(`✅ Rescued JSON via array regex extraction`);
            } catch (e) {
              console.error(`❌ Array regex extraction failed:`, e.message);
            }
          }
          
          // Strategy 2: Try to find JSON object and wrap in array
          if (!parsedData) {
            const objectMatch = originalText.match(/\{[\s\S]*?\}/);
            if (objectMatch) {
              try {
                const obj = JSON.parse(objectMatch[0]);
                parsedData = [obj];
                console.log(`✅ Rescued single object, wrapped in array`);
              } catch (e) {
                console.error(`❌ Object regex extraction failed:`, e.message);
              }
            }
          }
          
          // Strategy 3: Give up and try next provider
          if (!parsedData) {
            lastError = `JSON parse failed from ${provider.name} after all rescue attempts`;
            continue;
          }
        }

        if (!Array.isArray(parsedData)) {
          console.error(`❌ Response is not array from ${provider.name}, got:`, typeof parsedData);
          // Try to wrap in array if it's a single object
          if (parsedData && typeof parsedData === 'object') {
            console.log(`🔄 Wrapping single object in array`);
            parsedData = [parsedData];
          } else {
            lastError = `Invalid format from ${provider.name}`;
            continue;
          }
        }

    // URL Validation Function
    const isValidWebsiteUrl = (url: string): boolean => {
      if (!url || url === null) return false;
      
      // Basic URL validation
      try {
        const urlObj = new URL(url);
        
        // Check for suspicious patterns
        const suspiciousPatterns = [
          /restaurant-ingolstadt\.(de|com)$/,
          /hotel-ingolstadt\.(de|com)$/,
          /museum-ingolstadt\.(de|com)$/,
          /event-ingolstadt\.(de|com)$/,
          /^https?:\/\/(www\.)?example\./,
          /^https?:\/\/(www\.)?placeholder\./,
          /localhost/,
          /127\.0\.0\.1/
        ];
        
        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));
        if (isSuspicious) {
          console.warn(`🚫 Suspicious URL detected: ${url}`);
          return false;
        }
        
        // Valid protocols
        return ['http:', 'https:'].includes(urlObj.protocol);
      } catch {
        return false;
      }
    };

    // ENHANCED HEIDEHOF-QUALITY SCORING WITH COMPETITOR FILTERING
    const calculateQualityScore = (item: any): number => {
      let score = 0;
      
      // IMMEDIATE DISQUALIFICATION: Check for competitor hotels
      const titleLower = (item.title || '').toLowerCase();
      const descriptionLower = (item.description || '').toLowerCase();
      const locationLower = (item.location || '').toLowerCase();
      
      const hasCompetitorMention = COMPETITOR_HOTELS.some(hotel => 
        titleLower.includes(hotel.toLowerCase()) || 
        descriptionLower.includes(hotel.toLowerCase()) || 
        locationLower.includes(hotel.toLowerCase())
      );
      
      if (hasCompetitorMention) {
        console.log(`🚫 Blocked competitor mention in: ${item.title}`);
        return 0; // Immediate disqualification
      }
      
      // HEIDEHOF-BONUS SCORING
      const heidehofKeywords = ['premium', 'luxus', 'exklusiv', 'gourmet', 'spa', 'wellness', 'golf', 'michelin', 'ausgezeichnet'];
      const heidehofBonus = heidehofKeywords.some(keyword => 
        descriptionLower.includes(keyword) || titleLower.includes(keyword)
      ) ? 15 : 0;
      
      // Basic completeness (35 points max)
      if (item.title && item.title.length > 10) score += 10;
      if (item.description && item.description.length > 50) score += 10;
      if (item.location && item.location.includes(',')) score += 10;
      // Original website bonus (enhanced validation)
      if (item.websiteUrl && isValidWebsiteUrl(item.websiteUrl)) score += 10;
      
      // Location precision (20 points max)
      if (typeof item.latitude === 'number' && typeof item.longitude === 'number') score += 20;
      
      // Content richness (20 points max)
      if (Array.isArray(item.vibe) && item.vibe.length > 0) score += 5;
      if (item.insider && item.insider.length > 20) score += 10;
      if (item.priceRange) score += 5;
      
      // Time specificity (20 points max)
      if (item.time && item.time.includes(':')) score += 10;
      if (item.availability && item.availability !== 'Verfügbarkeit prüfen') score += 10;
      
      // Add Heidehof bonus
      score += heidehofBonus;
      
      return Math.min(score, 100);
    };

    const sanitizedData = parsedData.map((item, index) => {
      if (!item.title || !item.description || !item.location || !item.time) {
        console.warn(`⚠️ Unvollständiges Item ${index}:`, item);
      }
      
      // Verbesserte Koordinaten-Validierung
      const lat = parseFloat(item.latitude);
      const lon = parseFloat(item.longitude);
      const hasValidCoords = !isNaN(lat) && !isNaN(lon) && 
                            lat >= -90 && lat <= 90 && 
                            lon >= -180 && lon <= 180 &&
                            lat !== 0 && lon !== 0; // Excludes 0,0 which are often placeholders
      
      return {
        title: item.title || 'Unbekannt',
        description: item.description || 'Keine Beschreibung verfügbar',
        location: item.location || 'Adresse nicht verfügbar',
        time: item.time || 'Zeiten nicht verfügbar',
        websiteUrl: (item.websiteUrl && isValidWebsiteUrl(item.websiteUrl)) ? item.websiteUrl : null,
        latitude: hasValidCoords ? lat : null,
        longitude: hasValidCoords ? lon : null,
        vibe: Array.isArray(item.vibe) ? item.vibe : [],
        priceRange: item.priceRange || null,
        insider: item.insider || null,
        availability: item.availability || 'Verfügbarkeit prüfen',
        quality_score: calculateQualityScore(item),
        coordinates_validated: hasValidCoords,
        updated_at: new Date().toISOString()
      };
    }).filter(item => item && item.title !== 'Unbekannt')
      .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));

        console.log(`✅ ${sanitizedData.length} Events processed for category: ${category} using ${usedProvider}`);

        return new Response(
          JSON.stringify({
            success: true,
            events: sanitizedData,
            sources: sources,
            category: category,
            provider: usedProvider,
            timestamp: new Date().toISOString(),
            dataQuality: {
              totalEvents: sanitizedData.length,
              avgQualityScore: sanitizedData.reduce((sum, item) => sum + (item.quality_score || 0), 0) / sanitizedData.length,
              coordsValidated: sanitizedData.filter(item => item.coordinates_validated).length
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      } catch (providerError) {
        console.error(`❌ Error with ${provider.name}:`, providerError);
        lastError = `${provider.name}: ${providerError.message}`;
        continue;
      }
    }

    // If all providers failed, return graceful fallback
    console.error('💥 All providers failed, returning fallback');
    
    const { allProviders: debugProviders } = getProviders();
    const debugInfo = {
      availableProviders: debugProviders.map(p => ({
        name: p.name,
        hasKey: !!p.key,
        keyFirstChars: p.key ? p.key.substring(0, 10) + '...' : 'MISSING'
      })),
      lastError,
      category,
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        events: [],
        sources: [],
        category: category,
        provider: 'fallback',
        timestamp: new Date().toISOString(),
        fallbackReason: lastError || 'All providers unavailable',
        message: 'Live-Daten temporär nicht verfügbar. Nutzen Sie bitte die zuletzt gespeicherten Snapshots.',
        debug: debugInfo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Fehler in Ingolstadt Live Ticker:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Fehler beim Laden der Live-Daten',
        details: error.message,
        category: 'unknown'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});