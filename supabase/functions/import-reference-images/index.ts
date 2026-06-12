// Crawls a website (or accepts uploaded image URLs), downloads images,
// generates an AI description for each, and stores them in
// public.hotel_reference_images.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ImportBody {
  url?: string;
  images?: Array<{ url: string; label?: string; category?: string }>;
  category?: string;
  maxImages?: number;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function extractImageUrls(pageUrl: string, max: number): Promise<string[]> {
  const res = await fetch(pageUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const base = new URL(pageUrl);
  const found = new Set<string>();
  // <img src="..."> and srcset
  const imgRe = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) && found.size < max) {
    try {
      const url = new URL(m[1], base).toString();
      if (/\.(jpe?g|png|webp)(\?|$)/i.test(url)) found.add(url);
    } catch (_) { /* skip */ }
  }
  // OG image
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og) try { found.add(new URL(og[1], base).toString()); } catch (_) { /* */ }
  return Array.from(found).slice(0, max);
}

async function describeImage(imageUrl: string): Promise<{
  label: string;
  description: string;
  category: string;
  tags: string[];
}> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Du bist ein Hotel-Bildkatalogisierer. Beschreibe Hotelbilder für eine Referenzbibliothek (Heidehof bei Ingolstadt). Antworte NUR via Tool-Call.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Katalogisiere dieses Hotelbild." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "catalog_image",
            description: "Speichere Bild-Metadaten",
            parameters: {
              type: "object",
              properties: {
                label: { type: "string", description: "Kurzer Titel, max 5 Wörter" },
                description: { type: "string", description: "Detailbeschreibung des Bildes (Stil, Licht, Inhalt, Materialien, Farben), 2-4 Sätze" },
                category: {
                  type: "string",
                  enum: ["restaurant", "bar", "wellness", "rooms", "exterior", "conference", "food", "general"],
                },
                tags: { type: "array", items: { type: "string" }, description: "5-10 Stichwörter" },
              },
              required: ["label", "description", "category", "tags"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "catalog_image" } },
    }),
  });
  const data = await res.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("No description returned");
  return JSON.parse(args);
}

async function downloadAndStore(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  slug: string,
): Promise<{ publicUrl: string; storagePath: string }> {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`fetch ${imageUrl} failed: ${resp.status}`);
  const blob = new Uint8Array(await resp.arrayBuffer());
  const ext = (imageUrl.match(/\.(jpe?g|png|webp)/i)?.[1] ?? "jpg").toLowerCase();
  const path = `references/${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("image-references")
    .upload(path, blob, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}`, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("image-references").getPublicUrl(path);
  return { publicUrl: data.publicUrl, storagePath: path };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as ImportBody;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const max = Math.min(body.maxImages ?? 30, 60);
    const defaultCategory = body.category ?? "general";

    let candidates: Array<{ url: string; label?: string; category?: string }> = [];
    if (body.images?.length) candidates = body.images;
    else if (body.url) {
      const urls = await extractImageUrls(body.url, max);
      candidates = urls.map((u) => ({ url: u }));
    } else {
      return new Response(JSON.stringify({ error: "url or images required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imported: unknown[] = [];
    const errors: unknown[] = [];

    for (const c of candidates.slice(0, max)) {
      try {
        const meta = await describeImage(c.url);
        const label = c.label ?? meta.label;
        const slug = slugify(label) || `img-${Date.now()}`;
        const stored = await downloadAndStore(supabase, c.url, slug);
        const { data, error } = await supabase
          .from("hotel_reference_images")
          .upsert(
            {
              slug,
              label,
              description: meta.description,
              category: c.category ?? meta.category ?? defaultCategory,
              tags: meta.tags,
              image_url: stored.publicUrl,
              storage_path: stored.storagePath,
              source_url: c.url,
            },
            { onConflict: "slug" },
          )
          .select()
          .single();
        if (error) throw error;
        imported.push(data);
      } catch (e) {
        errors.push({ url: c.url, error: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ imported_count: imported.length, errors, imported }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
