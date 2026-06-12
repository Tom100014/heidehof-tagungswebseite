import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Dish { title: string; description?: string | null }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const _authFail = await requireAdmin(req);
  if (_authFail) return _authFail;
  try {
    const { service_date, meal_type, dishes, notes, layout_image_url, layout_prompt, custom_prompt } = await req.json();
    if (!service_date) {
      return new Response(JSON.stringify({ error: "service_date erforderlich" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY fehlt");

    const dishList = (dishes ?? []).map((d: Dish) =>
      `• ${d.title}${d.description ? ` – ${d.description}` : ""}`
    ).join("\n");

    const baseStyle = layout_prompt?.trim()
      ? layout_prompt.trim()
      : "Eleganter Speisekarten-Aushang im Stil von Hotel Der Heidehof: warme Erdtöne, Gold-Akzente, dunkler Hintergrund, klassische Serif-Typografie für Titel, sauber gegliedert, hochwertig wie in einem Gourmet-Restaurant. Hochformat A4-Proportionen, gut lesbar.";

    const prompt = custom_prompt?.trim() || `${baseStyle}

Erstelle eine professionelle Speisekarte für:
Datum: ${service_date}${meal_type ? ` – ${meal_type}` : ""}

Speisen:
${dishList || "(keine Speisen angegeben – freie Gestaltung)"}
${notes ? `\nHinweis: ${notes}` : ""}

Anforderungen: Deutsche Sprache, exakte Speisenamen wiedergeben, übersichtliche Hierarchie, kein Logo, kein Datum-Stempel, druckfertig in Hochformat.`;

    const messages: any[] = [{ role: "user", content: layout_image_url
      ? [
          { type: "text", text: prompt + "\n\nNutze die beigefügte Vorlage als Layout-Referenz (Anordnung, Typografie-Stil, Bildkomposition). Inhalte aber bitte mit den oben genannten Speisen ersetzen." },
          { type: "image_url", image_url: { url: layout_image_url } },
        ]
      : prompt }];

    const callModel = async (model: string) => {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, modalities: ["image", "text"] }),
      });
      const txt = await r.text();
      let json: any = null;
      try { json = JSON.parse(txt); } catch { /* ignore */ }
      return { ok: r.ok, status: r.status, txt, json };
    };

    const models = [
      "google/gemini-3.1-flash-image-preview",
      "google/gemini-2.5-flash-image",
    ];
    let dataUrl: string | undefined;
    let lastErr = "";
    for (const m of models) {
      const res = await callModel(m);
      if (!res.ok) {
        lastErr = `${m}: ${res.status} ${res.txt.slice(0, 300)}`;
        console.error("AI error", lastErr);
        if (res.status === 429 || res.status === 402) {
          return new Response(JSON.stringify({ error: `AI-Limit erreicht: ${res.txt}` }), {
            status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        continue;
      }
      dataUrl = res.json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (dataUrl) break;
      lastErr = `${m}: kein Bild – ${JSON.stringify(res.json).slice(0, 400)}`;
      console.error(lastErr);
    }
    if (!dataUrl) {
      return new Response(JSON.stringify({ error: `Kein Bild erhalten (${lastErr})` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const base64 = dataUrl.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const sanitize = (s: string) =>
      s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ß/g, "ss")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-").replace(/^-|-$/g, "") || "all";
    const path = `${service_date}/${sanitize(meal_type ?? "all")}-${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from("menu-cards").upload(path, bytes, { contentType: "image/png", upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("menu-cards").getPublicUrl(path);

    const { data: row, error: insErr } = await supabase
      .from("conference_menu_cards")
      .insert({
        service_date, meal_type: meal_type ?? null,
        image_url: pub.publicUrl, storage_path: path,
        source: "ai", notes: notes ?? null,
      })
      .select().single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ success: true, card: row }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
