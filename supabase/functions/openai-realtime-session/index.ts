import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const readString = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
};

async function getSetting(key: string): Promise<unknown> {
  const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);

  const openaiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!openaiKey) return json({ ok: false, error: "OPENAI_API_KEY fehlt." }, 500);

  const sdp = await req.text();
  if (!sdp || !sdp.includes("v=0")) return json({ ok: false, error: "SDP offer fehlt." }, 400);

  const [modelSetting, voiceSetting] = await Promise.all([
    getSetting("clara_realtime_model"),
    getSetting("clara_realtime_voice"),
  ]);

  const session = {
    type: "realtime",
    model: readString(modelSetting, "gpt-realtime"),
    instructions: [
      "Du bist Clara vom Hotel Der Heidehof.",
      "Sprich deutsch, warm, charmant, kurz und professionell; man soll hören, dass du leicht lächelst.",
      "Ein sehr dezentes, natürliches kleines Lachen ist erlaubt, aber niemals albern und niemals als ausgeschriebenes haha.",
      "Du darfst fein schlagfertig sein, aber nie frech und nie auf Kosten des Gastes.",
      "Bei Beschwerden, Krankheit, Schäden, Lärm, Kosten oder Business-Anfragen bist du besonders ruhig, empathisch und präzise.",
      "Stelle immer nur eine konkrete Frage.",
      "Führe den Gast bis zu einem klaren Ergebnis: Bestellung, Tagungslead, Wellnesswunsch, Beschwerde oder allgemeine Hilfe.",
      "Nutze den Seitenkontext, den der Client im Gespräch sendet.",
      "Sende keine langen Erklärblöcke und lies keine Wissensdatenbank vor.",
    ].join(" "),
    audio: {
      output: {
        voice: readString(voiceSetting, "marin"),
      },
    },
  };

  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(session));

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
    },
    body: form,
  });

  const text = await response.text();
  if (!response.ok) {
    console.error("openai realtime error:", response.status, text);
    return json({ ok: false, error: `OpenAI Realtime ${response.status}: ${text.slice(0, 240)}` }, 502);
  }

  return new Response(text, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/sdp",
      "Cache-Control": "no-store",
    },
  });
});
