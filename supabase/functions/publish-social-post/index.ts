
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
    const { content, hashtags, platform, scheduledTime, autoPost } = await req.json();
    
    const ocoyaApiKey = Deno.env.get('OCOYA_API_KEY');
    
    if (!ocoyaApiKey) {
      console.log('Ocoya API key not found, simulating post...');
      
      // Simulate successful post for demo
      return new Response(JSON.stringify({
        success: true,
        message: `Post erfolgreich ${scheduledTime ? 'geplant' : 'veröffentlicht'} auf ${platform}`,
        platform: platform,
        scheduled: !!scheduledTime,
        simulatedResponse: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare post data for Ocoya API
    const postData = {
      text: `${content}\n\n${hashtags}`,
      platforms: [platform],
      media_urls: [], // Add image URLs here if available
      publish_at: scheduledTime || null
    };

    // Call Ocoya API
    const response = await fetch('https://app.ocoya.com/api/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ocoyaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to publish post');
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Post erfolgreich ${scheduledTime ? 'geplant' : 'veröffentlicht'} auf ${platform}`,
      postId: result.id,
      platform: platform,
      scheduled: !!scheduledTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error publishing post:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
