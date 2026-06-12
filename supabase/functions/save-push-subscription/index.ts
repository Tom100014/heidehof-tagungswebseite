import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('💾 Save Push Subscription Service gestartet')
    
    // Supabase Client initialisieren
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { 
      user_id, 
      endpoint, 
      p256dh_key, 
      auth_key, 
      user_agent,
      action 
    } = await req.json()

    console.log('📨 Subscription Action:', action || 'save', 'für Endpoint:', endpoint?.substring(0, 50) + '...')

    // Delete Action
    if (action === 'delete') {
      const { error } = await supabase
        .from('web_push_subscriptions')
        .update({ is_active: false })
        .eq('endpoint', endpoint)

      if (error) {
        console.error('❌ Fehler beim Deaktivieren der Subscription:', error)
        return new Response(
          JSON.stringify({ success: false, error: 'Fehler beim Deaktivieren' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('✅ Push Subscription deaktiviert')
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription deaktiviert' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save/Update Action
    if (!endpoint || !p256dh_key || !auth_key) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Fehlende Subscription-Daten' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Subscription speichern/updaten
    const { data, error } = await supabase
      .from('web_push_subscriptions')
      .upsert({
        user_id: user_id || null,
        endpoint: endpoint,
        p256dh_key: p256dh_key,
        auth_key: auth_key,
        user_agent: user_agent || null,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint'
      })

    if (error) {
      console.error('❌ Fehler beim Speichern der Subscription:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Fehler beim Speichern der Subscription' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Push Subscription erfolgreich gespeichert')
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription erfolgreich gespeichert',
        data: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Save Push Subscription Fehler:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Service Fehler',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})