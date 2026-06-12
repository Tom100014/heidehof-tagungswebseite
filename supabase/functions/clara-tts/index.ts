// Clara TTS — Cartesia (Sonic-2) only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_CARTESIA_VOICE = "b9de4a89-2257-424b-94c2-db18ba68c81a"; // Clara DE
const DEFAULT_MAX_CARTESIA_VOICE = "5032a642-fbda-4d11-a53a-c852ac30feff"; // Max DE
const DEFAULT_CARTESIA_MODEL = "sonic-2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const settingsCache = new Map<string, { value: unknown; exp: number }>();
const SETTINGS_TTL_MS = 60_000;

function clearSettingsCache() {
  settingsCache.clear();
}

async function getSetting<T>(key: string): Promise<T | null> {
  const now = Date.now();
  const hit = settingsCache.get(key);
  if (hit && hit.exp > now) return hit.value as T | null;
  try {
    const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
    const value = (data?.value ?? null) as T | null;
    settingsCache.set(key, { value, exp: now + SETTINGS_TTL_MS });
    return value;
  } catch {
    return null;
  }
}

const readString = (v: unknown): string | null => {
  if (typeof v === "string") return v.trim() || null;
  if (v && typeof v === "object" && "id" in v && typeof (v as { id: unknown }).id === "string") {
    return ((v as { id: string }).id).trim() || null;
  }
  return null;
};

async function getCartesiaVoice(persona: string): Promise<string> {
  const key = persona === "max" ? "max_cartesia_voice_id" : "clara_cartesia_voice_id";
  const def = persona === "max" ? DEFAULT_MAX_CARTESIA_VOICE : DEFAULT_CARTESIA_VOICE;
  const v = readString(await getSetting<unknown>(key));
  if (!v) return def;
  return v;
}

async function getCartesiaModel(): Promise<string> {
  const v = readString(await getSetting<unknown>("clara_cartesia_model"));
  return v ?? DEFAULT_CARTESIA_MODEL;
}

function cleanTextForTTS(text: string): string {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/%/g, " Prozent");
  cleaned = cleaned.replace(/&/g, " und ");
  cleaned = cleaned.replace(/(\d+)(?:[.,](\d{1,2}))?\s*(?:€|Euro|EUR)/gi, (_m, euros, cents) => {
    const euroVal = parseInt(euros, 10);
    let centVal = cents ? parseInt(cents, 10) : 0;
    if (cents && cents.length === 1) centVal *= 10;
    return centVal === 0 ? `${euroVal} Euro` : `${euroVal} Euro ${centVal}`;
  });
  cleaned = cleaned.replace(/(\d+),-\s*(?:€|Euro|EUR)?/gi, "$1 Euro");
  cleaned = cleaned.replace(/€/g, " Euro ");
  cleaned = cleaned.replace(/\bEUR\b/gi, " Euro ");
  cleaned = cleaned.replace(/\bz\.B\./gi, " zum Beispiel ");
  cleaned = cleaned.replace(/\bd\.h\./gi, " das heißt ");
  cleaned = cleaned.replace(/\bu\.a\./gi, " unter anderem ");
  cleaned = cleaned.replace(/\bca\./gi, " zirka ");
  cleaned = cleaned.replace(/\bvs\./gi, " gegen ");
  cleaned = cleaned.replace(/\bmin\./gi, " Minuten ");
  cleaned = cleaned.replace(/\bstd\./gi, " Stunden ");
  cleaned = cleaned.replace(/\binkl\./gi, " inklusive ");
  cleaned = cleaned.replace(/\bexkl\./gi, " exklusive ");
  cleaned = cleaned.replace(/\bMwSt\./gi, " Mehrwertsteuer ");
  cleaned = cleaned.replace(/[*_`#~]/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

async function ttsCartesia(text: string, voiceId: string, model: string): Promise<Response> {
  const key = Deno.env.get("CARTESIA_API_KEY")?.trim();
  if (!key) return jsonResponse({ ok: false, error: "CARTESIA_API_KEY fehlt." });
  const r = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Cartesia-Version": "2024-11-13",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: model,
      transcript: text,
      voice: { mode: "id", id: voiceId },
      language: "de",
      output_format: { container: "mp3", sample_rate: 44100, bit_rate: 128000 },
    }),
  });
  if (!r.ok || !r.body) {
    const detail = await r.text().catch(() => "");
    console.error("cartesia error:", r.status, detail);
    return jsonResponse({ ok: false, error: `Cartesia ${r.status}: ${detail}` });
  }
  return new Response(r.body, {
    headers: {
      ...corsHeaders,
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Clara-TTS-Provider": "cartesia",
      "X-Clara-TTS-Model": model,
      "X-Clara-TTS-Voice": voiceId,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  if (url.searchParams.get("bust") === "1" || req.headers.get("x-clara-cache-bust") === "1") {
    clearSettingsCache();
    if (req.method !== "POST") return jsonResponse({ ok: true, busted: true });
  }
  try {
    const body = await req.json();
    const rawText: string = body?.text;
    if (!rawText || typeof rawText !== "string") return jsonResponse({ ok: false, error: "text required" }, 400);
    const text = cleanTextForTTS(rawText);
    const persona = typeof body?.persona === "string" ? body.persona.toLowerCase().trim() : "clara";
    const voice = (typeof body?.voiceId === "string" && body.voiceId.trim()) || (await getCartesiaVoice(persona));
    const model = (typeof body?.model === "string" && body.model.trim()) || (await getCartesiaModel());
    return await ttsCartesia(text, voice, model);
  } catch (e) {
    return jsonResponse({ ok: false, error: e instanceof Error ? e.message : "Unknown" });
  }
});
