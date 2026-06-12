
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse the request body
    const appointmentData = await req.json();
    
    console.log("Received appointment data:", appointmentData);
    console.log("🎯 SendMethod from frontend:", appointmentData.sendMethod);

    // Prüfen auf doppelte Anfragen durch requestId
    if (appointmentData.requestId) {
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('request_id', appointmentData.requestId)
        .limit(1);

      if (existingAppointments && existingAppointments.length > 0) {
        return new Response(JSON.stringify({ 
          success: true,
          data: existingAppointments,
          message: 'Appointment already exists'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // DIREKT in appointments speichern - OHNE komplizierte Verfügbarkeitsprüfung
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        name: appointmentData.name,
        room_number: appointmentData.roomNumber || appointmentData.spaKeyNumber || 'N/A',
        appointment_date: appointmentData.appointmentDate || appointmentData.date,
        time_preference: appointmentData.exactTime || appointmentData.timePreference || 'morning', 
        exact_time: appointmentData.exactTime || null,
        contact_method: appointmentData.contactMethod || 'phone',
        contact_value: appointmentData.phoneNumber || appointmentData.contactValue || '+4917634177214',
        notes: appointmentData.notes || null,
        treatment_id: appointmentData.treatmentId || null,
        treatment_name: appointmentData.treatmentName || null,
        request_id: appointmentData.requestId || `BEAUTY-${Date.now()}`,
        guest_type: appointmentData.guestType || 'room_guest',
        phone_number: appointmentData.phoneNumber || appointmentData.contactValue || '+4917634177214',
        status: 'pending',
        duration_minutes: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }

    console.log("Appointment created successfully:", data);

    // Also create admin message for tracking
    try {
      // Erstelle eine aussagekräftige Admin-Message basierend auf den Formulardaten
      const formattedDate = appointmentData.appointmentDate || appointmentData.date;
      const displayDate = formattedDate ? new Date(formattedDate).toLocaleDateString('de-DE') : 'N/A';
      
      // Bestimme den korrekten recipient_type basierend auf der gewählten Methode
      const recipientType = appointmentData.sendMethod === 'sms' ? 'sms' : 
                           appointmentData.sendMethod === 'whatsapp' ? 'whatsapp' : 
                           'whatsapp'; // Fallback auf WhatsApp wenn undefiniert
      
      console.log("🎯 Determined recipient_type:", recipientType, "from sendMethod:", appointmentData.sendMethod);

      const adminMessageData = {
        message_type: 'beauty_appointment',
        source_form: 'beauty_wellness',
        recipient_type: recipientType, // Dynamisch basierend auf gewählter Methode
        recipient_contact: '+4917634177214', // Beauty-Service-Nummer für Anzeige
        message_content: `🌸 Beauty & Wellness Terminanfrage | Gast: ${appointmentData.name} | Zimmer: ${appointmentData.roomNumber || appointmentData.spaKeyNumber || 'N/A'} | Wunschdatum: ${displayDate} | Wunschzeit: ${appointmentData.exactTime || 'N/A'} | Behandlung: ${appointmentData.treatmentName || 'N/A'} | Datenschutz: Ich habe die Datenschutzerklärung gelesen und akzeptiert. Vielen Dank!`,
        customer_name: appointmentData.name,
        room_number: appointmentData.roomNumber || appointmentData.spaKeyNumber,
        order_reference: appointmentData.requestId || `BEAUTY-${Date.now()}`,
        guest_phone_number: appointmentData.phoneNumber, // ✅ KORREKTE Kundennummer für Dashboard-Anzeige
        metadata: {
          guestType: appointmentData.guestType,
          treatmentId: appointmentData.treatmentId,
          treatmentName: appointmentData.treatmentName,
          appointmentDate: formattedDate,
          appointmentTime: appointmentData.exactTime,
          additionalRequests: appointmentData.notes,
          phoneNumber: appointmentData.phoneNumber, // ✅ ECHTE Kundennummer
          customerPhoneNumber: appointmentData.phoneNumber, // ✅ EXPLIZIT als Kundennummer markiert
          contactValue: appointmentData.phoneNumber, // ✅ KONTAKT-WERT für Extraktion
          roomNumber: appointmentData.roomNumber || appointmentData.spaKeyNumber, // ✅ ZIMMER-NUMMER für Extraktion
          sendMethod: appointmentData.sendMethod, // ✅ GEWÄHLTE VERSANDMETHODE für Dashboard-Konsistenz
          originalCustomerChoice: appointmentData.sendMethod // ✅ BACKUP der ursprünglichen Kundenwahl
        },
        priority: false,
        sent_at: new Date().toISOString(),
        status: 'sent'
      };

      const { error: adminError } = await supabase
        .from('admin_messages')
        .insert(adminMessageData);

      if (adminError) {
        console.error("Error creating admin message:", adminError);
        // Non-fatal - appointment was created successfully
      } else {
        console.log("Admin message created successfully");
      }
    } catch (adminError) {
      console.error("Error in admin message creation:", adminError);
      // Non-fatal - appointment was created successfully
    }

    return new Response(JSON.stringify({ 
      success: true,
      data,
      appointmentId: data?.[0]?.id || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in save-appointment function:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
