import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All categories that need initial snapshots
const ALL_CATEGORIES = [
  'highlights', 'events', 'gastronomy', 'wellness', 'sports', 'outdoor',
  'altmuehltal', 'shopping', 'markets', 'kids', 'chauffeur', 'transport', 'audi',
  'insider_tips', 'kino', 'museums', 'live_music', 'culture', 'nightlife'
];

// Time windows for snapshots
type WindowLabel = 'morning' | 'noon' | 'afternoon' | 'overnight';
const WINDOWS: WindowLabel[] = ['morning', 'noon', 'afternoon'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Initial Snapshot Generation for ALL categories');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Process each category
    for (const category of ALL_CATEGORIES) {
      console.log(`\n📊 Processing category: ${category}`);

      try {
        // Call live ticker to generate fresh data
        const tickerResponse = await fetch(`${supabaseUrl}/functions/v1/ingolstadt-live-ticker`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ category })
        });

        const tickerData = await tickerResponse.json();

        if (!tickerData.success || !tickerData.events || tickerData.events.length === 0) {
          console.warn(`⚠️ No events from live ticker for ${category}`);
          results.push({
            category,
            status: 'skipped',
            reason: 'No events available',
            provider: tickerData.provider
          });
          failCount++;
          continue;
        }

        console.log(`✅ Got ${tickerData.events.length} events for ${category} from ${tickerData.provider}`);

        // Create snapshot for current window
        const currentHour = new Date().getUTCHours() + 1; // CET = UTC+1
        let windowLabel: WindowLabel = 'morning';
        if (currentHour >= 11 && currentHour < 15) windowLabel = 'noon';
        else if (currentHour >= 15 && currentHour < 22) windowLabel = 'afternoon';

        // Calculate window bounds
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = now.getUTCMonth();
        const d = now.getUTCDate();
        
        let window_start: Date, window_end: Date;
        if (windowLabel === 'morning') {
          window_start = new Date(Date.UTC(y, m, d, 4, 0, 0));
          window_end = new Date(Date.UTC(y, m, d, 10, 0, 0));
        } else if (windowLabel === 'noon') {
          window_start = new Date(Date.UTC(y, m, d, 10, 0, 0));
          window_end = new Date(Date.UTC(y, m, d, 16, 0, 0));
        } else {
          window_start = new Date(Date.UTC(y, m, d, 16, 0, 0));
          window_end = new Date(Date.UTC(y, m, d, 22, 0, 0));
        }

        // Insert snapshot
        const { error: insertError } = await supabase
          .from('ingolstadt_live_snapshots')
          .insert({
            category,
            window_label: windowLabel,
            payload: tickerData.events,
            sources: tickerData.sources || [],
            window_start: window_start.toISOString(),
            window_end: window_end.toISOString(),
            generated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`❌ Insert error for ${category}:`, insertError);
          results.push({
            category,
            status: 'failed',
            error: insertError.message
          });
          failCount++;
        } else {
          console.log(`✅ Snapshot saved for ${category} (${windowLabel} window)`);
          results.push({
            category,
            window: windowLabel,
            status: 'success',
            eventsCount: tickerData.events.length,
            provider: tickerData.provider
          });
          successCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Error processing ${category}:`, error);
        results.push({
          category,
          status: 'error',
          error: error.message
        });
        failCount++;
      }
    }

    console.log(`\n✅ Initial Snapshot Generation Complete!`);
    console.log(`   Success: ${successCount}/${ALL_CATEGORIES.length}`);
    console.log(`   Failed: ${failCount}/${ALL_CATEGORIES.length}`);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalCategories: ALL_CATEGORIES.length,
        successCount,
        failCount,
        categories: ALL_CATEGORIES
      },
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Fatal error in snapshot init:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
