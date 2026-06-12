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
    const { originalMessage, customerName, messageType } = await req.json();

    if (!originalMessage) {
      return new Response(
        JSON.stringify({ error: 'Original message is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Formatting message:', { originalMessage, customerName, messageType });

    // Lade formular-spezifischen Prompt aus hotel_settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    let formularPrompt = '';
    if (messageType) {
      const settingKey = `message_formatter_${messageType}`;
      const promptResponse = await fetch(
        `${supabaseUrl}/rest/v1/hotel_settings?setting_key=eq.${settingKey}&select=setting_value`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );
      
      if (promptResponse.ok) {
        const promptData = await promptResponse.json();
        if (promptData && promptData.length > 0) {
          const settingValue = promptData[0].setting_value;
          // setting_value ist JSONB mit { "prompt": "..." }
          if (typeof settingValue === 'object' && settingValue && 'prompt' in settingValue) {
            formularPrompt = settingValue.prompt;
          } else if (typeof settingValue === 'string') {
            formularPrompt = settingValue;
          }
          console.log('✅ Loaded custom prompt from hotel_settings for:', messageType);
        }
      }
    }

    const systemPrompt = `Du bist ein professioneller Kommunikationsassistent für das Hotel Der Heidehof – Conference & SPA Resort. 

Deine Aufgabe ist es, kurze, informelle Nachrichten in professionelle, höfliche und serviceorientierte Hotel-Kommunikation umzuwandeln.

WICHTIGE REGELN:
- Verwende immer höfliche Anrede und Grußformeln
- Halte einen professionellen aber warmen Ton
- Beziehe dich auf das Hotel Der Heidehof als "unser Hotel" oder "das Hotel"
- Sei hilfsbereit und serviceorientiert
- Verwende deutsche Sprache mit Sie-Form
- Beende Nachrichten mit freundlichen Grüßen vom Hotel-Team
- Füge KEINE Hotel-Kontaktdaten hinzu (das wird automatisch gemacht)
- Halte die Nachricht prägnant aber professionell

${formularPrompt ? `FORMULAR-SPEZIFISCHER KONTEXT:\n${formularPrompt}\n` : ''}

ALLGEMEINE BEISPIELE:
Input: "ok mache ich"
Output: "Sehr gerne! Wir kümmern uns umgehend darum. Vielen Dank für Ihr Verständnis.\n\nMit freundlichen Grüßen\nIhr Hotel-Team"

Input: "zimmer ist fertig"  
Output: "Gerne informieren wir Sie, dass Ihr Zimmer nun zur Verfügung steht. Sie können jederzeit einchecken.\n\nMit freundlichen Grüßen\nIhr Hotel-Team"`;

    const userPrompt = `Formatiere diese informelle Nachricht professionell für ${customerName || 'den Gast'}:

"${originalMessage}"

Kontext: ${messageType || 'Allgemeine Kommunikation'}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenAI response:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI service' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const professionalMessage = data.choices[0].message.content.trim();
    
    console.log('✅ Professional message generated:', professionalMessage);

    return new Response(JSON.stringify({ 
      originalMessage,
      professionalMessage,
      customerName 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in professional-message-formatter function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});