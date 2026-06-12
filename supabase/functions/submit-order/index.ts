
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data: orderPayload, channel } = await req.json();
    const items = Array.isArray(orderPayload?.items) ? orderPayload.items : [];

    // Umgebungsvariablen für Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Bestellung in der Datenbank speichern
    const { data: order, error: orderError } = await supabase
      .from('restaurant_orders')
      .insert({
        category: 'fine_dining',
        guest_type: 'unknown',
        guest_name: orderPayload?.name ?? null,
        table_or_room: orderPayload?.deliveryLocation ?? orderPayload?.contactValue ?? null,
        items,
        notes: [
          orderPayload?.desiredTime === 'specific' ? `Wunschzeit: ${orderPayload?.specificTime}` : 'Wunschzeit: Sofort',
          channel ? `Kanal: ${channel}` : null,
        ].filter(Boolean).join(' · '),
        source: 'web-order',
        status: `sent_via_${channel}_pending`,
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Erfolgreiche Antwort
    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: order.id 
      }), 
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Fehler beim Verarbeiten der Bestellung:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});
