// Generates a polished inquiry text + offer draft for a saved tagungs_inquiries row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function callAI(system: string, user: string): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!r.ok) throw new Error(`AI ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: must be admin
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "Nicht angemeldet" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "director"])
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ ok: false, error: "Keine Admin-Rechte" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { id } = (await req.json()) as { id: string };
    if (!id) throw new Error("id fehlt");

    const { data: inq, error } = await admin
      .from("tagungs_inquiries")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !inq) throw new Error("Anfrage nicht gefunden");

    // Knowledge base
    const { data: kb } = await admin
      .from("clara_knowledge")
      .select("title,category,content")
      .limit(40);
    const kbText = (kb || [])
      .map((k) => `### ${k.category} – ${k.title}\n${k.content}`)
      .join("\n\n");

    const fields = {
      anlass: inq.anlass, personen: inq.personen, datum: inq.datum, dauer: inq.dauer,
      uebernachtung: inq.uebernachtung, verpflegung: inq.verpflegung, technik: inq.technik,
      besonderheiten: inq.besonderheiten, raumvorschlag: inq.raumvorschlag,
      pauschalvorschlag: inq.pauschalvorschlag, name: inq.name, firma: inq.firma,
      email: inq.email, telefon: inq.telefon, zusammenfassung: inq.zusammenfassung,
    };
    const transcript = Array.isArray(inq.conversation)
      ? (inq.conversation as Array<{ role: string; content: string }>)
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n")
      : "";

    const ctx = `STRUKTURIERTE FELDER:\n${JSON.stringify(fields, null, 2)}\n\nGESPRÄCH:\n${transcript || "(keines)"}`;

    // 1. Anfrage-Text (für Bankett-Team)
    const anfrageText = await callAI(
      `Du bist Assistent im Bankett-Verkauf des Hotel Der Heidehof. Fasse die Tagungsanfrage in einer professionellen, klar strukturierten Anfrage-Zusammenfassung in deutscher Sprache zusammen. Format: Markdown mit Abschnitten "Eckdaten", "Bedarf", "Kontakt", "Offene Punkte". Erfinde keine Werte – markiere fehlende Angaben mit "—".`,
      ctx,
    );

    // 2. Angebot
    const angebotText = await callAI(
      `Du bist Bankett-Manager im Hotel Der Heidehof. Erstelle aus der Anfrage ein verkaufsfertiges Angebot in deutscher Sprache (Sie-Form, herzlich-professionell). Nutze AUSSCHLIESSLICH Räume, Pauschalen und Preise aus der Wissensbasis. Format Markdown:
1. Persönliche Anrede
2. Bezugnahme auf den Anlass
3. Empfohlener Raum + Begründung
4. Empfohlene Pauschale (Pro-Person-Preis × Personen = Gesamt)
5. Übernachtung (falls relevant) – Zimmerart × Anzahl × Nächte
6. Inkludierte Leistungen (Aufzählung)
7. Optionale Extras
8. Gesamtsumme (geschätzt, mit Hinweis "freibleibend")
9. Nächster Schritt + Ansprechpartner
Keine Werte erfinden. Bei fehlenden Daten "auf Anfrage" angeben.

WISSENSBASIS:
${kbText || "(leer)"}`,
      ctx,
    );

    await admin
      .from("tagungs_inquiries")
      .update({
        anfrage_text: anfrageText,
        angebot_text: angebotText,
        angebot_generated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return new Response(
      JSON.stringify({ ok: true, anfrage_text: anfrageText, angebot_text: angebotText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("clara-generate-offer error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
