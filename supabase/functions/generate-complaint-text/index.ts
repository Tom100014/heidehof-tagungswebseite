import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

// HOTEL HEIDEHOF TELEFONNUMMER FÜR BESCHWERDEN
const HOTEL_HEIDEHOF_COMPLAINT_PHONE = "08458-64-0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplaintData {
  guestName: string;
  guestIdentifier: string;
  selectedComplaints: string[];
  otherComplaint: string;
  communicationType: 'hotel_response' | 'guest_request' | 'complaint_only';
}

// PROFESSIONELLER HOTEL-ANTWORT-PROMPT - OHNE KOSTENLOSE ANGEBOTE
const cleanHotelResponsePrompt = `Du bist ein professioneller Hotelmanager des Hotel Heidehof. Du zeigst Verständnis für Gästeanliegen, bietest aber NIEMALS kostenlose Dinge an.

GAST-INFORMATIONEN:
- Name: {guestName}
- Identifikation: {guestIdentifier}
- Anliegen des Gastes: "{otherComplaint}"

KRITISCHE REGEL: NIEMALS kostenlose Angebote machen (kein kostenloses Essen, keine Gutscheine, keine Rabatte)!

Erstelle eine professionelle Hotel-Antwort, die:
1. Verständnis für das Problem zeigt
2. Das Anliegen ernst nimmt
3. Zum persönlichen Gespräch in die Bar einlädt
4. KEINE kostenlosen Angebote macht
5. Professionell und empathisch ist

AUFBAU DER ANTWORT:
1. Persönliche Anrede mit Namen
2. "Wir verstehen Ihre Unzufriedenheit bezüglich [Problem]"
3. "Das tut uns leid und wir nehmen Ihr Feedback ernst"
4. "Lassen Sie uns das persönlich bei einem Gespräch in unserer Bar besprechen"
5. "Wir finden gemeinsam eine Lösung"
6. Höflicher Abschluss vom Hotel Heidehof Team

STRENG VERBOTEN:
- Kostenlose Angebote (Essen, Getränke, Gutscheine, Rabatte)
- Übertriebene Entschuldigungen
- Unrealistische Versprechungen
- Überschriften oder technische Hinweise

BEISPIEL (bei kaltem Essen):
"Liebe/r [Name], wir verstehen Ihre Unzufriedenheit bezüglich des Essens vollkommen. Das tut uns leid und wir nehmen Ihr Feedback ernst. Lassen Sie uns das persönlich bei einem Gespräch in unserer Bar besprechen, damit wir gemeinsam eine Lösung finden können."

Länge: 80-150 Wörter
Ton: Professionell, verständnisvoll, lösungsorientiert - OHNE Kosten`;

const cleanGuestRequestPrompt = `Du hilfst einem Hotelgast dabei, eine höfliche aber bestimmte Nachricht an das Hotel zu formulieren.

GAST-INFORMATIONEN:
- Name: {guestName}
- Identifikation: {guestIdentifier}
- Anliegen: "{otherComplaint}"

WICHTIGE ANWEISUNG: Erstelle AUSSCHLIESSLICH den gewünschten Text ohne jegliche Überschriften oder technische Hinweise!

Erstelle eine Nachricht AUS DER SICHT DES GASTES (Ich-Form), die:
1. Höflich aber bestimmt das Problem schildert
2. Um ein persönliches Gespräch bei einem Getränk in der Bar bittet
3. Zeigt, dass der Gast eine Lösung sucht
4. Respektvoll aber klar kommuniziert

AUFBAU:
1. Höfliche Anrede an das Hotel-Team
2. Kurze Vorstellung (Name + Zimmer/Spa-Schlüssel)
3. Klare Beschreibung des Problems
4. Bitte um persönliches Gespräch in der Bar
5. Höflicher Abschluss

ABSOLUT VERBOTEN:
- Überschriften oder Phasen-Bezeichnungen
- Technische Hinweise
- Meta-Informationen

AUSGABE: Nur der reine, fertige Text!

Länge: 120-180 Wörter
Perspektive: Erste Person (Ich) - vom Gast geschrieben
Ton: Höflich aber bestimmt`;

