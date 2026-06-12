
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatLocationDetails(
  deliveryLocation = "",
  tableOrBed = "",
  tableNumber = "",
  bedNumber = "",
  tentNumber = "",
  specificLocation = ""
): string {
  let formattedLocation = deliveryLocation;

  // Add specific details based on location type
  if (deliveryLocation === "Terrasse") {
    if (tableOrBed === "table" && tableNumber) {
      formattedLocation += `, Tisch ${tableNumber}`;
    } else if (tableOrBed === "bed" && bedNumber) {
      formattedLocation += `, Liege ${bedNumber}`;
    } else if (tableOrBed === "tent" && tentNumber) {
      formattedLocation += `, ${tentNumber === "tent1" ? "Zelt 1 (Strandseite)" : "Zelt 2 (Poolseite)"}`;
    }
  } else if (deliveryLocation === "Bar-Innenbereich" && tableNumber) {
    formattedLocation += `, Tisch ${tableNumber}`;
  } else if (deliveryLocation === "Wellnessbereich" && bedNumber) {
    formattedLocation += `, Liege ${bedNumber}`;
  } else if (deliveryLocation === "Zimmer" && specificLocation) {
    formattedLocation += ` ${specificLocation}`;
  }

  // Add additional description if provided
  if (specificLocation && deliveryLocation !== "Zimmer") {
    formattedLocation += ` (${specificLocation})`;
  }

  return formattedLocation;
}

serve(async (req) => {
  // CORS-Preflight-Anfragen behandeln
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Umgebungsvariablen für Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Daten aus dem Request extrahieren mit besserer Fehlerbehandlung
    let formData, channel, phoneNumber;
    
    try {
      const requestData = await req.json();
      formData = requestData.formData;
      channel = requestData.channel;
      phoneNumber = requestData.phoneNumber;
    } catch (parseError) {
      console.error("JSON Parse Fehler:", parseError);
      throw new Error("Ungültiges Request-Format: " + parseError.message);
    }
    
    if (!formData || !channel) {
      throw new Error("Fehlende Daten: formData und channel werden benötigt");
    }
    
    console.log("Empfangene Formulardaten:", JSON.stringify(formData, null, 2));
    
    // Nachrichtentext basierend auf dem Kanal generieren
    let messageText = "";
    let messageUrl = "";
    
    try {
      // Je nach Kanal unterschiedliche Nachrichtenformate erstellen
      if (channel === "whatsapp") {
        messageText = generateWhatsAppMessage(formData);
        // Telefonnummer bereinigen und URL erstellen
        const cleanedNumber = phoneNumber.replace(/\+/g, '').replace(/\s/g, '');
        // Direkt mit wa.me API
        messageUrl = `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(messageText)}`;
      } else if (channel === "sms") {
        messageText = generateSMSMessage(formData);
        // Für SMS verwenden wir das URL-Schema
        messageUrl = `sms:${phoneNumber}?body=${encodeURIComponent(messageText)}`;
      } else {
        messageText = generateStandardMessage(formData);
        messageUrl = null;
      }
      
      console.log(`${channel.toUpperCase()} URL generated:`, messageUrl);
      
      // Logging in Supabase mit besserer Fehlerbehandlung
      try {
        const { error: logError } = await supabase
          .from('notifications')
          .insert({
            order_id: formData.name ? formData.name.substring(0, 36) : 'unknown',
            channel,
            payload: { 
              formData, 
              messageText, 
              messageUrl 
            },
            success: true
          });
        
        if (logError) {
          console.warn("Fehler beim Logging:", logError);
        }
      } catch (logError) {
        console.warn("Logging-Fehler (nicht kritisch):", logError);
        // Logging-Fehler unterdrücken, um die Funktionsausführung fortzusetzen
      }
      
      // Erfolgreiche Antwort senden
      return new Response(JSON.stringify({ 
        success: true, 
        messageUrl,
        messageText
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      });
    } catch (formatError) {
      console.error("Fehler bei der Nachrichtengenerierung:", formatError);
      throw formatError;
    }
    
  } catch (error) {
    console.error("Edge Function-Fehler:", error);
    
    // Fehler zurückgeben
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Unbekannter Fehler"
    }), {
      status: 400,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
  }
});

