
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'email';
  to: string;
  subject: string;
  templateParams: {
    customer_name: string;
    form_type: string;
    message_content: string;
    room_number: string;
    contact_method: string;
    contact_value: string;
    timestamp: string;
    priority: string;
  };
}

interface NotificationRequest {
  requestId: string;
  department: string;
  phoneNumber?: string; // Optional override
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Handle email notifications
    if (requestBody.type === 'email') {
      const emailRequest: EmailRequest = requestBody;
      
      // Get EmailJS credentials from environment
      const serviceId = Deno.env.get('EMAILJS_SERVICE_ID');
      const publicKey = Deno.env.get('EMAILJS_PUBLIC_KEY');
      const templateId = Deno.env.get('EMAILJS_ADMIN_TEMPLATE_ID'); // Use admin template for notifications

      if (!serviceId || !publicKey || !templateId) {
        console.error('Missing EmailJS configuration:', { serviceId: !!serviceId, publicKey: !!publicKey, templateId: !!templateId });
        throw new Error('EmailJS configuration missing');
      }

      // Prepare the email data for EmailJS API
      const emailData = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: emailRequest.to,
          to_name: 'Hotel Admin',
          from_name: emailRequest.templateParams.customer_name,
          subject: emailRequest.subject,
          message: `
Neue Nachricht über ${emailRequest.templateParams.form_type}

Von: ${emailRequest.templateParams.customer_name}
${emailRequest.templateParams.room_number ? `Zimmer: ${emailRequest.templateParams.room_number}` : ''}
${emailRequest.templateParams.contact_method ? `Kontakt: ${emailRequest.templateParams.contact_method} - ${emailRequest.templateParams.contact_value}` : ''}
Priorität: ${emailRequest.templateParams.priority}
Zeit: ${emailRequest.templateParams.timestamp}

Nachricht:
${emailRequest.templateParams.message_content}
          `.trim(),
          reply_to: emailRequest.templateParams.contact_value || 'noreply@hotel.com'
        }
      };

      console.log('Sending email via EmailJS API...', { to: emailRequest.to, subject: emailRequest.subject });

      // Send email via EmailJS API
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('EmailJS API error:', response.status, errorText);
        throw new Error(`EmailJS API error: ${response.status} - ${errorText}`);
      }

      const result = await response.text();
      console.log('Email sent successfully:', result);

      return new Response(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Handle form-based notifications with dynamic configuration
    const { requestId, department, phoneNumber, formId }: NotificationRequest & { formId?: string } = requestBody;
    
    // Create a Supabase client with the Admin API key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get target contact info from form configuration
    let targetPhone = phoneNumber;
    let targetEmail = '';
    
    if (formId && !phoneNumber) {
      console.log('Fetching configuration for form:', formId);
      
      // Try form_configurations first
      const { data: formConfig, error: formError } = await supabaseAdmin
        .from('form_configurations')
        .select('fields')
        .eq('id', formId)
        .eq('is_active', true)
        .maybeSingle();
        
      if (formConfig && formConfig.fields) {
        const fields = formConfig.fields as any;
        if (fields.sms_enabled && fields.target_number) {
          targetPhone = fields.target_number;
        }
        if (fields.email_enabled && fields.target_email) {
          targetEmail = fields.target_email;
        }
        console.log('Using form configuration:', { targetPhone, targetEmail });
      } else {
        // Fallback to general_service_config
        const { data: generalConfig, error: generalError } = await supabaseAdmin
          .from('general_service_config')
          .select('*')
          .limit(1)
          .maybeSingle();
          
        if (generalConfig) {
          if (generalConfig.sms_enabled && generalConfig.default_phone_number) {
            targetPhone = generalConfig.default_phone_number;
          }
          if (generalConfig.email_enabled && generalConfig.default_email) {
            targetEmail = generalConfig.default_email;
          }
          console.log('Using general configuration:', { targetPhone, targetEmail });
        }
      }
    }
    
    // Error if no configuration found - no hardcoded fallbacks
    if (!targetPhone) {
      console.error(`❌ No notification configuration found for formId: ${formId}, department: ${department}`);
      return new Response(
        JSON.stringify({ 
          error: "No notification configuration found",
          details: `No configuration available for form ${formId} and department ${department}`,
          formId,
          department
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate required fields
    if (!requestId || !department) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: request, error: requestError } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .eq('id', requestId)
      .single();
      
    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const formattedServiceInfo = request.service_context ? 
      `${request.service_context.serviceName}${request.service_context.items && request.service_context.items.length > 0 ? 
        `: ${request.service_context.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}` : 
        ''
      }` : 
      'Allgemeine Anfrage';
    
    const message = `Neue Anfrage von ${request.name}\n` +
      `Kontakt: ${request.contact_type === 'email' ? 'Email' : 'WhatsApp'}: ${request.contact_value}\n` +
      `Details: ${formattedServiceInfo}`;
    
    console.log(`[NOTIFICATION] To: ${targetPhone}, Message: ${message}, FormId: ${formId}`);
    
    const { error: updateError } = await supabaseAdmin
      .from('contact_requests')
      .update({ status: 'processing' })
      .eq('id', requestId);
      
    if (updateError) {
      console.error("Error updating request status:", updateError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification configured for ${targetPhone} (FormId: ${formId || 'none'})`,
        config: { targetPhone, targetEmail, formId }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
