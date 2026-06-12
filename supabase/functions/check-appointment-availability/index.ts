
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
    const { date, timePreference } = await req.json();
    
    if (!date || !timePreference) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: date and timePreference' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Query existing appointments for the given time slot
    const { data, error, count } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('appointment_date', date)
      .eq('time_preference', timePreference)
      .not('status', 'in', '(cancelled,abgesagt)');

    if (error) {
      throw error;
    }

    // Define maximum appointments per time slot
    // In a real application, this would depend on salon capacity
    const MAX_APPOINTMENTS_PER_SLOT = 2;
    const isAvailable = count !== null && count < MAX_APPOINTMENTS_PER_SLOT;

    return new Response(
      JSON.stringify({ 
        success: true, 
        available: isAvailable,
        currentCount: count
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error checking appointment availability:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
