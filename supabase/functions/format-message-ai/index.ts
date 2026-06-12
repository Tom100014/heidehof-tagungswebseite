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
    console.log('🤖 AI Message Formatter: Anfrage erhalten');
    
    const { originalMessage, customerName } = await req.json();
    
    if (!originalMessage) {
      throw new Error('Keine Nachricht angegeben');
    }

    console.log('📝 Formatiere Nachricht:', originalMessage);

    const aiFormattingPrompt = `Du bist ein professioneller Hotel-Concierge. Formatiere diese Nachricht zu einer höflichen, professionellen Hotel-Nachricht.

Ursprüngliche Nachricht: "${originalMessage}"
Kundenname: "${customerName || 'Unbekannt'}"

Regeln:
- Füge eine höfliche Begrüßung hinzu
- Mache die Nachricht professionell aber freundlich
- Verwende Du-Form
- Keine Emojis hinzufügen
- Kurz und präzise
- Falls es eine Antwort/Bestätigung ist, mache es zu einer Hotel-typischen Antwort

Antworte nur mit der formatierten Nachricht, ohne weitere Erklärungen.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: aiFormattingPrompt }],
        max_tokens: 200,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Fehler: ${response.statusText}`);
    }

    const data = await response.json();
    const formattedMessage = data.choices[0].message.content.trim();

    console.log('✅ AI-Formatierung erfolgreich:', formattedMessage);

    return new Response(JSON.stringify({ 
      success: true,
      formattedMessage,
      originalMessage,
      customerName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ AI-Formatierung fehlgeschlagen:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      formattedMessage: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});