import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { getContactFormEmailTemplate } from "../_shared/email-templates.ts";

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
    const contactData = await req.json();
    
    console.log("Received complaint/contact request data:", contactData);

    // Create the contact request with improved validation and error handling
    const { data, error } = await supabase
      .from('contact_requests')
      .insert({
        name: contactData.name?.trim() || "Unbekannt",
        contact_type: contactData.contactType || "email",
        contact_value: contactData.contactValue?.trim() || null,
        allow_future_contact: contactData.allowFutureContact === false ? false : true, // Default to true if undefined
        service_context: contactData.serviceContext ? JSON.stringify(contactData.serviceContext) : null,
        room_number: contactData.roomNumber?.trim() || null,
        status: "neu", // Standardstatus für neue Beschwerden
        priority: contactData.priority || "normal",
        category: contactData.category || "complaint",
        complaint_text: contactData.complaintText?.trim() || contactData.message?.trim() || null
      })
      .select();

    if (error) {
      console.error("Fehler beim Erstellen der Beschwerde:", error);
      throw error;
    }

    console.log("Kontaktanfrage erfolgreich gespeichert:", data);

    // Send email confirmation if contact value is provided
    if (contactData.contactValue && contactData.contactType === "email") {
      try {
        const emailTemplate = getContactFormEmailTemplate({
          customerName: contactData.name || "Unbekannt",
          contactValue: contactData.contactValue,
          roomNumber: contactData.roomNumber || "Nicht angegeben",
          message: contactData.complaintText || contactData.message || "Keine Nachricht",
          contactId: data[0]?.id || "unknown"
        });

        // Get EmailJS credentials
        const serviceId = Deno.env.get('EMAILJS_SERVICE_ID');
        const publicKey = Deno.env.get('EMAILJS_PUBLIC_KEY');
        const templateId = Deno.env.get('EMAILJS_CUSTOMER_TEMPLATE_ID');

        if (serviceId && publicKey && templateId) {
          const emailData = {
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
              to_email: contactData.contactValue,
              from_name: "Hotel Heidehof",
              subject: "Bestätigung Ihrer Kontaktanfrage",
              message: emailTemplate
            }
          };

          const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
          });

          if (emailResponse.ok) {
            console.log('✅ E-Mail erfolgreich gesendet');
          } else {
            console.error('❌ E-Mail konnte nicht gesendet werden:', await emailResponse.text());
          }
        } else {
          console.warn('⚠️ EmailJS Konfiguration fehlt');
        }
      } catch (emailError) {
        console.error('❌ Fehler beim Senden der E-Mail:', emailError);
        // Continue without throwing error - don't fail the request if email fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Kontaktanfrage erfolgreich gespeichert und Bestätigung gesendet",
      data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Fehler in store-contact-request Funktion:", error);
    return new Response(JSON.stringify({ 
      success: false,
      message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});