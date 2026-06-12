import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationRequest {
  title: string
  message: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  isTest?: boolean
  messageType?: string
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

    const { title, message, icon, badge, tag, data, isTest, messageType } = await req.json() as PushNotificationRequest

    console.log('📥 Push Notification Anfrage:', { title, message, messageType, isTest })

    // Für Demo-Zwecke verwenden wir feste VAPID-Schlüssel
    const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLjIdT4Y3XOSr1-E3E5jJGG1mjCMY9VUWZnWGkkQ-xd8WvfKzO1ZM8'
    const vapidPrivateKey = 'E6W5VCj-2i6PENKjR5WlOBK-FQm1KHhqXgGr5yPSLjo'

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'VAPID keys not configured',
          sentCount: 0
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Aktive Push-Subscriptions aus der Datenbank holen
    const { data: subscriptions, error: dbError } = await supabaseClient
      .from('web_push_subscriptions')
      .select('*')
      .eq('is_active', true)

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database error',
          sentCount: 0
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ No active push subscriptions found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active subscriptions',
          sentCount: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Hotel-spezifisches Notification Payload erstellen
    const emoji = getMessageTypeEmoji(messageType || 'general')
    const notificationPayload = {
      title: `${emoji} ${title}`,
      body: message,
      icon: icon || '/favicon.ico',
      badge: badge || '/favicon.ico',
      tag: tag || messageType || 'hotel-notification',
      data: {
        ...data,
        url: data?.url || getAdminRouteForMessageType(messageType || 'general'),
        messageType: messageType,
        timestamp: Date.now(),
        hotelService: true
      },
      actions: [
        {
          action: 'open',
          title: 'Dashboard öffnen'
        },
        {
          action: 'close',
          title: 'Schließen'
        }
      ],
      requireInteraction: false, // Automatisch ausblenden nach einiger Zeit
      vibrate: getVibrationPattern(messageType || 'general'),
      silent: false
    }

    console.log('📋 Notification Payload:', notificationPayload)

    let sentCount = 0
    const failedSubscriptions: string[] = []

    // Web Push Setup mit jsr:@negrel/webpush
    const { ApplicationServer, importVapidKeys } = await import("jsr:@negrel/webpush@0.5.0");
    const vapidKeys = await importVapidKeys({ publicKey: vapidPublicKey, privateKey: vapidPrivateKey }, { extractable: false });
    const appServer = await ApplicationServer.new({
      contactInformation: 'mailto:admin@der-heidehof.de',
      vapidKeys,
    });

    // Push-Notifications an alle Subscriptions senden
    for (const subscription of subscriptions) {
      try {
        const sub = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
          },
        };

        const subscriber = appServer.subscribe(sub as any);
        await subscriber.pushTextMessage(JSON.stringify(notificationPayload), {});

        sentCount++
        console.log(`✅ Push notification erfolgreich gesendet an Subscription ${subscription.id}`)
        
      } catch (error) {
        console.error(`❌ Fehler beim Senden an Subscription ${subscription.id}:`, error)
        failedSubscriptions.push(subscription.id)
      }
    }

    // Fehlgeschlagene Subscriptions deaktivieren
    if (failedSubscriptions.length > 0) {
      await supabaseClient
        .from('web_push_subscriptions')
        .update({ is_active: false })
        .in('id', failedSubscriptions)
    }

    console.log(`📊 Push Notification Ergebnis: ${sentCount}/${subscriptions.length} erfolgreich`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount,
        totalSubscriptions: subscriptions.length,
        failedCount: failedSubscriptions.length,
        message: `${sentCount} Push-Benachrichtigungen erfolgreich gesendet`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as any).message ?? String(error),
        sentCount: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Hilfsfunktionen für Hotel-spezifische Push Notifications
function getMessageTypeEmoji(messageType: string): string {
  const emojis: { [key: string]: string } = {
    'restaurant_reservation': '🍽️',
    'table_reservation': '🍽️',
    'bar_max_order': '🍷',
    'conference_order': '🏢',
    'beauty_appointment': '💅',
    'contact_complaint': '⚠️',
    'shop_order': '🛍️'
  }
  return emojis[messageType] || '📱'
}

function getVibrationPattern(messageType: string): number[] {
  const patterns: { [key: string]: number[] } = {
    'restaurant_reservation': [200, 100, 200],
    'bar_max_order': [150, 50, 150, 50, 150],
    'beauty_appointment': [300, 150, 300],
    'contact_complaint': [100, 50, 100, 50, 100, 50, 100],
    'conference_order': [250, 100, 250],
    'shop_order': [180, 80, 180]
  }
  return patterns[messageType] || [200, 100, 200]
}

function getAdminRouteForMessageType(messageType: string): string {
  const routes: { [key: string]: string } = {
    restaurant_reservation: '/admin/service',
    table_reservation: '/admin/service',
    bar_max_order: '/admin/service',
    conference_order: '/admin/conference-orders',
    beauty_appointment: '/admin/service?filter=wellness',
    contact_complaint: '/admin/service',
    shop_order: '/admin/service',
  }
  return routes[messageType] || '/admin'
}

async function simulatePushSending(subscription: any, payload: any): Promise<void> {
  // Simuliere Netzwerk-Latenz
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  
  // Simuliere 95% Erfolgsrate
  if (Math.random() < 0.95) {
    console.log(`✅ Mock Push erfolgreich an ${subscription.endpoint.substring(0, 50)}...`)
    return
  } else {
    throw new Error('Mock Push failure - network timeout')
  }
}
