// Scrapes der-heidehof.de sitemap, extracts all unique images, uploads them
// to the `site-images` bucket under a folder (default: "heidehof-website").
// Skips files that already exist (same filename). Returns counts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const UA = "Mozilla/5.0 HeidehofScraper";

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, { headers: { "user-agent": UA } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.text();
}

async function collectImageUrls(sitemapUrl: string, maxPages: number): Promise<string[]> {
  const sitemapXml = await fetchText(sitemapUrl);
  const pageUrls = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g))
    .map((m) => m[1])
    .filter((u) => !u.endsWith(".xml"))
    .slice(0, maxPages);

  const ids = new Set<string>();
  // crawl pages in parallel batches
  const batchSize = 10;
  for (let i = 0; i < pageUrls.length; i += batchSize) {
    const batch = pageUrls.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((u) => fetchText(u)));
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      const matches = r.value.matchAll(/crop__(\d+)/g);
      for (const m of matches) ids.add(m[1]);
    }
  }
  return Array.from(ids).map(
    (id) => `https://www.der-heidehof.de/de/photos/crop__${id}_t1__1920.jpg`,
  );
}

async function uploadOne(url: string, folder: string): Promise<"uploaded" | "skipped" | "failed"> {
  try {
    const id = url.match(/crop__(\d+)/)?.[1];
    if (!id) return "failed";
    const path = `${folder}/heidehof-${id}.jpg`;

    // existence check
    const { data: existing } = await admin.storage
      .from("site-images")
      .list(folder, { limit: 1000, search: `heidehof-${id}.jpg` });
    if (existing && existing.some((f) => f.name === `heidehof-${id}.jpg`)) return "skipped";

    const r = await fetch(url, { headers: { "user-agent": UA } });
    if (!r.ok) return "failed";
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.byteLength < 2000) return "failed";

    const { error } = await admin.storage
      .from("site-images")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
    if (error) {
      if (`${error.message}`.toLowerCase().includes("exists")) return "skipped";
      console.warn("upload err", path, error);
      return "failed";
    }
    return "uploaded";
  } catch (e) {
    console.warn("uploadOne failed", url, e);
    return "failed";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const fail = await requireAdmin(req);
  if (fail) return fail;

  try {
    const body = await req.json().catch(() => ({}));
    const folder = body.folder ?? "heidehof-website";
    const sitemap = body.sitemap ?? "https://www.der-heidehof.de/sitemap.xml";
    const maxPages = body.maxPages ?? 150;

    const imageUrls = await collectImageUrls(sitemap, maxPages);

    let uploaded = 0, skipped = 0, failed = 0;
    const concurrency = 6;
    for (let i = 0; i < imageUrls.length; i += concurrency) {
      const batch = imageUrls.slice(i, i + concurrency);
      const results = await Promise.all(batch.map((u) => uploadOne(u, folder)));
      for (const r of results) {
        if (r === "uploaded") uploaded++;
        else if (r === "skipped") skipped++;
        else failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, totalFound: imageUrls.length, uploaded, skipped, failed, folder }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: `${e}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
