import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _authFail = await requireAdmin(req);
  if (_authFail) return _authFail;
  try {
    const { dateFrom, dateTo, prompt } = await req.json();
    if (!dateFrom || !dateTo) {
      return new Response(JSON.stringify({ error: "dateFrom/dateTo erforderlich" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    const sys = `Du bist ein Profi-Küchenchef in einem deutschen Hotel. Antworte ausschließlich mit gültigem JSON.`;
    const user = `Erstelle ${dayCount} Tagesmenüs ab ${dateFrom}. Jeder Tag enthält Mittag UND Abend, jeweils Vorspeise, 3 Hauptgänge (fish, meat, vegetarian), Dessert.

Anforderungen des Nutzers: ${prompt || 'klassische, saisonale deutsche Küche'}

Antworte NUR mit JSON-Array, jedes Objekt:
{
 "date":"YYYY-MM-DD",
 "lunch_appetizer":"...","lunch_dessert":"...",
 "lunch_main_dish_fish":{"id":"lf","name":"...","description":"...","type":"fish"},
 "lunch_main_dish_meat":{"id":"lm","name":"...","description":"...","type":"meat"},
 "lunch_main_dish_vegetarian":{"id":"lv","name":"...","description":"...","type":"vegetarian"},
 "dinner_appetizer":"...","dinner_dessert":"...",
 "dinner_main_dish_fish":{"id":"df","name":"...","description":"...","type":"fish"},
 "dinner_main_dish_meat":{"id":"dm","name":"...","description":"...","type":"meat"},
 "dinner_main_dish_vegetarian":{"id":"dv","name":"...","description":"...","type":"vegetarian"}
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI-Fehler: ${t}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiData = await aiRes.json();
    const content: string = aiData?.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Keine JSON-Liste in KI-Antwort gefunden");
    const menus = JSON.parse(jsonMatch[0]);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const saved: any[] = [];
    for (const m of menus) {
      const { data, error } = await supabase.from("conference_menus").upsert({
        menu_date: m.date,
        lunch_appetizer: m.lunch_appetizer ?? "",
        lunch_main_dish_fish: m.lunch_main_dish_fish ?? {},
        lunch_main_dish_meat: m.lunch_main_dish_meat ?? {},
        lunch_main_dish_vegetarian: m.lunch_main_dish_vegetarian ?? {},
        lunch_dessert: m.lunch_dessert ?? "",
        dinner_appetizer: m.dinner_appetizer ?? "",
        dinner_main_dish_fish: m.dinner_main_dish_fish ?? {},
        dinner_main_dish_meat: m.dinner_main_dish_meat ?? {},
        dinner_main_dish_vegetarian: m.dinner_main_dish_vegetarian ?? {},
        dinner_dessert: m.dinner_dessert ?? "",
      }, { onConflict: "menu_date" }).select().single();
      if (error) console.error(error);
      else saved.push(data);
    }

    return new Response(JSON.stringify({ success: true, menusCreated: saved.length, menus: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