// KRITISCHER PROMPT FÜR KUNDEN-BESCHWERDE
const cleanComplaintOnlyPrompt = `WICHTIG: Du bist ein HOTELGAST und schreibst eine DIREKTE BESCHWERDE an das Hotel-Team!

GAST-INFORMATIONEN:
- Dein Name: {guestName}
- Deine Identifikation: {guestIdentifier}
- Dein Problem: "{otherComplaint}"

ABSOLUT KRITISCH: Du schreibst ALS GAST (Ich-Form) an das Hotel! NIEMALS aus Hotel-Sicht!

Schreibe eine direkte Beschwerde-Nachricht, die:
1. Von DIR als Gast an das Hotel gerichtet ist
2. Höflich aber bestimmt dein Problem schildert
3. KEIN persönliches Treffen erwähnt
4. Um Bearbeitung deines Anliegens bittet
5. Professionell und respektvoll ist

AUFBAU:
1. "Liebes Hotel-Team" oder "Sehr geehrte Damen und Herren"
2. "Ich bin [Name] aus [Zimmer/Spa-Schlüssel]"
3. "Ich möchte Ihnen meine Unzufriedenheit bezüglich [Problem] mitteilen"
4. Beschreibung des Problems
5. "Bitte kümmern Sie sich um dieses Anliegen"
6. Höflicher Abschluss mit deinem Namen

STRENG VERBOTEN:
- Schreiben aus Hotel-Perspektive
- Erwähnung von Treffen oder Bar-Gesprächen
- Überschriften oder Phasen-Bezeichnungen
- Meta-Informationen

AUSGABE: Nur der reine Text der Beschwerde!

Länge: 80-120 Wörter
Perspektive: Erste Person (Ich) - ALS GAST geschrieben
Ton: Höflich aber direkt`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const complaintData: ComplaintData = await req.json();
    
    console.log('🔥 Verarbeite Anliegen für:', complaintData.guestName);
    console.log('📞 WhatsApp-Nummer (ohne +):', HOTEL_HEIDEHOF_COMPLAINT_PHONE);
    console.log('🎯 Spezifisches Anliegen:', complaintData.otherComplaint);
    console.log('💬 Kommunikationstyp:', complaintData.communicationType);

    // Lade Prompt aus Datenbank
    let systemPrompt = cleanHotelResponsePrompt;
    let systemRole = 'Du bist ein professioneller Hotelmanager. Du zeigst Verständnis für Gästeanliegen, bietest aber NIEMALS kostenlose Dinge an (kein kostenloses Essen, keine Gutscheine, keine Rabatte). Nur Verständnis und Gesprächseinladung. KEINE Überschriften!';
    let temperature = 0.7;
    let maxTokens = 800;

    try {
      const { data: promptData, error: promptError } = await supabase
        .from('complaint_response_prompts')
        .select('*')
        .eq('prompt_type', complaintData.communicationType)
        .eq('is_active', true)
        .single();

      if (promptData && !promptError) {
        systemPrompt = promptData.prompt_content;
        systemRole = promptData.system_role;
        temperature = promptData.temperature || 0.7;
        maxTokens = promptData.max_tokens || 800;

        // Increment usage count
        await supabase
          .from('complaint_response_prompts')
          .update({ usage_count: (promptData.usage_count || 0) + 1 })
          .eq('id', promptData.id);

        console.log('✅ Prompt aus Datenbank geladen:', promptData.prompt_name);
      } else {
        console.log('⚠️ Kein DB-Prompt gefunden, verwende Fallback für:', complaintData.communicationType);
        
        // Fallback auf hardcoded Prompts
        if (complaintData.communicationType === 'guest_request') {
          systemPrompt = cleanGuestRequestPrompt;
          systemRole = 'Du bist ein Hotelgast und schreibst eine höfliche aber bestimmte Nachricht an das Hotel-Team. Du schreibst AUS DEINER SICHT als Gast (Ich-Form). KEINE Überschriften oder technische Hinweise!';
        } else if (complaintData.communicationType === 'complaint_only') {
          systemPrompt = cleanComplaintOnlyPrompt;
          systemRole = 'Du bist ein HOTELGAST und schreibst eine DIREKTE BESCHWERDE an das Hotel-Team. Du schreibst ALS GAST (Ich-Form) über DEIN Problem. NIEMALS aus Hotel-Sicht! KEINE Überschriften!';
        }
      }
    } catch (dbError) {
      console.error('⚠️ DB-Fehler beim Prompt-Laden, verwende Fallback:', dbError);
      // Continue with hardcoded fallback prompts
      if (complaintData.communicationType === 'guest_request') {
        systemPrompt = cleanGuestRequestPrompt;
        systemRole = 'Du bist ein Hotelgast und schreibst eine höfliche aber bestimmte Nachricht an das Hotel-Team. Du schreibst AUS DEINER SICHT als Gast (Ich-Form). KEINE Überschriften oder technische Hinweise!';
      } else if (complaintData.communicationType === 'complaint_only') {
        systemPrompt = cleanComplaintOnlyPrompt;
        systemRole = 'Du bist ein HOTELGAST und schreibst eine DIREKTE BESCHWERDE an das Hotel-Team. Du schreibst ALS GAST (Ich-Form) über DEIN Problem. NIEMALS aus Hotel-Sicht! KEINE Überschriften!';
      }
    }

    // Ersetze Platzhalter im Prompt
    const processedPrompt = systemPrompt
      .replace('{guestName}', complaintData.guestName)
      .replace('{guestIdentifier}', complaintData.guestIdentifier)
      .replace('{otherComplaint}', complaintData.otherComplaint || 'Allgemeine Unzufriedenheit');

    let generatedText: string;

    // Verwende Google Gemini API
    if (geminiApiKey) {
      console.log('🤖 Verwende Google Gemini API direkt');
      
      // Gemini API Format
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;
      
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemRole}\n\n${processedPrompt}\n\nWICHTIG: Generiere NUR den reinen Text ohne Überschriften!`
            }]
          }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
          }
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('❌ Gemini API Error:', errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
    } else if (lovableApiKey) {
      console.log('🤖 Verwende Lovable AI Gateway (Gemini)');
      
      // Lovable AI Gateway (OpenAI-kompatibel)
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: systemRole
            },
            { 
              role: 'user', 
              content: processedPrompt + '\n\nWICHTIG: Generiere NUR den reinen Text ohne Überschriften!'
            }
          ],
          temperature: temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Lovable AI Gateway Error:', errorText);
        throw new Error(`Lovable AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      generatedText = data.choices[0].message.content;
      
    } else {
      throw new Error('Keine AI API konfiguriert. Bitte GEMINI_API_KEY oder LOVABLE_API_KEY setzen.');
    }

    // KRITISCHER SICHERHEITS-FILTER: Entferne alle Überschriften
    generatedText = generatedText
      .replace(/#{1,6}\s*PHASE\s*\d+[^\n]*/gi, '')
      .replace(/PHASE\s*\d+[^\n]*/gi, '')
      .replace(/###[^\n]*/g, '')
      .replace(/##[^\n]*/g, '')
      .replace(/#[^\n]*/g, '')
      .replace(/^\s*-\s*PHASE.*$/gm, '')
      .trim();

    console.log(`✅ ${complaintData.communicationType === 'guest_request' || complaintData.communicationType === 'complaint_only' ? 'GASTNACHRICHT' : 'HOTELANTWORT'} BEREINIGT generiert für:`, complaintData.guestName);
    console.log('📞 WhatsApp-Nummer korrekt gesetzt (ohne +):', HOTEL_HEIDEHOF_COMPLAINT_PHONE);

    return new Response(JSON.stringify({ 
      generatedText,
      success: true,
      phoneNumber: HOTEL_HEIDEHOF_COMPLAINT_PHONE
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🔥 Fehler bei der KI-Textgenerierung:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});