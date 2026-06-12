import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔥 NEW BAR MAX ORDER SYSTEM STARTED - VOLLSTÄNDIGE PROTOKOLLIERUNG');
    console.log('🕐 Zeitstempel:', new Date().toISOString());
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json();
    console.log('📨 NEW SYSTEM: Empfangene Daten VOLLSTÄNDIG:', JSON.stringify(requestBody, null, 2));

    const { 
      customerName,
      roomNumber,
      tableNumber,
      deliveryLocation,
      specificLocation,
      desiredTime,
      specificTime,
      contactMethod,
      contactValue,
      items,
      itemsText,
      totalAmount,
      allergies,
      sendMethod,
      orderType
    } = requestBody;

    // Validierung
    if (!customerName || !itemsText || !contactValue) {
      throw new Error('Fehlende Pflichtfelder: customerName, itemsText, contactValue');
    }

    const orderReference = `BARMAX-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const venue = orderType === 'bar_max_snacks' ? 'Bar Mäx Snacks' : 'Bar Mäx';

    // 1. SCHRITT 1: API-Request Logging
    console.log('📋 SCHRITT 1: API-Request wird protokolliert...');
    const { error: logError } = await supabase
      .from('api_logs')
      .insert({
        endpoint: `save-bar-max-order/${orderType}`,
        request_data: requestBody,
        status_code: 200,
        created_at: new Date().toISOString()
      });
    
    if (logError) {
      console.error('⚠️ Fehler beim API-Logging (nicht kritisch):', logError);
    } else {
      console.log('✅ API-Request erfolgreich protokolliert');
    }

    // 2. SCHRITT 2: Speichere in restaurant_bar_orders
    console.log('💾 SCHRITT 2: Speichere in restaurant_bar_orders...');
    const orderDataForDb = {
      order_type: orderType || 'bar_max',
      customer_name: customerName,
      room_number: roomNumber,
      table_number: tableNumber,
      guest_type: 'hotel_guest',
      delivery_location: deliveryLocation,
      specific_location: specificLocation,
      desired_time: desiredTime === 'specific' ? specificTime : desiredTime || 'Sofort',
      contact_method: contactMethod,
      contact_value: contactValue,
      items: items || [],
      items_text: itemsText,
      total_amount: parseFloat(totalAmount) || 0,
      allergies: allergies,
      send_method: sendMethod,
      status: 'neu',
      priority: true,
      privacy_accepted: true,
      venue: venue
    };
    
    console.log('💾 Daten für restaurant_bar_orders:', JSON.stringify(orderDataForDb, null, 2));
    
    const { data: orderData, error: orderError } = await supabase
      .from('restaurant_bar_orders')
      .insert(orderDataForDb)
      .select()
      .single();

    if (orderError) {
      console.error('❌ FEHLER beim Speichern in restaurant_bar_orders:', orderError);
      console.error('❌ FEHLER Details:', JSON.stringify(orderError, null, 2));
      throw orderError;
    }

    console.log('✅ restaurant_bar_orders erfolgreich gespeichert, ID:', orderData.id);
    console.log('✅ Gespeicherte Daten:', JSON.stringify(orderData, null, 2));

    console.log('📨 SCHRITT 3: Speichere in admin_messages...');
    
    // Hole Hotel-Footer und Werbung aus hotel_settings
    const { data: hotelFooterData } = await supabase
      .from('hotel_settings')
      .select('setting_value')
      .eq('setting_key', 'message_footer')
      .maybeSingle();
    
    const { data: promotionalData } = await supabase
      .from('hotel_settings')
      .select('setting_value')
      .eq('setting_key', 'promotional_footer')
      .maybeSingle();
    
    const hotelFooter = hotelFooterData?.setting_value || `─────────────────────────────────
