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
    console.log('🔥 EDGE: log-admin-message aufgerufen');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json();
    console.log('📨 EDGE: Empfangene Daten:', {
      messageType: requestBody.messageType,
      sourceForm: requestBody.sourceForm,
      recipientType: requestBody.recipientType,
      customerName: requestBody.customerName,
      roomNumber: requestBody.roomNumber,
      hasMessageContent: !!requestBody.messageContent,
      messageContentLength: requestBody.messageContent?.length || 0,
      fullRequestBody: requestBody
    });

    const { 
      messageType, 
      sourceForm, 
      recipientType, 
      recipientContact, 
      messageContent, 
      customerName,
      customerPhone,
      roomNumber, 
      orderReference, 
      metadata, 
      priority 
    } = requestBody;

    // Validierung der Eingabedaten
    if (!messageType || !sourceForm || !recipientType || !messageContent) {
      const missingFields = [];
      if (!messageType) missingFields.push('messageType');
      if (!sourceForm) missingFields.push('sourceForm');
      if (!recipientType) missingFields.push('recipientType');
      if (!messageContent) missingFields.push('messageContent');
      
      console.error('❌ EDGE: Fehlende Pflichtfelder:', missingFields);
      throw new Error(`Fehlende Pflichtfelder: ${missingFields.join(', ')}`);
    }

    // Für Conference Orders: Verwende die Kundennummer als recipient_contact
    let finalRecipientContact = recipientContact;
    if (messageType === 'conference_order' && metadata?.customerPhoneNumber) {
      finalRecipientContact = metadata.customerPhoneNumber;
      console.log('📞 EDGE: Conference Order - verwende Kundennummer als recipient_contact:', finalRecipientContact);
    }

    // Extrahiere die Kundennummer: Priorität hat customerPhone, dann metadata
    const customerPhoneNumber = customerPhone || metadata?.phoneNumber || metadata?.contactValue || metadata?.customerPhoneNumber || metadata?.phone_number || null;
    console.log('📞 EDGE: Extrahierte Kundennummer für guest_phone_number:', customerPhoneNumber);

    const insertData = {
      message_type: messageType,
      source_form: sourceForm,
      recipient_type: recipientType,
      recipient_contact: finalRecipientContact,
      message_content: messageContent,
      customer_name: customerName,
      room_number: roomNumber,
      order_reference: orderReference,
      metadata: metadata || {},
      priority: priority || false,
      status: 'sent',
      guest_phone_number: customerPhoneNumber // KRITISCH: Setze die echte Kundennummer
    };

    console.log('📨 EDGE: Bereite Datenbank-Insert vor:', {
      message_type: insertData.message_type,
      source_form: insertData.source_form,
      recipient_type: insertData.recipient_type,
      customer_name: insertData.customer_name,
      room_number: insertData.room_number,
      order_reference: insertData.order_reference,
      priority: insertData.priority,
      status: insertData.status
    });

    // Insert message into admin_messages table using service role key
    const { data, error } = await supabase
      .from('admin_messages')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ EDGE: Datenbank-Fehler beim Einfügen:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        insertData
      });
      throw error
    }

    console.log('✅ EDGE: Admin message erfolgreich in Datenbank gespeichert:', {
      id: data.id,
      message_type: data.message_type,
      source_form: data.source_form,
      customer_name: data.customer_name,
      created_at: data.created_at
    });

    // WICHTIG: Sende die Nachricht tatsächlich per WhatsApp/SMS wenn es eine Admin-Reply ist
    let messagingResult = null;
    if (messageType === 'admin_reply' && recipientContact && recipientType) {
      try {
        console.log('📱 EDGE: Versuche Nachricht per', recipientType, 'zu senden an:', recipientContact);
        
        // Hole Twilio Credentials
        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
          console.error('❌ EDGE: Twilio credentials fehlen');
          throw new Error('Twilio credentials nicht konfiguriert');
        }

        // Formatiere Telefonnummer für WhatsApp/SMS
        let formattedPhone = recipientContact.replace(/[^\d+]/g, '');
        if (!formattedPhone.startsWith('+')) {
          if (formattedPhone.startsWith('49')) {
            formattedPhone = '+' + formattedPhone;
          } else if (formattedPhone.startsWith('0')) {
            formattedPhone = '+49' + formattedPhone.substring(1);
          } else {
            formattedPhone = '+49' + formattedPhone;
          }
        }

        const twilioUrl = recipientType === 'whatsapp' 
          ? `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
          : `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

        const twilioPayload = recipientType === 'whatsapp' 
          ? new URLSearchParams({
              'From': `whatsapp:${twilioPhoneNumber}`,
              'To': `whatsapp:${formattedPhone}`,
              'Body': messageContent
            })
          : new URLSearchParams({
              'From': twilioPhoneNumber,
              'To': formattedPhone,
              'Body': messageContent
            });

        console.log('📤 EDGE: Sende an Twilio:', {
          type: recipientType,
          to: formattedPhone,
          messageLength: messageContent.length
        });

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: twilioPayload.toString()
        });

        const twilioResult = await twilioResponse.json();
        
        if (twilioResponse.ok) {
          console.log('✅ EDGE: Nachricht erfolgreich gesendet via', recipientType, '- SID:', twilioResult.sid);
          messagingResult = {
            success: true,
            messageSid: twilioResult.sid,
            method: recipientType
          };
        } else {
          console.error('❌ EDGE: Twilio Fehler:', twilioResult);
          throw new Error(`Twilio Fehler: ${twilioResult.message}`);
        }

      } catch (messagingError) {
        console.error('❌ EDGE: Fehler beim Versenden der Nachricht:', messagingError);
        messagingResult = {
          success: false,
          error: messagingError.message,
          method: recipientType
        };
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin message logged successfully',
        messageId: data.id,
        messageType: data.message_type,
        sourceForm: data.source_form,
        messagingResult: messagingResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ EDGE: Kritischer Fehler in log-admin-message function:', {
      error,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        errorName: error.name,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})