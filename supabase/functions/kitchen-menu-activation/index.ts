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

    console.log('🍽️ Kitchen Menu Activation Job gestartet um:', new Date().toISOString());

    const today = new Date().toISOString().split('T')[0];

    // Log Job Start
    await supabase.from('kitchen_automation_logs').insert({
      job_type: 'menu_activation',
      execution_date: today,
      status: 'running',
      details: { activation_time: new Date().toISOString() }
    });

    // Prüfe ob Menü für heute bereits existiert
    const { data: existingMenu } = await supabase
      .from('conference_menus')
      .select('id, menu_date')
      .eq('menu_date', today)
      .maybeSingle();

    if (existingMenu) {
      console.log(`📋 Menü für ${today} bereits vorhanden, Aktivierung übersprungen`);
      
      await supabase.from('kitchen_automation_logs').insert({
        job_type: 'menu_activation',
        execution_date: today,
        status: 'success',
        details: { 
          message: 'Menu already exists',
          menu_id: existingMenu.id,
          skipped: true
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Menü für ${today} bereits vorhanden`,
          menu_id: existingMenu.id,
          skipped: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generiere neues Menü für heute
    console.log(`🎯 Generiere neues Menü für ${today}`);

    const { data: newMenus, error: menuError } = await supabase.functions.invoke(
      'generate-conference-menus',
      {
        body: {
          dateFrom: today,
          dateTo: today,
          prompt: 'Frische, saisonale Küche mit ausgewogenen Nährstoffen und kulinarischer Exzellenz für Konferenzgäste.',
          automated: true,
          trigger: 'daily_activation'
        }
      }
    );

    if (menuError) {
      throw new Error(`Fehler bei Menü-Generierung: ${menuError.message}`);
    }

    if (!newMenus?.success || !newMenus?.menus?.length) {
      throw new Error('Keine Menüs wurden generiert');
    }

    const activatedMenu = newMenus.menus[0];
    console.log(`✅ Neues Menü generiert für ${today}:`, activatedMenu.id);

    // Optional: Generiere Küchen-Management-Daten
    try {
      const { data: kitchenData } = await supabase.functions.invoke(
        'generate-kitchen-management',
        {
          body: {
            menuId: activatedMenu.id,
            actionType: 'kitchen_plan',
            guestCount: 50,
            guestDistribution: {
              dayGuests: 30,
              overnightGuests: 20,
              vegetarian: 15,
              meat: 25,
              fish: 10
            },
            conferenceRooms: ['Berlin', 'Hamburg', 'Frankfurt', 'Bonn'],
            automated: true
          }
        }
      );

      console.log('🔧 Küchen-Management-Daten generiert');
    } catch (kitchenError) {
      console.warn('⚠️ Warnung: Küchen-Management-Daten konnten nicht generiert werden:', kitchenError);
    }

    // Log Success
    await supabase.from('kitchen_automation_logs').insert({
      job_type: 'menu_activation',
      execution_date: today,
      status: 'success',
      details: {
        menu_id: activatedMenu.id,
        menu_date: activatedMenu.menu_date,
        generated_at: new Date().toISOString(),
        automated: true
      }
    });

    console.log(`🎉 Menü-Aktivierung erfolgreich abgeschlossen für ${today}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Neues Menü für ${today} erfolgreich aktiviert`,
        menu_id: activatedMenu.id,
        menu_date: activatedMenu.menu_date,
        automated: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fehler bei Menü-Aktivierung:', error);

    // Log Error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from('kitchen_automation_logs').insert({
        job_type: 'menu_activation',
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