
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const orderData = await req.json();
    
    console.log("Eingegangene Bestellung:", JSON.stringify(orderData));

    // Erweiterte Validierung der Bestelldaten
    const validationErrors = [];
    
    if (!orderData.name || !orderData.name.trim()) {
      validationErrors.push("Der Name darf nicht leer sein");
    }
    
    if (!orderData.zustellort || !orderData.zustellort.trim()) {
      validationErrors.push("Der Zustellort darf nicht leer sein");
    }
    
    if (!orderData.speisen || !orderData.speisen.trim()) {
      validationErrors.push("Die Bestellung enthält keine Speisen");
    }
    
    if (!orderData.kontakt || !orderData.kontakt.trim()) {
      validationErrors.push("Die Kontaktinformationen dürfen nicht leer sein");
    }
    
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          message: validationErrors.join("; ")
        }
      }), {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      });
    }

    // Verbessertes Error-Handling mit Try-Catch
    try {
      // Speichere die Bestellung mit besserer Fehlerbehandlung
      const { data: orderRecord, error: orderError } = await supabase
        .from('restaurant_orders')
        .insert({
          category: orderData.kategorie || 'fine_dining',
          guest_type: 'unknown',
          guest_name: orderData.name,
          table_or_room: orderData.zustellort,
          items: [{ name: orderData.speisen, quantity: 1 }],
          notes: [
            orderData.wunschzeit ? `Wunschzeit: ${orderData.wunschzeit}` : null,
            orderData.kontakt ? `Kontakt: ${orderData.kontakt}` : null,
            orderData.sonderwunsche ? `Sonderwünsche: ${orderData.sonderwunsche}` : null,
            orderData.versandart ? `Versandart: ${orderData.versandart}` : null,
            orderData.total ? `Total: ${orderData.total}` : null,
          ].filter(Boolean).join(' · '),
          source: 'web-order',
          status: 'new',
        })
        .select();

      if (orderError) {
        console.error("Fehler beim Speichern der Bestellung:", orderError);
        throw orderError;
      }

      console.log("Bestellung erfolgreich gespeichert:", orderRecord);

      // Cache invalidieren für Echtzeit-Updates
      const timestamp = Date.now().toString();
      void supabase
        .from('offline_requests')
        .insert({
          request_type: 'invalidate_cache',
          payload: { 
            type: 'order_created',
            timestamp 
          }
        })
        .then(({ error }) => {
          if (error) console.warn("Cache invalidation skipped:", error.message);
        });

      return new Response(JSON.stringify({ 
        success: true,
        data: orderRecord,
        orderId: orderRecord && orderRecord.length > 0 ? orderRecord[0].id : null
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
    } catch (dbError: any) {
      console.error("Datenbank-Fehler:", dbError);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: {
          message: dbError.message || "Datenbankfehler beim Speichern der Bestellung",
          details: dbError.details || null
        }
      }), {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
    }
  } catch (error: any) {
    console.error("Fehler in save-restaurant-order:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: {
        message: error.message || "Unbekannter Fehler beim Speichern der Bestellung",
        stack: error.stack || null
      }
    }), {
      status: 400,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});
