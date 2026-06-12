
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const supabaseUrl = 'https://obwhklmahawqmwyfzkke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  
  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing video key parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try to fetch the video URL from hotel_settings
    const { data, error } = await supabase
      .from('hotel_settings')
      .select('value')
      .eq('id', key)
      .maybeSingle();
      
    if (error) {
      throw error;
    }
    
    if (!data || !data.value) {
      return new Response(JSON.stringify({ 
        data: null, 
        message: 'No video found for the given key' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Extract URL based on value format
    let url: string | null = null;
    
    if (typeof data.value === 'object' && data.value !== null && 'url' in data.value) {
      url = data.value.url as string;
    } else if (typeof data.value === 'string') {
      url = data.value;
    }
    
    return new Response(JSON.stringify({ 
      data: { url },
      message: 'Video URL retrieved successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error retrieving video URL:', error);
    return new Response(JSON.stringify({ 
      error: 'Error retrieving video URL', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
