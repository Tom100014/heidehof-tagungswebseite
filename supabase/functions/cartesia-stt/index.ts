// Cartesia Speech-to-Text (Ink Whisper) — Batch endpoint.
// Frontend sendet Audio-Blob (webm/ogg/wav) als multipart/form-data unter Feldname "file".
// Antwort: { ok: true, text: string }
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);

  try {
    const apiKey = Deno.env.get("CARTESIA_API_KEY")?.trim();
    if (!apiKey) return json({ ok: false, error: "CARTESIA_API_KEY fehlt" }, 500);

    const inForm = await req.formData();
    const file = inForm.get("file");
    if (!(file instanceof File) && !(file instanceof Blob)) {
      return json({ ok: false, error: "Audio-Datei fehlt (Feld 'file')" }, 400);
    }
    const language = (inForm.get("language") as string) || "de";

    const filename = (file instanceof File) ? file.name : "audio.webm";
    const outForm = new FormData();
    outForm.append("file", file as Blob, filename);
    outForm.append("model", "ink-whisper");
    outForm.append("language", language);

    const r = await fetch("https://api.cartesia.ai/stt", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Cartesia-Version": "2024-11-13",
      },
      body: outForm,
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("cartesia stt error:", r.status, detail);
      return json({ ok: false, error: `Cartesia ${r.status}: ${detail.slice(0, 200)}` }, 502);
    }
    const data = await r.json();
    const text = (data?.text ?? "").toString().trim();
    return json({ ok: true, text });
  } catch (e) {
    console.error("cartesia-stt exception:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
