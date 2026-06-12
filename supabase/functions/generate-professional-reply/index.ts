import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerMessage, customerName, messageType, orderDetails } = await req.json();

    console.log('📨 Empfange Admin-Reply-Anfrage:', {
      customerName,
      messageType,
      hasOrderDetails: !!orderDetails
    });

    // Validate inputs
    if (!customerMessage && !orderDetails) {
      return new Response(
        JSON.stringify({ error: 'customerMessage oder orderDetails erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Lovable AI API Key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('❌ LOVABLE_API_KEY nicht gefunden');
      return new Response(
        JSON.stringify({ error: 'AI Gateway nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt based on message type
    let systemPrompt = `Du bist ein professioneller Hotel-Concierge vom Hotel "Der Heidehof" - einem 4-Sterne-Superior Conference & SPA Resort.

WICHTIGE REGELN:
1. Antworte IMMER auf Deutsch, professionell und freundlich
2. Verwende korrekte Anrede (Sehr geehrte Frau/Sehr geehrter Herr) basierend auf dem Namen
3. Sei präzise, aber herzlich
4. Verwende KEINE Emojis oder informelle Sprache
5. Halte die Antwort kurz und fokussiert
6. Am Ende: "Mit freundlichen Grüßen, Ihr Der Heidehof Team"
7. KEIN Footer/Kontaktinformationen - die werden automatisch hinzugefügt`;

    // Add specific instructions based on message type
    if (messageType === 'bar_max_order' || messageType === 'restaurant_order') {
      systemPrompt += `\n\nDies ist eine BESTELLBESTÄTIGUNG. Formuliere eine professionelle Bestätigung, die:
- Die Bestellung bestätigt
- Eine geschätzte Zubereitungszeit nennt (Standard: 15-20 Minuten)
- Freundlich und zuvorkommend ist`;
    } else if (messageType === 'beauty_appointment') {
      systemPrompt += `\n\nDies ist eine BEAUTY-TERMINANFRAGE. Formuliere eine professionelle Antwort, die:
- Den Terminwunsch bestätigt
- Verfügbarkeit prüft oder alternative Zeiten vorschlägt
- Auf spezielle Wünsche eingeht`;
    } else if (messageType === 'table_reservation') {
      systemPrompt += `\n\nDies ist eine TISCHRESERVIERUNG. Formuliere eine professionelle Bestätigung, die:
- Die Reservierung bestätigt
- Datum, Uhrzeit und Personenzahl wiederholt
- Eventuelle Sonderwünsche bestätigt`;
    } else if (messageType === 'contact_request' || messageType === 'complaint') {
      systemPrompt += `\n\nDies ist eine KONTAKTANFRAGE oder BESCHWERDE. Formuliere eine professionelle Antwort, die:
- Das Anliegen ernst nimmt
- Verständnis zeigt
- Konkrete nächste Schritte nennt
- Bei Beschwerden: Aufrichtiges Bedauern ausdrücken`;
    }

    // Build user prompt
    let userPrompt = `Kundenname: ${customerName || 'Unbekannt'}
Nachrichtentyp: ${messageType || 'Allgemeine Anfrage'}

Kundennachricht:
${customerMessage || 'Keine direkte Nachricht'}

${orderDetails ? `Bestelldetails:
${JSON.stringify(orderDetails, null, 2)}` : ''}

Erstelle eine professionelle Hotel-Antwort auf Deutsch. NUR die Antwort, KEIN Footer.`;

    console.log('🤖 Rufe Lovable AI auf...');

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI Fehler:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate Limit erreicht. Bitte versuchen Sie es später erneut.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI-Guthaben aufgebraucht. Bitte Credits hinzufügen.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const professionalReply = data.choices?.[0]?.message?.content;

    if (!professionalReply) {
      throw new Error('Keine Antwort von AI erhalten');
    }

    console.log('✅ Professionelle Antwort generiert:', professionalReply.substring(0, 100) + '...');

    return new Response(
      JSON.stringify({ 
        success: true, 
        reply: professionalReply,
        model: 'google/gemini-2.5-flash'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in generate-professional-reply:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
