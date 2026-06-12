// Admin AI Help — kontextueller Assistent für Mitarbeiter im Admin-Bereich.
// Kennt aktuelle Seite, kennt das interne Betriebshandbuch (clara_knowledge,
// Kategorie 'admin_help' / 'manual') und beantwortet kurze, praktische Fragen.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  route?: string;
  pageTitle?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// ─── Route → menschliche Beschreibung (Betriebshandbuch-Mapping) ───
const ROUTE_DESCRIPTIONS: Record<string, string> = {
  "/admin": "Dashboard / Überblick: Tageskennzahlen, neue Anfragen, offene Aufgaben.",
  "/admin/inbox": "Anfragen-Posteingang: alle Tagungs- und Kontaktanfragen mit Status.",
  "/admin/conference-orders": "Tagungs-Bestellungen der Gäste pro Tag und Raum.",
  "/admin/conference-menu": "Tagesmenü pflegen (Mittag/Abend, Allergene).",
  "/admin/menu-cards": "Speisekarten als Bild oder PDF hochladen / generieren.",
  "/admin/rooms": "Tagungsräume: Größe, Bestuhlungs-Kapazitäten, Bilder.",
  "/admin/setups": "Bestuhlungsvarianten (U-Form, Theater, Bankett ...).",
  "/admin/dishes": "Gerichte-Datenbank inkl. Kategorien und Bilder.",
  "/admin/kitchen": "Küchen-Ansicht: alles was heute zubereitet werden muss.",
  "/admin/kuechen-management": "Küchen-Management: Tagesplanung & Reports.",
  "/admin/workflow": "Live-Workflow: Bestellungen + Anfragen in Echtzeit.",
  "/admin/analytics": "Statistiken: Auslastung, Umsatz, Trends.",
  "/admin/inhalte": "Website-Texte (CMS).",
  "/admin/images": "Bilder & Medien der Website.",
  "/admin/impressionen": "Impressionen-Galerie.",
  "/admin/image-studio": "KI-Bildstudio: neue Motive generieren.",
  "/admin/partners": "Partner-Logos für die Startseite.",
  "/admin/knowledge": "Clara-Wissensbasis: Fakten die Clara den Gästen sagt.",
  "/admin/clara-media": "Clara Medienbank: Bilder die Clara im Gespräch zeigt.",
  "/admin/clara-cockpit": "Clara Cockpit: Modelle, Stimmen, Prompts, Kosten live.",
  "/admin/settings": "Globale Einstellungen.",
  "/admin/hilfe": "Hilfe & Einarbeitung.",
  "/admin/aktivitaet": "Audit-Log: was wurde wann von wem geändert.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const route = body.route || "";
    const pageTitle = body.pageTitle || "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Wissensbasis laden (Kategorien fürs Betriebshandbuch)
    const { data: kb } = await supabase
      .from("clara_knowledge")
      .select("title, category, content")
      .eq("is_active", true)
      .in("category", ["admin_help", "manual", "betriebshandbuch", "general"])
      .order("sort_order")
      .limit(60);

    const kbText = (kb || [])
      .map((r) => `### ${r.title} [${r.category}]\n${r.content}`)
      .join("\n\n")
      .slice(0, 9000);

    const routeDesc = ROUTE_DESCRIPTIONS[route] || "";

    const systemPrompt = `Du bist der KI-Assistent im Admin-Bereich des Heidehof-Hotels. Du hilfst Mitarbeitern, das System zu bedienen.

REGELN:
- Antworte SEHR KURZ (max. 3-5 Sätze) und konkret auf Deutsch.
- Nutze Bullet-Listen wenn es Schritte sind.
- Wenn du nicht sicher bist: ehrlich sagen und auf "Hilfe & Einarbeitung" verweisen.
- Sei freundlich, direkt, ohne Floskeln.

AKTUELLER KONTEXT:
- Seite: ${pageTitle || route || "Admin"}
- Route: ${route || "unbekannt"}
- Was passiert hier: ${routeDesc || "Nicht im Mapping hinterlegt."}

BETRIEBSHANDBUCH / WISSENSBASIS:
${kbText || "(keine Einträge gefunden)"}

ADMIN-STRUKTUR (Sektionen):
- Heute: Dashboard, Live-Workflow, Anfragen
- Tagung & Bestellungen: Conference-Bestellungen, Tagesmenü, Speisekarten
- Räume & Setup: Räume, Bestuhlungen
- Küche: Küchen-Management, Küche, Gerichte
- Inhalte & Medien: Texte, Bilder, Impressionen, Bild-Studio, Partner
- Clara KI: Wissensbasis, Medienbank, Cockpit
- Auswertung: Statistiken, Audit-Log
- System: Einstellungen, Hilfe`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-12),
    ];

    let aiRes: Response | null = null;
    const backoffs = [0, 1500, 4000, 8000];
    for (let i = 0; i < backoffs.length; i++) {
      if (backoffs[i] > 0) await new Promise((r) => setTimeout(r, backoffs[i]));
      aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: aiMessages,
          temperature: 0.4,
        }),
      });
      if (aiRes.ok) break;
      if (aiRes.status !== 429 && aiRes.status !== 503) break;
    }

    if (!aiRes || !aiRes.ok) {
      const status = aiRes?.status ?? 502;
      const errText = aiRes ? await aiRes.text() : "no response";
      if (status === 429) {
        return new Response(
          JSON.stringify({
            error: "rate_limited",
            reply: "Die KI ist gerade ausgelastet. Bitte in 30–60 Sekunden erneut fragen.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({
            error: "payment_required",
            reply: "Lovable-AI Guthaben aufgebraucht. Bitte im Workspace aufladen.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "AI request failed", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const reply: string =
      aiJson?.choices?.[0]?.message?.content ?? "Entschuldigung, gerade keine Antwort möglich.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err instanceof Error ? err.message : err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