// Helper-Funktionen zur Nachrichtenerstellung
function generateWhatsAppMessage(formData) {
  // Extrahiere Bestellartikel aus formData
  const items = formData.items || [];
  
  // Formatiere den Lieferort mit allen Details
  const fullLocation = formatLocationDetails(
    formData.deliveryLocation || "",
    formData.tableOrBed,
    formData.tableNumber,
    formData.bedNumber,
    formData.tentNumber,
    formData.specificLocation
  );
  
  // Gästeinformationen extrahieren
  const guestType = formData.guestType || "hotel_guest";
  const isHotelGuest = guestType === "hotel_guest";
  const keyNumber = formData.keyNumber || "";
  const roomNumber = formData.roomNumber || "";
  const guestInfo = isHotelGuest ? 
    `*Hotelgast* (Zimmer ${roomNumber})` : 
    `*Spa-Gast* (Schlüssel ${keyNumber})`;
  
  const timeInfo = formData.desiredTime === "specific" ? formData.specificTime : "Sofort";
  
  const orderedItems = items.map(item => 
    `• ${item.quantity}x ${item.name} (${item.price})${item.notes ? ` - _${item.notes}_` : ''}`
  ).join('\n');
  
  const totalAmount = calculateTotal(items).toFixed(2);
  
  // Name mit Vor- und Nachname
  const fullName = `${formData.firstName || ''} ${formData.name || ''}`.trim();
  
  return `
*🍽️ Neue Bestellung*

Guten Tag, ich bin ${fullName} und bestelle hiermit:

${orderedItems}

*👤 Gastinformationen:*
${guestInfo}

*📍 Lieferung an:*
${fullLocation}
*⏰ Wunschzeit:* ${timeInfo}

*📱 Kontakt:*
${formData.contactValue}

*💰 Gesamtbetrag:* ${totalAmount} €

${formData.allergies ? `*⚠️ Allergien/Sonderwünsche:*\n${formData.allergies}` : ''}

Vielen Dank!
  `.trim();
}

function generateSMSMessage(formData) {
  // Extrahiere Bestellartikel aus formData
  const items = formData.items || [];
  
  // Formatiere den Lieferort mit allen Details
  const fullLocation = formatLocationDetails(
    formData.deliveryLocation || "",
    formData.tableOrBed,
    formData.tableNumber,
    formData.bedNumber,
    formData.tentNumber,
    formData.specificLocation
  );
  
  // Gästeinformationen extrahieren
  const guestType = formData.guestType || "hotel_guest";
  const isHotelGuest = guestType === "hotel_guest";
  const keyNumber = formData.keyNumber || "";
  const roomNumber = formData.roomNumber || "";
  const guestInfo = isHotelGuest ? `Zimmer ${roomNumber}` : `Spa-Schlüssel ${keyNumber}`;
  
  const timeInfo = formData.desiredTime === "specific" ? formData.specificTime : "Sofort";
  
  const orderedItems = items.map(item => `${item.quantity}x ${item.name}`).join(', ');
  
  const totalAmount = calculateTotal(items).toFixed(2);
  
  // Name mit Vor- und Nachname
  const fullName = `${formData.firstName || ''} ${formData.name || ''}`.trim();
  
  return `
Bestellung: ${fullName}
Gast: ${guestInfo}
Artikel: ${orderedItems}
Ort: ${fullLocation}
Zeit: ${timeInfo}
Kontakt: ${formData.contactValue}
Summe: ${totalAmount}€
${formData.allergies ? `Info: ${formData.allergies}` : ''}
  `.trim();
}

function generateStandardMessage(formData) {
  // Basis-Nachrichtenformat für allgemeine Verwendung
  return generateWhatsAppMessage(formData);
}

function calculateTotal(items) {
  return items.reduce((total, item) => {
    let itemPrice = 0;
    if (typeof item.price === 'number') {
      itemPrice = item.price * item.quantity;
    } else if (typeof item.price === 'string') {
      const priceMatch = String(item.price).match(/(\d+[,.]\d+)/);
      if (priceMatch) {
        itemPrice = parseFloat(priceMatch[0].replace(',', '.')) * item.quantity;
      }
    }
    return total + itemPrice;
  }, 0);
}
