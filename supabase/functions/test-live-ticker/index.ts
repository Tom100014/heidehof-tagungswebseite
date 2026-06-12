import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testing Live Ticker System...');
    
    // Test API Keys
    const apiKeys = {
      gemini: Deno.env.get('GEMINI_API_KEY'),
      openai: Deno.env.get('OPENAI_API_KEY'),
      perplexity: Deno.env.get('PERPLEXITY_API_KEY')
    };

    console.log('🔑 API Keys Check:');
    Object.entries(apiKeys).forEach(([name, key]) => {
      console.log(`  ${name}: ${key ? '✅ SET' : '❌ MISSING'}`);
    });

    // Test live ticker call
    const testCategories = ['events', 'highlights', 'gastronomy'];
    const results = [];

    for (const category of testCategories) {
      console.log(`\n🎯 Testing category: ${category}`);
      
      try {
        const response = await fetch('https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/ingolstadt-live-ticker', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ category })
        });

        const data = await response.json();
        
        results.push({
          category,
          status: response.status,
          success: data.success,
          eventsCount: data.events?.length || 0,
          provider: data.provider,
          error: data.error,
          responseTime: Date.now()
        });

        console.log(`  Status: ${response.status}, Success: ${data.success}, Events: ${data.events?.length || 0}, Provider: ${data.provider}`);
        
      } catch (error) {
        console.error(`  ❌ Error testing ${category}:`, error.message);
        results.push({
          category,
          error: error.message,
          status: 'failed'
        });
      }
    }

    // Return comprehensive test results
    return new Response(JSON.stringify({
      testResults: results,
      apiKeysStatus: Object.fromEntries(
        Object.entries(apiKeys).map(([name, key]) => [name, !!key])
      ),
      timestamp: new Date().toISOString(),
      summary: {
        totalCategories: testCategories.length,
        successfulCategories: results.filter(r => r.success).length,
        availableAPIs: Object.values(apiKeys).filter(Boolean).length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Test failed:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});