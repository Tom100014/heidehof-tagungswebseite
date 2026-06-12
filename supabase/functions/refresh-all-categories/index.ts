/**
 * Edge Function: refresh-all-categories
 * Triggers the ingolstadt-live-refresh function for all time windows to generate fresh snapshots
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSupabaseServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, serviceRole);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseServiceClient();
    
    // Trigger refresh for different time windows
    const timeWindows = ['morning', 'noon', 'afternoon'];
    const results = [];

    for (const window of timeWindows) {
      console.log(`Triggering refresh for ${window} window...`);
      
      const { data, error } = await supabase.functions.invoke('ingolstadt-live-refresh', {
        body: { 
          window_label: window,
          categories: [
            'highlights', 'events', 'kino', 'gastronomy', 'nightlife', 'culture',
            'museums', 'live_music', 'wellness', 'sports', 'outdoor', 'altmuehltal',
            'shopping', 'markets', 'kids', 'transport', 'audi', 'insider_tips'
          ]
        },
      });

      if (error) {
        console.error(`Error refreshing ${window}:`, error);
        results.push({ window, success: false, error: error.message });
      } else {
        console.log(`Successfully refreshed ${window}:`, data);
        results.push({ window, success: true, data });
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(JSON.stringify({
      message: 'Category refresh completed',
      results,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e: any) {
    console.error('refresh-all-categories fatal error', e);
    return new Response(JSON.stringify({ error: e?.message || 'unexpected error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});