import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🗄️ Kitchen Daily Archive Job gestartet um:', new Date().toISOString());

    // Berechne Zeitraum: Gestern 10:31 bis heute 10:30
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const periodStart = new Date(yesterday.getTime() + 10 * 60 * 60 * 1000 + 31 * 60 * 1000); // 10:31 gestern
    const periodEnd = new Date(today.getTime() + 10 * 60 * 60 * 1000 + 30 * 60 * 1000); // 10:30 heute
    const reportDate = yesterday.toISOString().split('T')[0]; // Gestern als Report-Datum

    console.log(`📅 Archiviere Daten für: ${reportDate}`);
    console.log(`⏰ Zeitraum: ${periodStart.toISOString()} bis ${periodEnd.toISOString()}`);

    // Log Job Start
    await supabase.from('kitchen_automation_logs').insert({
      job_type: 'daily_archive',
      execution_date: reportDate,
      status: 'running',
      details: { period_start: periodStart.toISOString(), period_end: periodEnd.toISOString() }
    });

    // Prüfe ob Archiv bereits existiert
    const { data: existingReport } = await supabase
      .from('kitchen_daily_reports')
      .select('id')
      .eq('report_date', reportDate)
      .maybeSingle();

    if (existingReport) {
      console.log(`📋 Bericht für ${reportDate} existiert bereits`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Bericht für ${reportDate} bereits vorhanden`,
          report_id: existingReport.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hole Menü-Daten für das Datum
    const { data: menuData } = await supabase
      .from('conference_menus')
      .select('*')
      .eq('menu_date', reportDate)
      .maybeSingle();

    // Hole Bestellungen für den Zeitraum
    const { data: ordersData } = await supabase
      .from('conference_orders')
      .select('*')
      .eq('order_date', reportDate)
      .order('created_at', { ascending: true });

    // Hole Admin Messages für den Zeitraum
    const { data: messagesData } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('message_type', 'conference_order')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString())
      .order('created_at', { ascending: true });

    // Berechne Statistiken
    const statistics = calculateStatistics(ordersData || [], messagesData || []);

    console.log(`📊 Statistiken berechnet:`, statistics);

    // Erstelle Archiv-Eintrag
    const { data: reportData, error: insertError } = await supabase
      .from('kitchen_daily_reports')
      .insert({
        report_date: reportDate,
        menu_data: menuData || {},
        orders_data: ordersData || [],
        statistics,
        total_orders: (ordersData || []).length,
        total_guests: statistics.totalMeals,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Fehler beim Erstellen des Archivs: ${insertError.message}`);
    }

    // Log Success
    await supabase.from('kitchen_automation_logs').insert({
      job_type: 'daily_archive',
      execution_date: reportDate,
      status: 'success',
      details: {
        report_id: reportData.id,
        total_orders: (ordersData || []).length,
        total_guests: statistics.totalMeals,
        statistics
      }
    });

    console.log(`✅ Tagesarchiv erfolgreich erstellt für ${reportDate}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Tagesarchiv für ${reportDate} erfolgreich erstellt`,
        report_id: reportData.id,
        statistics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fehler beim Archivieren:', error);

    // Log Error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from('kitchen_automation_logs').insert({
        job_type: 'daily_archive',
        execution_date: new Date().toISOString().split('T')[0],
        status: 'error',
        error_message: error.message,
        details: { error: error.toString() }
      });
    } catch (logError) {
      console.error('Fehler beim Loggen:', logError);
    }

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

function calculateStatistics(orders: any[], messages: any[]) {
  // Kombiniere Daten aus orders und messages für vollständige Statistik
  const allOrders = [...orders];

  // Füge Bestellungen aus messages hinzu (falls nicht in orders vorhanden)
  messages.forEach(msg => {
    if (msg.metadata?.extractedFromMessage) {
      const existingOrder = orders.find(o => o.order_reference === msg.metadata.orderReference);
      if (!existingOrder) {
        allOrders.push({
          id: msg.id,
          guest_name: msg.metadata.guestName || msg.customer_name,
          conference_room: msg.metadata.conferenceRoom,
          guest_type: msg.metadata.guestType,
          lunch_selection: msg.metadata.lunchSelection,
          dinner_selection: msg.metadata.dinnerSelection,
          order_date: msg.metadata.menuDate,
          created_at: msg.created_at
        });
      }
    }
  });

  const stats = {
    totalMeals: 0,
    lunchMeals: 0,
    dinnerMeals: 0,
    categories: {
      fish: 0,
      meat: 0,
      vegetarian: 0
    },
    byRoom: {
      berlin: { fish: 0, meat: 0, vegetarian: 0, total: 0 },
      hamburg: { fish: 0, meat: 0, vegetarian: 0, total: 0 },
      frankfurt: { fish: 0, meat: 0, vegetarian: 0, total: 0 },
      bonn: { fish: 0, meat: 0, vegetarian: 0, total: 0 }
    }
  };

  allOrders.forEach(order => {
    const room = (order.conference_room || '').toLowerCase();
    
    // Lunch
    if (order.lunch_selection) {
      stats.lunchMeals++;
      stats.totalMeals++;
      
      const lunchType = detectMealType(order.lunch_selection);
      stats.categories[lunchType]++;
      
      if (stats.byRoom[room]) {
        stats.byRoom[room][lunchType]++;
        stats.byRoom[room].total++;
      }
    }
    
    // Dinner
    if (order.dinner_selection) {
      stats.dinnerMeals++;
      stats.totalMeals++;
      
      const dinnerType = detectMealType(order.dinner_selection);
      stats.categories[dinnerType]++;
      
      if (stats.byRoom[room]) {
        stats.byRoom[room][dinnerType]++;
        stats.byRoom[room].total++;
      }
    }
  });

  return stats;
}

function detectMealType(selection: string): 'fish' | 'meat' | 'vegetarian' {
  const lowerSelection = selection.toLowerCase();
  
  if (lowerSelection.includes('fisch') || lowerSelection.includes('lachs') || 
      lowerSelection.includes('dorade') || lowerSelection.includes('zander')) {
    return 'fish';
  }
  
  if (lowerSelection.includes('vegetarisch') || lowerSelection.includes('gemüse') || 
      lowerSelection.includes('kichererbsen') || lowerSelection.includes('halloumi')) {
    return 'vegetarian';
  }
  
  return 'meat';
}