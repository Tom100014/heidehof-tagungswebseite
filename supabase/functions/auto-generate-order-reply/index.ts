import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const _authFail = await requireAdmin(req);
  if (_authFail) return _authFail;

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY nicht konfiguriert');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { message_id, message_type, customer_name, guest_phone, metadata } = await req.json();

    console.log('🤖 AUTO AI REPLY triggered:', { message_id, message_type, customer_name });

    // 1. Lade hotel_settings für Footer, Werbung, Prompts und AI-Modell
    const { data: settingsData } = await supabase
      .from('hotel_settings')
      .select('setting_key, setting_value');

    // Konvertiere Array zu Objekt
    const settings: any = {};
    settingsData?.forEach((item: any) => {
      settings[item.setting_key] = item.setting_value;
    });

    const hotelFooter = settings.hotel_footer || '';
    const promotionalFooter = settings.promotional_footer || '';
    const aiModel = settings.ai_model || 'google/gemini-2.5-flash';
    const barMaxPrompt = settings.bar_max_prompt || '';
    const restaurantPrompt = settings.restaurant_prompt || '';
    const beautyPrompt = settings.beauty_prompt || '';
    const shopPrompt = settings.shop_prompt || '';
    const conferencePrompt = settings.conference_prompt || '';
    const contactPrompt = settings.contact_prompt || '';

    // 2. Baue kontextbezogenen Prompt
    let systemPrompt = `Du bist der AI-Assistent des Hotel Heidehof - einem 4-Sterne Superior Conference & SPA Resort in Ingolstadt.

DEINE AUFGABE:
Generiere eine professionelle, freundliche Bestätigungs-Nachricht für den Gast.

TONE & STIL:
- Professionell aber warm und persönlich
- Deutsche Hotel-Gastfreundschaft
- Keine übertriebene Höflichkeit
- Kurz und prägnant
- Verwende keine Emojis (außer bei Bar Mäx)

WICHTIG:
- Adressiere den Gast mit Namen
- Bestätige die Bestellung/Anfrage kurz
- Gib realistische Zeitangaben
- Erwähne NICHT den Footer/Werbung (wird automatisch hinzugefügt)
- Halte die Nachricht unter 150 Wörtern`;

    // Spezifische Anweisungen je nach Bestelltyp (mit dynamischen Prompts)
    if (message_type === 'bar_max_order') {
      const customPrompt = barMaxPrompt || `BESTELLUNG: Bar Mäx (Getränke/Snacks)
- Bestätige Bestellung kurz
- Lieferzeit: 15-20 Minuten
- Erwähne Zimmerservice-Gebühr falls zutreffend
- Freundlich und locker im Ton
- Verwende maximal 2-3 Emojis (🍹🍔)`;
      systemPrompt += `\n\n${customPrompt}`;
    } else if (message_type === 'restaurant_order') {
      const customPrompt = restaurantPrompt || `BESTELLUNG: Restaurant Maxwell (Tischreservierung)
- Bestätige Tischreservierung
- Erwähne Datum und Uhrzeit
- Hinweis auf Verfügbarkeit
- Professioneller Ton`;
      systemPrompt += `\n\n${customPrompt}`;
    } else if (message_type === 'beauty_appointment') {
      const customPrompt = beautyPrompt || `BESTELLUNG: Beauty & Wellness Termin
- Bestätige Terminanfrage
- Erwähne Behandlung und Wunschzeit
- Hinweis: Team meldet sich zur Bestätigung
- Ruhiger, entspannter Ton`;
      systemPrompt += `\n\n${customPrompt}`;
    } else if (message_type === 'shop_order') {
      const customPrompt = shopPrompt || `BESTELLUNG: Shop-Bestellung
- Bestätige Bestellung
- Lieferzeit: 30-60 Minuten
- Erwähne Lieferort
- Professioneller Ton`;
      systemPrompt += `\n\n${customPrompt}`;
    } else if (message_type === 'conference_order') {
      const customPrompt = conferencePrompt || `BESTELLUNG: Konferenz-Menü
- Bestätige Menü-Bestellung
- Erwähne Datum und Mahlzeiten
- Hinweis auf pünktliche Bereitstellung
- Professioneller, geschäftlicher Ton`;
      systemPrompt += `\n\n${customPrompt}`;
    } else if (message_type === 'contact_request') {
      const customPrompt = contactPrompt || `BESTELLUNG: Kontaktanfrage/Beschwerde
- Bedanke dich für die Nachricht
- Versichere schnelle Bearbeitung (15 Min)
- Zeige Verständnis
- Seriöser, empathischer Ton`;
      systemPrompt += `\n\n${customPrompt}`;
    }

    // Extrahiere relevante Bestelldetails
    const items = metadata?.items || [];
    const totalAmount = metadata?.totalAmount || 0;
    const deliveryLocation = metadata?.formData?.deliveryLocation || 'Zimmer';
    const roomNumber = metadata?.formData?.roomNumber || '';

    const userPrompt = `Erstelle eine Bestätigung für: ${customer_name}

${items.length > 0 ? `Bestellte Artikel: ${items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')}` : ''}
${totalAmount > 0 ? `Gesamtbetrag: ${totalAmount.toFixed(2)}€` : ''}
${roomNumber ? `Zimmer: ${roomNumber}` : ''}
${deliveryLocation ? `Lieferort: ${deliveryLocation}` : ''}

Schreibe eine freundliche Bestätigung (max. 150 Wörter).`;

    // 3. Rufe Lovable AI auf
    console.log('🤖 Calling Lovable AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        console.error('❌ Rate Limit erreicht');
        // Fallback-Antwort
        const fallbackReply = `Sehr geehrte/r ${customer_name},\n\nvielen Dank für Ihre Bestellung! Wir haben Ihre Anfrage erhalten und werden sie schnellstmöglich bearbeiten.\n\nBei Fragen stehen wir Ihnen jederzeit zur Verfügung.`;
        await updateAdminMessage(supabase, message_id, fallbackReply, hotelFooter, promotionalFooter);
        return new Response(JSON.stringify({ success: true, fallback: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway Fehler: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedReply = aiData.choices?.[0]?.message?.content || '';

    console.log('✅ AI Response:', generatedReply);

    // 4. Füge Footer hinzu
    let fullReply = generatedReply;
    if (promotionalFooter) {
      fullReply += `\n\n${promotionalFooter}`;
    }
    if (hotelFooter) {
      fullReply += `\n\n${hotelFooter}`;
    } else {
      fullReply += `\n\n─────────────────────────────────\nHotel Der Heidehof\nConference & SPA Resort ★★★★Superior\n📞 Telefon: +49 8458 64-0\n🌐 www.der-heidehof.de\n─────────────────────────────────`;
    }

    // 5. Update admin_messages mit generierter Antwort
    await updateAdminMessage(supabase, message_id, fullReply, hotelFooter, promotionalFooter);

    // 6. Optional: Sende WhatsApp/SMS an Gast (falls gewünscht)
    // TODO: Implementiere WhatsApp/SMS Versand an guest_phone

    return new Response(
      JSON.stringify({ 
        success: true, 
        reply: fullReply,
        message_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Auto AI Reply Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unbekannter Fehler' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateAdminMessage(
  supabase: any,
  message_id: string,
  reply: string,
  hotelFooter: string,
  promotionalFooter: string
) {
  const { error } = await supabase
    .from('admin_messages')
    .update({
      reply_content: reply,
      metadata: {
        ai_generated: true,
        ai_model: 'dynamic_from_settings',
        generated_at: new Date().toISOString(),
        hotel_footer: hotelFooter,
        promotional_footer: promotionalFooter
      }
    })
    .eq('id', message_id);

  if (error) {
    console.error('❌ Update admin_messages failed:', error);
    throw error;
  }

  console.log('✅ Admin message updated with AI reply');
}