Hotel Der Heidehof
Conference & SPA Resort ★★★★Superior
📞 Telefon: +49 8458 64-0
🌐 www.der-heidehof.de
─────────────────────────────────`;
    
    const promotionalFooter = promotionalData?.setting_value || '';
    
    // Servierhinweise für verschiedene Produkte
    const buildServingInstructions = (items: any[]) => {
      const instructions: string[] = [];
      
      items?.forEach((item: any) => {
        const itemName = item.name?.toLowerCase() || '';
        
        // Getränke-spezifische Hinweise
        if (itemName.includes('cocktail') || itemName.includes('spritz') || itemName.includes('mojito')) {
          instructions.push(`\n🍹 *${item.name}:*`);
          instructions.push(`   • Mit frischen Kräutern garnieren`);
          instructions.push(`   • Eisgekühlt servieren`);
          instructions.push(`   • Optional: Strohhalm und Rührer`);
        } else if (itemName.includes('wein') || itemName.includes('champagner') || itemName.includes('sekt')) {
          instructions.push(`\n🍷 *${item.name}:*`);
          instructions.push(`   • Gekühlt bei 8-10°C servieren`);
          instructions.push(`   • Weinglas verwenden`);
        } else if (itemName.includes('bier')) {
          instructions.push(`\n🍺 *${item.name}:*`);
          instructions.push(`   • Gut gekühlt servieren (6-8°C)`);
          instructions.push(`   • Im passenden Glas servieren`);
        }
        
        // Speisen-spezifische Hinweise
        if (itemName.includes('pizza') || itemName.includes('flammkuchen')) {
          instructions.push(`\n🍕 *${item.name}:*`);
          instructions.push(`   • Heiß servieren (direkt aus dem Ofen)`);
          instructions.push(`   • Mit Pizzaschneider anrichten`);
          instructions.push(`   • Optional: Parmesan und Chili-Öl bereitstellen`);
        } else if (itemName.includes('burger') || itemName.includes('sandwich')) {
          instructions.push(`\n🍔 *${item.name}:*`);
          instructions.push(`   • Warm servieren`);
          instructions.push(`   • Mit Beilagen (Pommes/Salat) anrichten`);
          instructions.push(`   • Servietten bereitstellen`);
        } else if (itemName.includes('salat')) {
          instructions.push(`\n🥗 *${item.name}:*`);
          instructions.push(`   • Frisch und gekühlt servieren`);
          instructions.push(`   • Dressing separat anbieten`);
        } else if (itemName.includes('chips') || itemName.includes('nüsse')) {
          instructions.push(`\n🥜 *${item.name}:*`);
          instructions.push(`   • In Schale servieren`);
          instructions.push(`   • Bei Raumtemperatur genießen`);
        }
      });
      
      return instructions.length > 0 
        ? `\n\n📋 *Servierhinweise für Service-Team:*${instructions.join('\n')}` 
        : '';
    };
    
    const servingInstructions = buildServingInstructions(items);
    
    // Nachricht für Gäste (WhatsApp) - MIT Footer und Werbung
    const guestMessage = `🍺 *${venue} Bestellung*

Guten Tag, ich bin ${customerName} und bestelle hiermit:

${itemsText}

👤 *Gastinformationen:*
${roomNumber ? `Hotelgast (Zimmer ${roomNumber})` : `Spa-Gast (Schlüssel ${tableNumber || 'unbekannt'})`}

🚚 *Lieferung an:*
${deliveryLocation}${specificLocation ? ` (${specificLocation})` : ''}
⏰ *Gewünschte Zeit:* ${desiredTime === 'specific' ? specificTime : desiredTime || 'Sofort'}

📞 *Kontakt:*
${contactValue}

💰 *Gesamtbetrag:* ${totalAmount}€

${allergies ? `⚠️ *Allergien/Sonderwünsche:*\n${allergies}\n\n` : ''}🔒 *Datenschutz:* Ich habe die Datenschutzerklärung gelesen und akzeptiert. Widerruf jederzeit möglich an: reservierung@der-heidehof.de
${promotionalFooter ? `\n\n${promotionalFooter}` : ''}

${hotelFooter}

Vielen Dank!`;

    // Nachricht für Admin - MIT Servierhinweisen und Rezepturen
    const messageContent = `🍺 *${venue} Bestellung*

👤 *Kunde:* ${customerName}
${roomNumber ? `*Hotelgast* (Zimmer ${roomNumber})` : `*Spa-Gast* (Schlüssel ${tableNumber || 'unbekannt'})`}

📋 *Bestellung:*
${itemsText}

🚚 *Lieferung an:*
${deliveryLocation}${specificLocation ? ` (${specificLocation})` : ''}${roomNumber ? ` - Zimmer ${roomNumber}` : ''}
⏰ *Gewünschte Zeit:* ${desiredTime === 'specific' ? specificTime : desiredTime || 'Sofort'}

💰 *Gesamtbetrag:* ${totalAmount}€

