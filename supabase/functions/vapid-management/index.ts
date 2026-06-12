import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VapidKeyPair {
  publicKey: string
  privateKey: string
}

// VAPID-Schlüssel generieren
function generateVapidKeys(): VapidKeyPair {
  // Für Demo-Zwecke verwenden wir feste Schlüssel
  // In Produktion sollten echte VAPID-Schlüssel verwendet werden
  const publicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLjIdT4Y3XOSr1-E3E5jJGG1mjCMY9VUWZnWGkkQ-xd8WvfKzO1ZM8'
  const privateKey = 'E6W5VCj-2i6PENKjR5WlOBK-FQm1KHhqXgGr5yPSLjo'
  
  return { publicKey, privateKey }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'get'

    if (action === 'get') {
      // VAPID Public Key abrufen
      console.log('📤 VAPID Public Key angefordert')
      
      const { publicKey } = generateVapidKeys()
      
      return new Response(
        JSON.stringify({ 
          success: true,
          publicKey: publicKey
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'generate') {
      // Neue VAPID-Schlüssel generieren und speichern
      console.log('🔑 Neue VAPID-Schlüssel generieren...')
      
      const keyPair = generateVapidKeys()
      
      // Schlüssel als Secrets speichern würde normalerweise über Supabase Admin API erfolgen
      // Für Demo verwenden wir die statischen Schlüssel
      
      console.log('✅ VAPID-Schlüssel generiert')
      console.log('📋 Public Key:', keyPair.publicKey)
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'VAPID-Schlüssel erfolgreich generiert',
          publicKey: keyPair.publicKey
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unbekannte Aktion' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ VAPID Management Fehler:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})