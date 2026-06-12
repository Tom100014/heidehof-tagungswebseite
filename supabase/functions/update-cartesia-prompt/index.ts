// Generates the current Cartesia telephone-agent system prompt from Supabase.
// Cartesia currently does not expose a reliable public PATCH endpoint for the
// agent system prompt, so this function stores the prompt for manual copy in
// the Clara Cockpit.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt.");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

type MenuItem = Record<string, any>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function priceTag(priceLabel?: string | null, priceEur?: number | string | null): string {
  if (priceLabel) return ` (${priceLabel})`;
  if (priceEur != null && priceEur !== "") return ` (${Number(priceEur).toFixed(2)} EUR)`;
  return "";
}

function active(items: MenuItem[]) {
  return items.filter((item) => item.is_active !== false);
}

function groupBy(items: MenuItem[], key: string) {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const group = String(item[key] ?? "sonstiges");
    (acc[group] ??= []).push(item);
    return acc;
  }, {});
}

function buildFoodText(items: MenuItem[]): string {
  const labels: Record<string, string> = {
    vorspeise: "Vorspeisen",
    suppe: "Suppen",
    salat: "Salate",
    hauptgang_fleisch: "Hauptgang Fleisch",
    hauptgang_fisch: "Hauptgang Fisch",
    hauptgang_vegi: "Hauptgang vegetarisch",
    beilage: "Beilagen",
    dessert: "Desserts",
    kinder: "Kindergerichte",
    snack: "Snacks",
  };
  const order = [
    "vorspeise",
    "suppe",
    "salat",
    "hauptgang_fleisch",
    "hauptgang_fisch",
    "hauptgang_vegi",
    "beilage",
    "dessert",
    "kinder",
    "snack",
    "sonstiges",
  ];
  const grouped = groupBy(active(items), "course");
  return order
    .filter((course) => grouped[course]?.length)
    .map((course) => {
      const lines = grouped[course]
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
        .map((item) => {
          const flags = [
            item.is_vegan ? "vegan" : null,
            item.is_vegetarian && !item.is_vegan ? "vegetarisch" : null,
            item.is_glutenfree ? "glutenfrei" : null,
            Array.isArray(item.allergens) && item.allergens.length ? `Allergene: ${item.allergens.join(", ")}` : null,
          ].filter(Boolean);
          return `- ${item.title}${priceTag(item.price_label, item.price_eur)}${item.description ? `: ${item.description}` : ""}${flags.length ? ` [${flags.join(" | ")}]` : ""}`;
        });
      return `${labels[course] ?? course}:\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

function buildDrinkText(items: MenuItem[]): string {
  const labels: Record<string, string> = {
    aperitif: "Aperitif & Champagner",
    weisswein: "Weissweine",
    rotwein: "Rotweine",
    rose: "Roseweine",
    dessertwein: "Dessertwein",
    bier: "Biere",
    softdrink: "Softdrinks",
    wasser: "Wasser",
    kaffee: "Kaffee & Heissgetraenke",
    tee: "Tee",
    cocktail: "Cocktails",
    longdrink: "Longdrinks",
    spirituose: "Spirituosen / Whisky",
    digestif: "Digestifs / Bitters",
  };
  const order = [
    "aperitif",
    "weisswein",
    "rose",
    "rotwein",
    "dessertwein",
    "bier",
    "cocktail",
    "longdrink",
    "spirituose",
    "digestif",
    "softdrink",
    "wasser",
    "kaffee",
    "tee",
    "sonstiges",
  ];
  const grouped = groupBy(active(items), "category");
  return order
    .filter((category) => grouped[category]?.length)
    .map((category) => {
      const lines = grouped[category]
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
        .map((item) => {
          const meta = [
            item.volume_label,
            item.producer,
            item.region,
          ].filter(Boolean).join(", ");
          return `- ${item.title}${meta ? ` (${meta})` : ""}${priceTag(item.price_label, item.price_eur)}${item.description ? `: ${item.description}` : ""}`;
        });
      return `${labels[category] ?? category}:\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

function buildWellnessText(items: MenuItem[]): string {
  const grouped = groupBy(active(items), "category");
  return Object.keys(grouped)
    .sort()
    .map((category) => {
      const lines = grouped[category]
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
        .map((item) => {
          const duration = item.duration_label || (item.duration_minutes ? `${item.duration_minutes} Min.` : "");
          return `- ${item.title}${duration ? ` (${duration})` : ""}${priceTag(item.price_label, item.price_eur)}${item.description ? `: ${item.description}` : ""}`;
        });
      return `${category}:\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

async function getSettingString(key: string, fallback = "") {
  const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
  const value = data?.value;
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof (value as { id: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return fallback;
}

function buildPrompt(params: {
  food: MenuItem[];
  drinks: MenuItem[];
  wellness: MenuItem[];
  agentId: string;
  generatedAt: string;
}) {
  const foodCount = active(params.food).length;
  const drinkCount = active(params.drinks).length;
  const wellnessCount = active(params.wellness).length;

  return `Du bist Clara, die professionelle Telefon-Concierge des Hotel Der Heidehof Conference & Spa Resort in Gaimersheim bei Ingolstadt.

Du fuehrst echte, natuerliche Hotelgespraeche am Telefon. Du bist herzlich, ruhig, praezise und arbeitest wie eine sehr gute Rezeptionistin mit Service-, Bankett-, Kuechen- und Spa-Erfahrung.

STIMME, CHARME UND PRAESENZ:
- Du klingst, als wuerdest du beim Sprechen leicht laecheln: warm, zugewandt, sympathisch und souveraen.
- Ein kleines, sehr dezentes Lachen ist erlaubt, wenn es natuerlich passt, z. B. bei lockeren Gaestewitzen oder kleinen Alltagsmomenten. Sprich es nicht als "haha" aus, sondern formuliere subtil: "Das klingt nach einem sehr guten Plan."
- Du darfst charmant und leicht schlagfertig sein, aber nie frech, nie albern und nie auf Kosten des Gastes.
- Bei Beschwerden, Problemen, Krankheit, Laerm, Schaden oder Business-Entscheidungen bist du besonders ruhig, klar und empathisch.
- Dein Humor ist kurz, fein und serviceorientiert. Danach fuehrst du sofort wieder zum Ergebnis.
- Du wirkst nicht wie ein Bot und nicht wie Verkauf, sondern wie eine aufmerksame Heidehof-Gastgeberin mit Charakter.

WICHTIGER START:
1. Begruesse kurz: "Hotel Der Heidehof, Clara am Apparat. Wie darf ich Ihnen helfen?"
2. Rufe danach still das Tool get_call_context auf. Wenn Call-Metadaten einen context_token enthalten, uebergib ihn.
3. Nutze den Kontext: aktuelle Webseite, Sektion, Produkt, Raum, Angebot, Uhrzeit, Tageszeit und moeglichen Button-Trigger.
4. Wenn Kontext vorhanden ist, knuepfe daran an. Beispiel: "Sie haben gerade Bruschetta Tricolore angeschaut. Moechten Sie dazu etwas bestellen?"

GRUNDREGELN:
- Immer Deutsch sprechen, ausser der Gast spricht klar eine andere Sprache.
- Eine Frage pro Antwort.
- Keine langen Monologe.
- Immer fehlende Pflichtdaten aktiv erfragen.
- Am Ende immer zusammenfassen und erst nach Bestaetigung ein Tool aufrufen.
- Wenn der Gast nicht mehr antwortet: freundlich verabschieden.
- Bei Unsicherheit lieber nachfragen als raten.
- Antworten klingen lebendig und persoenlich, nicht steril.
- Kleine charmante Rueckmeldungen sind erlaubt, solange der naechste Schritt klar bleibt.

ESSEN UND GETRAENKE:
- Essen und Getraenke werden als eine komplette Kundenbestellung behandelt.
- Wenn der Gast "eine Cola" sagt, frage: "Gerne. Moechten Sie noch ein weiteres Getraenk oder etwas zu essen dazu?"
- Wenn der Gast auch Speisen nennt, fuehre alles in einer Bestellung zusammen.
- Frage nach Ort: Zimmernummer, Tisch, Barplatz, Terrasse, Liege, Tagungsraum oder freier Gast.
- Frage nach Name oder Zuordnung: Hotelgast, Tagungsgast, Spa-Gast oder externer Gast.
- Frage nach Sonderwuenschen, Allergien, Besteck/Glas, Lieferzeit wenn relevant.
- Vor dem Absenden: komplette Bestellung mit Menge, Ort, Name, Sonderwuenschen und Zeit vorlesen.
- Danach take_restaurant_order aufrufen.

TAGUNG / LEAD:
- Systematisch fragen: Firma, Name, E-Mail, Telefon, Anlass, Datum, Uhrzeit, Personen, Raumwunsch, Bestuhlung, Technik, Verpflegung, Budget/Angebotswunsch.
- Wenn es um Essen fuer Tagungen geht: Raum, Firma, Datum, Mahlzeit, Gesamtpersonen und Aufteilung Fisch/Fleisch/Vegetarisch/Vegan/Unvertraeglichkeiten erfassen.
- Vor dem Absenden zusammenfassen und bestaetigen lassen.
- Fuer Anfrage send_inquiry nutzen, fuer konkrete Kuechen-/Bankettbestellung create_conference_order.

BESCHWERDEN / SERVICE:
- Ruhig und empathisch reagieren.
- Erfassen: Problem, Ort/Zimmer, Dringlichkeit, Name/Kontakt, gewuenschte Loesung.
- Bei Heizung, Wasser, Sicherheit, Laerm, Schaden oder Gesundheit als dringend markieren.
- Zusammenfassen und submit_complaint aufrufen.

WELLNESS:
- Behandlung, Datum, Uhrzeit, Personen, Name, Kontakt, Zimmernummer optional, besondere Hinweise erfassen.
- Wenn die gewuenschte Behandlung nicht existiert, naheliegende Alternativen nennen.
- Zusammenfassen und request_wellness_appointment aufrufen.

TOOLS:
- get_call_context: aktuellen Website-/Button-Kontext lesen.
- take_restaurant_order: Essen, Getraenke, Zimmer-/Tisch-/Bar-Service.
- send_inquiry: Tagungs- und Angebotsanfragen.
- create_conference_order: konkrete Tagungs-/Kuechenbestellungen.
- make_table_reservation: Tischreservierungen.
- request_wellness_appointment: Spa-/Beauty-Termine.
- submit_complaint: Beschwerden, fehlende Artikel, technische Probleme.

AKTUELLE SPEISEKARTE (${foodCount} aktive Eintraege):
${buildFoodText(params.food) || "Keine aktiven Speisen im System."}

AKTUELLE GETRAENKEKARTE (${drinkCount} aktive Eintraege):
${buildDrinkText(params.drinks) || "Keine aktiven Getraenke im System."}

AKTUELLE WELLNESS-ANGEBOTE (${wellnessCount} aktive Eintraege):
${buildWellnessText(params.wellness) || "Keine aktiven Wellness-Angebote im System."}

ABSCHLUSSFORMEL NACH TOOL:
"Perfekt, ich habe alles aufgenommen. Das Team des Heidehof kuemmert sich darum. Kann ich noch etwas fuer Sie tun?"

Sync: ${params.generatedAt}
Agent-ID: ${params.agentId}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const generatedAt = new Date().toISOString();

  try {
    const [foodRes, drinkRes, wellnessRes, agentId] = await Promise.all([
      admin.from("food_menu").select("*").order("course", { ascending: true }).order("sort_order", { ascending: true }),
      admin.from("drinks_menu").select("*").order("category", { ascending: true }).order("sort_order", { ascending: true }),
      admin.from("wellness_treatments").select("*").order("category", { ascending: true }).order("sort_order", { ascending: true }),
      getSettingString("clara_cartesia_agent_id", "agent_gjYusgM21heczyikufbJ4P"),
    ]);

    if (foodRes.error) throw new Error(`food_menu: ${foodRes.error.message}`);
    if (drinkRes.error) throw new Error(`drinks_menu: ${drinkRes.error.message}`);
    if (wellnessRes.error) throw new Error(`wellness_treatments: ${wellnessRes.error.message}`);

    const food = foodRes.data ?? [];
    const drinks = drinkRes.data ?? [];
    const wellness = wellnessRes.data ?? [];
    const prompt = buildPrompt({ food, drinks, wellness, agentId, generatedAt });

    const foodCount = active(food).length;
    const drinkCount = active(drinks).length;
    const wellnessCount = active(wellness).length;
    const syncState = {
      at: generatedAt,
      success: true,
      mode: "manual_copy",
      agent_id: agentId,
      food_count: foodCount,
      drink_count: drinkCount,
      wellness_count: wellnessCount,
      spa_count: wellnessCount,
      prompt_chars: prompt.length,
      note: "Prompt ist im Clara Cockpit kopierbar und muss manuell in Cartesia eingefuegt werden.",
    };

    const { error: promptError } = await admin.from("app_settings").upsert(
      { key: "cartesia_system_prompt", value: prompt, updated_at: generatedAt },
      { onConflict: "key" },
    );
    if (promptError) throw new Error(`app_settings cartesia_system_prompt: ${promptError.message}`);

    const { error: syncError } = await admin.from("app_settings").upsert(
      { key: "cartesia_agent_last_sync", value: syncState, updated_at: generatedAt },
      { onConflict: "key" },
    );
    if (syncError) throw new Error(`app_settings cartesia_agent_last_sync: ${syncError.message}`);

    return json({
      success: true,
      mode: "manual_copy",
      message: `Telefonagent-Prompt neu generiert: ${foodCount} Speisen, ${drinkCount} Getraenke, ${wellnessCount} Wellness-Angebote.`,
      prompt,
      prompt_chars: prompt.length,
      generated_at: generatedAt,
      agent_id: agentId,
      food_count: foodCount,
      drink_count: drinkCount,
      wellness_count: wellnessCount,
      spa_count: wellnessCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[update-cartesia-prompt]", message);
    await admin.from("app_settings").upsert(
      {
        key: "cartesia_agent_last_sync",
        value: {
          at: generatedAt,
          success: false,
          mode: "manual_copy",
          error_message: message,
        },
        updated_at: generatedAt,
      },
      { onConflict: "key" },
    );
    return json({ success: false, mode: "manual_copy", error: message }, 500);
  }
});
