import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerOrder {
  order_source: string;
  category: string;
  total_amount: number;
  created_at: string;
  items: any;
}

interface AnalysisRequest {
  customerId: string;
  orders: CustomerOrder[];
  currentStats: {
    total_orders: number;
    total_spent: number;
    avg_order_value: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { customerId, orders, currentStats }: AnalysisRequest = await req.json();

    console.log(`🤖 Analyzing customer ${customerId} with ${orders.length} orders`);

    // 1. Calculate Intelligence Score (0-100)
    let score = 0;
    
    // Frequency score (40 points)
    const frequencyScore = Math.min((currentStats.total_orders / 20) * 40, 40);
    score += frequencyScore;
    
    // Spending score (30 points)
    const spendingScore = Math.min((currentStats.total_spent / 1000) * 30, 30);
    score += spendingScore;
    
    // Service variety score (20 points)
    const uniqueSources = new Set(orders.map(o => o.order_source)).size;
    const varietyScore = (uniqueSources / 4) * 20;
    score += varietyScore;
    
    // Recency score (10 points)
    const lastOrder = orders[0];
    if (lastOrder) {
      const daysSinceLastOrder = (Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = daysSinceLastOrder < 1 ? 10 : daysSinceLastOrder < 3 ? 7 : daysSinceLastOrder < 7 ? 4 : 0;
      score += recencyScore;
    }

    score = Math.round(Math.min(score, 100));

    // 2. Determine Customer Category
    let category = 'regular';
    if (currentStats.total_spent > 500) category = 'vip';
    else if (currentStats.total_orders > 10) category = 'power_user';
    else if (currentStats.total_orders <= 2) category = 'new';
    else if (score < 30) category = 'risk';

    // 3. Analyze Behavior Patterns
    const serviceCounts = orders.reduce((acc, order) => {
      acc[order.order_source] = (acc[order.order_source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteServices = Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([service]) => service);

    // Analyze time preferences
    const orderHours = orders.map(o => new Date(o.created_at).getHours());
    const avgOrderHour = orderHours.reduce((a, b) => a + b, 0) / orderHours.length;
    const timePreference = avgOrderHour < 12 ? 'Frühbucher' : avgOrderHour < 18 ? 'Mittag/Nachmittag' : 'Abendgast';

    // Analyze spending patterns
    const spendingTrend = orders.slice(0, 5).reduce((sum, o) => sum + o.total_amount, 0) / 5 > currentStats.avg_order_value
      ? 'steigend'
      : 'konstant';

    // 4. Generate AI Insights
    const insights = {
      profile_type: category === 'vip' ? 'Premium-Gast' : category === 'power_user' ? 'Stammgast' : 'Gelegenheitsgast',
      behavior: {
        time_preference: timePreference,
        spending_trend: spendingTrend,
        service_affinity: favoriteServices[0] || 'keine Präferenz',
      },
      recommendations: [],
      risk_factors: [],
    };

    // Generate recommendations based on behavior
    if (favoriteServices[0] === 'beauty' && !favoriteServices.includes('shop')) {
      insights.recommendations.push('Spa-Produkte im Shop empfehlen');
    }
    if (favoriteServices[0] === 'room_service' && currentStats.avg_order_value > 40) {
      insights.recommendations.push('Premium-Menü-Paket anbieten');
    }
    if (category === 'vip' && !favoriteServices.includes('beauty')) {
      insights.recommendations.push('VIP Spa-Behandlung vorschlagen');
    }
    if (currentStats.total_orders > 5 && spendingTrend === 'steigend') {
      insights.recommendations.push('Treueprogramm / Rabatt anbieten');
    }

    // Risk detection
    const daysSinceLastOrder = lastOrder 
      ? (Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    
    if (daysSinceLastOrder > 3 && category !== 'new') {
      insights.risk_factors.push('Keine Aktivität seit 3+ Tagen');
    }
    if (currentStats.avg_order_value < 20 && currentStats.total_orders > 5) {
      insights.risk_factors.push('Niedrige Ausgaben - Zufriedenheit prüfen');
    }

    // 5. Calculate upsell probability
    let upsellProbability = 0;
    if (category === 'vip') upsellProbability += 40;
    else if (category === 'power_user') upsellProbability += 30;
    
    if (spendingTrend === 'steigend') upsellProbability += 20;
    if (uniqueSources >= 3) upsellProbability += 15;
    if (daysSinceLastOrder < 1) upsellProbability += 25;

    upsellProbability = Math.min(upsellProbability, 100);

    // 6. Update customer profile
    const { error } = await supabase
      .from('customer_profiles')
      .update({
        intelligence_score: score,
        customer_category: category,
        ai_insights: insights,
        favorite_services: favoriteServices,
        avg_order_value: currentStats.avg_order_value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (error) throw error;

    console.log(`✅ Analysis complete: Score ${score}, Category ${category}`);

    return new Response(
      JSON.stringify({
        success: true,
        score,
        category,
        insights,
        upsellProbability,
        favoriteServices,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
