// Extracts text content from uploaded files for Clara
// Supports: PDF (via Gemini), images (Gemini Vision), TXT (direct)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function extractWithGemini(base64: string, mimeType: string, instruction: string) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instruction },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
    }),
  });
  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { storage_path, file_name, mime_type } = await req.json();
    if (!storage_path) throw new Error("storage_path required");

    const { data: file, error: dlErr } = await admin.storage
      .from("clara-uploads")
      .download(storage_path);
    if (dlErr || !file) throw new Error(`download: ${dlErr?.message ?? "no file"}`);

    let extracted = "";

    if (mime_type?.startsWith("text/") || file_name?.match(/\.(txt|md)$/i)) {
      extracted = await file.text();
      if (extracted.length > 8000) extracted = extracted.slice(0, 8000) + "\n\n[…gekürzt]";
    } else if (mime_type?.startsWith("image/")) {
      const buf = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      extracted = await extractWithGemini(
        base64,
        mime_type,
        "Beschreibe den Inhalt dieses Bildes für eine Tagungsplanung. Wenn Text zu sehen ist, gib ihn vollständig wieder. Auf Deutsch, präzise, max 400 Wörter.",
      );
    } else if (mime_type === "application/pdf" || file_name?.match(/\.pdf$/i)) {
      const buf = await file.arrayBuffer();
      // Gemini supports PDF via inline_data with application/pdf
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Fasse den Inhalt dieses PDFs für eine Tagungsplanung präzise zusammen (Anlass, Teilnehmerzahl, Datum, Wünsche, Budget, technische Anforderungen). Auf Deutsch, max 600 Wörter." },
                { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } },
              ],
            },
          ],
        }),
      });
      if (!resp.ok) throw new Error(`PDF parse ${resp.status}: ${await resp.text()}`);
      const data = await resp.json();
      extracted = data.choices?.[0]?.message?.content ?? "";
    } else {
      extracted = `(Datei-Typ ${mime_type ?? "unbekannt"} wird nicht unterstützt.)`;
    }

    return new Response(JSON.stringify({ ok: true, extracted, file_name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