${allergies ? `⚠️ *Allergien/Anmerkungen:*\n${allergies}\n\n` : ''}📞 *Kontakt:* ${contactValue}${servingInstructions}`;

    console.log('📨 Message Content für admin_messages:', messageContent);

    const adminMessageData = {
      message_type: 'bar_max_order',
      source_form: `${venue} Bestellung`,
      recipient_type: 'whatsapp',
      recipient_contact: contactValue || '+4917634177214',
      message_content: messageContent, // Admin-Nachricht MIT Servierhinweisen
      guest_phone_number: contactValue,
      customer_name: customerName,
      room_number: roomNumber || tableNumber,
      order_reference: orderReference,
      metadata: {
        order_id: orderData.id,
        order_type: orderType || 'bar_max',
        venue: venue,
        total_amount: parseFloat(totalAmount) || 0,
        items: items || [],
        send_method: sendMethod,
        contact_method: contactMethod,
        contact_value: contactValue,
        timestamp: new Date().toISOString(),
        guest_message: guestMessage, // Gast-Nachricht MIT Footer und Werbung
        admin_message: messageContent, // Admin-Nachricht MIT Servierhinweisen
        request_body: requestBody
      },
      status: 'sent',
      sent_at: new Date().toISOString(),
      priority: true
    };

    console.log('📨 Daten für admin_messages:', JSON.stringify(adminMessageData, null, 2));

    const { data: messageData, error: messageError } = await supabase
      .from('admin_messages')
      .insert(adminMessageData)
      .select()
      .single();

    if (messageError) {
      console.error('❌ FEHLER beim Speichern in admin_messages:', messageError);
      console.error('❌ FEHLER Details:', JSON.stringify(messageError, null, 2));
      // NICHT fatal - Hauptbestellung ist schon gespeichert
    } else {
      console.log('✅ admin_messages erfolgreich gespeichert, ID:', messageData.id);
      console.log('✅ Gespeicherte Message-Daten:', JSON.stringify(messageData, null, 2));
    }

    // 4. SCHRITT 4: Zusätzliche Protokollierung für Debugging
    console.log('🔍 SCHRITT 4: Zusätzliche Protokollierung...');
    const { error: debugLogError } = await supabase
      .from('api_logs')
      .insert({
        endpoint: `save-bar-max-order/${orderType}/success`,
        request_data: {
          order_id: orderData.id,
          message_id: messageData?.id,
          venue: venue,
          customer: customerName,
          total: totalAmount,
          items_count: items?.length || 0,
          success: true,
          timestamp: new Date().toISOString()
        },
        status_code: 200,
        created_at: new Date().toISOString()
      });
    
    if (debugLogError) {
      console.error('⚠️ Fehler beim Debug-Logging (nicht kritisch):', debugLogError);
    } else {
      console.log('✅ Debug-Protokollierung erfolgreich');
    }

    console.log('🎉 NEW BAR MAX SYSTEM: Bestellung komplett erfolgreich!');
    console.log('🎉 ALLE SCHRITTE PROTOKOLLIERT UND GESPEICHERT');
    console.log('🎉 Order ID:', orderData.id);
    console.log('🎉 Message ID:', messageData?.id);
    console.log('🎉 Venue:', venue);
    console.log('🎉 Zeitstempel Ende:', new Date().toISOString());

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bar Mäx Bestellung erfolgreich gespeichert und VOLLSTÄNDIG protokolliert',
        orderId: orderData.id,
        messageId: messageData?.id,
        orderReference: orderReference,
        venue: venue,
        timestamp: new Date().toISOString(),
        steps_completed: [
          'API-Request protokolliert',
          'restaurant_bar_orders gespeichert',
          'admin_messages gespeichert', 
          'Debug-Logs erstellt'
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 KRITISCHER FEHLER im neuen Bar Max System:', error);
    console.error('💥 FEHLER Details:', JSON.stringify(error, null, 2));
    console.error('💥 Stack Trace:', error.stack);
    console.error('💥 Zeitstempel Fehler:', new Date().toISOString());
    
    // Protokolliere auch Fehler in api_logs
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('api_logs')
        .insert({
          endpoint: 'save-bar-max-order/error',
          request_data: {
            error_message: error.message,
            error_stack: error.stack,
            timestamp: new Date().toISOString()
          },
          status_code: 500,
          error_message: error.message,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('💥 Konnte Fehler nicht protokollieren:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
        logged: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})