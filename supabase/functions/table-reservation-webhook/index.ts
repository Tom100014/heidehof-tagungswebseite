import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReservationData {
  name: string;
  room_number?: string;
  guest_type: string;
  reservation_date: string;
  reservation_time: string;
  person_count: number;
  contact_method: string;
  contact_value: string;
  special_requests?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🍽️ Table Reservation Webhook called');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody = await req.json();
    console.log('📝 Received webhook data:', requestBody);

    // Extract reservation data from Clara webhook
    const {
      name,
      room_number,
      guest_type = 'hotel_guest',
      reservation_date,
      reservation_time,
      person_count,
      contact_method = 'phone',
      contact_value,
      special_requests
    } = requestBody as ReservationData;

    // Validate required fields
    if (!name || !reservation_date || !reservation_time || !contact_value) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Pflichtfelder fehlen: Name, Datum, Uhrzeit und Kontaktdaten sind erforderlich.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(reservation_date)) {
      console.error('❌ Invalid date format');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Ungültiges Datumsformat. Verwenden Sie YYYY-MM-DD.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(reservation_time)) {
      console.error('❌ Invalid time format');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Ungültiges Zeitformat. Verwenden Sie HH:MM (z.B. 19:30).' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if date is not in the past
    const reservationDateTime = new Date(`${reservation_date}T${reservation_time}`);
    const now = new Date();
    if (reservationDateTime < now) {
      console.error('❌ Reservation date is in the past');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Das Reservierungsdatum liegt in der Vergangenheit.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare reservation data for database
    const dbReservationData = {
      name: name.trim(),
      room_number: room_number?.trim() || null,
      guest_type,
      reservation_date,
      reservation_time,
      person_count: parseInt(String(person_count)) || 2,
      contact_method,
      contact_value: contact_value.trim(),
      special_requests: special_requests?.trim() || null,
      status: 'pending'
    };

    console.log('💾 Saving reservation to database:', dbReservationData);

    // Save reservation to database
    const { data: reservation, error: reservationError } = await supabase
      .from('table_reservations')
      .insert(dbReservationData)
      .select()
      .single();

    if (reservationError) {
      console.error('❌ Database error:', reservationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Fehler beim Speichern der Reservierung. Bitte versuchen Sie es erneut.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Reservation saved successfully:', reservation);

    // Create admin notification message
    const adminMessage = {
      message_type: 'table_reservation',
      source_form: 'clara_webhook',
      recipient_type: 'admin',
      recipient_contact: 'admin@heidehof.de',
      message_content: `Neue Tischreservierung über KI-Assistent:
      
📋 RESERVIERUNGSDETAILS:
• Name: ${name}
• Datum: ${reservation_date}
• Uhrzeit: ${reservation_time}
• Personen: ${person_count}
• Zimmer: ${room_number || 'Nicht angegeben'}
• Gast-Typ: ${guest_type}
• Kontakt: ${contact_method} - ${contact_value}
${special_requests ? `• Besondere Wünsche: ${special_requests}` : ''}

🎯 AKTION ERFORDERLICH:
Diese Reservierung wurde automatisch über den KI-Assistenten erstellt und wartet auf Bestätigung.

📝 Reservierungs-ID: ${reservation.id}`,
      customer_name: name,
      room_number: room_number || null,
      order_reference: reservation.id,
      priority: true,
      metadata: {
        reservation_id: reservation.id,
        webhook_source: 'clara',
        automated: true
      }
    };

    // Save admin message
    const { error: messageError } = await supabase
      .from('admin_messages')
      .insert(adminMessage);

    if (messageError) {
      console.error('⚠️ Warning: Could not create admin message:', messageError);
      // Don't fail the whole request if admin message fails
    } else {
      console.log('📨 Admin notification created successfully');
    }

    // Return success response to Clara
    const successMessage = `Ihre Tischreservierung wurde erfolgreich erstellt! 

📅 Reservierung für ${name}
🕐 ${reservation_date} um ${reservation_time} Uhr
👥 ${person_count} Person${person_count > 1 ? 'en' : ''}
${room_number ? `🏨 Zimmer: ${room_number}` : ''}

Ihre Reservierung wird zeitnah von unserem Team bestätigt. Sie erhalten eine Bestätigung über ${contact_method === 'phone' ? 'WhatsApp/SMS' : contact_method}.

Reservierungs-ID: ${reservation.id.substring(0, 8)}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: successMessage,
        reservation_id: reservation.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte kontaktieren Sie unser Personal direkt.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});