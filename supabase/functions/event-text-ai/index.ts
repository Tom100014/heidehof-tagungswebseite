// AI text helper for events: generate or improve title/subtitle/description
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { mode, field, event } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const ctx = `Event-Typ: ${event?.event_type ?? "sonstiges"}
Aktueller Titel: ${event?.title ?? ""}
Untertitel: ${event?.subtitle ?? ""}
Beschreibung: ${event?.description_md ?? ""}
Ort: ${event?.location ?? ""}
Datum: ${event?.starts_at ?? ""}
Preis: ${event?.price_label ?? ""}`;

    const system = `Du bist Texter für ein Premium-Landhotel (Heidehof). Schreibe stilvoll, einladend, präzise auf Deutsch. Kein Marketing-Geschwätz, keine Emojis, keine Hashtags. Antworte NUR mit dem reinen Text, ohne Anführungszeichen oder Erklärung.`;

    let user = "";
    if (mode === "improve") {
      user = `Verbessere folgendes Feld "${field}" für diese Veranstaltung. Behalte Bedeutung, mache es eleganter, klarer, einladender.\n\n${ctx}`;
    } else if (mode === "generate") {
      const lens: Record<string, string> = {
        title: "Kurzer prägnanter Titel (max 60 Zeichen).",
        subtitle: "Ein einziger emotionaler Untertitel-Satz (max 100 Zeichen).",
        description_md: "Beschreibung in 2-4 Absätzen (Markdown, ohne Überschriften). Atmosphäre, Programm, Highlights.",
      };
      user = `Erzeuge das Feld "${field}". ${lens[field] ?? ""}\n\n${ctx}`;
    } else if (mode === "seo") {
      user = `Erzeuge eine SEO-Meta-Description (max 155 Zeichen) für diese Veranstaltung.\n\n${ctx}`;
    } else throw new Error("invalid mode");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      const status = res.status;
      const msg = status === 429 ? "KI ist gerade ausgelastet. Bitte kurz warten."
        : status === 402 ? "KI-Guthaben aufgebraucht."
        : "KI-Fehler.";
      return new Response(JSON.stringify({ error: msg, detail: t }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content?.trim() ?? "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
