// Universal Bild-Crawler & Importer für Clara Media.
// Modes:
//   1) Default (kein Body): vordefinierte Heidehof-Seiten crawlen
//   2) { url: "https://...", depth?: 0|1|2, category?, triggers?[] } — Single URL crawlen
//      depth=0 = nur diese Seite, depth=1 = + alle internen Links, depth=2 = +Linkebene
//   3) { urls: ["https://.../bild.jpg", ...], category?, triggers?[], titlePrefix? } — manuelle Bildliste
//   4) { pages: [{url, category, triggers[], titlePrefix}, ...] } — eigene Seitenliste crawlen
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface PageDef {
  url: string;
  category: string;
  triggers: string[];
  titlePrefix: string;
}

const DEFAULT_PAGES: PageDef[] = [
  // Spa & Wellness
  { url: "https://www.der-heidehof.de/de/spa-area.html", category: "spa", triggers: ["spa","wellness","entspannung"], titlePrefix: "Spa" },
  { url: "https://www.der-heidehof.de/de/spa-area/wasserwelt.html", category: "pool", triggers: ["pool","schwimmbad","wasserwelt","schwimmen","hallenbad","whirlpool","wasser"], titlePrefix: "Wasserwelt" },
  { url: "https://www.der-heidehof.de/de/spa-area/saunalandschaft.html", category: "spa", triggers: ["sauna","saunalandschaft","dampfbad","finnische sauna","aufguss","schwitzen"], titlePrefix: "Sauna" },
  { url: "https://www.der-heidehof.de/de/spa-area/ruhebereiche.html", category: "spa", triggers: ["ruhe","ruhebereich","entspannung","liegen"], titlePrefix: "Ruhebereich" },
  { url: "https://www.der-heidehof.de/de/spa-area/fitnesslounge.html", category: "spa", triggers: ["fitness","gym","sport","trainieren"], titlePrefix: "Fitness" },
  { url: "https://www.der-heidehof.de/de/spa-area/anwendungen.html", category: "spa", triggers: ["massage","anwendung","behandlung","spa-anwendung"], titlePrefix: "Anwendung" },
  { url: "https://www.der-heidehof.de/de/spa-area/aussenbereich.html", category: "spa", triggers: ["außenbereich","garten","aussen","terrasse spa","liegewiese"], titlePrefix: "Spa Außenbereich" },
  // Living Beauty
  { url: "https://www.der-heidehof.de/de/living-beauty.html", category: "beauty", triggers: ["beauty","kosmetik","schönheit","gesicht"], titlePrefix: "Beauty" },
  // Tagung & Bankett
  { url: "https://www.der-heidehof.de/de/bankett-tagung.html", category: "bankett", triggers: ["hochzeit","bankett","feier","fest","gala","hochzeit feiern"], titlePrefix: "Bankett" },
  { url: "https://www.der-heidehof.de/de/bankett-tagung/raeumlichkeiten.html", category: "raum", triggers: ["tagung","raum","saal","boardroom","meeting","konferenz","tagungsraum"], titlePrefix: "Tagungsraum" },
  { url: "https://www.der-heidehof.de/de/bankett-tagung/tagungspauschalen.html", category: "raum", triggers: ["pauschale","tagungspauschale","preise tagung"], titlePrefix: "Tagungspauschale" },
  { url: "https://www.der-heidehof.de/de/bankett-tagung/hochzeit.html", category: "bankett", triggers: ["hochzeit","heiraten","trauung"], titlePrefix: "Hochzeit" },
  // Kulinarik
  { url: "https://www.der-heidehof.de/de/kulinarik-locations.html", category: "restaurant", triggers: ["kulinarik","essen","restaurant","speise"], titlePrefix: "Kulinarik" },
  { url: "https://www.der-heidehof.de/de/kulinarik-locations/restaurants.html", category: "restaurant", triggers: ["restaurant","essen","menü","gourmet"], titlePrefix: "Restaurant" },
  { url: "https://www.der-heidehof.de/de/kulinarik-locations/bar.html", category: "restaurant", triggers: ["bar","drinks","cocktail","getränke"], titlePrefix: "Bar" },
  { url: "https://www.der-heidehof.de/de/kulinarik-locations/terrasse.html", category: "restaurant", triggers: ["terrasse","draussen essen","aussenterrasse"], titlePrefix: "Terrasse" },
  // Zimmer
  { url: "https://www.der-heidehof.de/de/zimmer-suiten.html", category: "zimmer", triggers: ["zimmer","suite","übernachtung","schlafen","unterkunft"], titlePrefix: "Zimmer" },
  { url: "https://www.der-heidehof.de/de/zimmer-suiten/zimmer-suiten.html", category: "zimmer", triggers: ["zimmer","suite","doppelzimmer","einzelzimmer"], titlePrefix: "Zimmer-Übersicht" },
  // Hotel allgemein
  { url: "https://www.der-heidehof.de/", category: "general", triggers: ["heidehof","hotel","aussenansicht","gebäude"], titlePrefix: "Heidehof" },
  { url: "https://www.der-heidehof.de/de/hotel.html", category: "general", triggers: ["hotel","empfang","lobby"], titlePrefix: "Hotel" },
  { url: "https://www.der-heidehof.de/de/umgebung.html", category: "outdoor", triggers: ["umgebung","heide","natur","wandern","ausflug"], titlePrefix: "Umgebung" },
  { url: "https://www.der-heidehof.de/de/arrangements.html", category: "general", triggers: ["arrangement","angebot","paket","wellness-arrangement"], titlePrefix: "Arrangement" },
];


const IMG_RE = /<img[^>]*?(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*>/gi;
const SRCSET_RE = /<img[^>]+srcset=["']([^"']+)["']/gi;
const LINK_RE = /<a[^>]+href=["']([^"']+)["']/gi;
const OG_RE = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;

function absolutize(src: string, base: string): string {
  try { return new URL(src, base).toString(); } catch { return ""; }
}

function isUsableImage(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (!/\.(jpg|jpeg|png|webp)(\?|$|#)/i.test(lower)) return false;
  if (lower.includes("logo") || lower.includes("favicon") || lower.includes("placeholder") || lower.includes("sprite")) return false;
  if (lower.includes("-150x") || lower.includes("-100x") || lower.includes("thumb")) return false;
  return true;
}

function inferPageMeta(url: string): { category: string; triggers: string[]; titlePrefix: string } {
  const p = url.toLowerCase();
  if (p.includes("wasserwelt") || p.includes("pool") || p.includes("schwimm")) return { category: "pool", triggers: ["pool","schwimmbad","wasserwelt","schwimmen","hallenbad","whirlpool"], titlePrefix: "Wasserwelt" };
  if (p.includes("sauna") || p.includes("dampfbad")) return { category: "spa", triggers: ["sauna","dampfbad","aufguss","schwitzen","saunalandschaft"], titlePrefix: "Sauna" };
  if (p.includes("fitness") || p.includes("gym")) return { category: "spa", triggers: ["fitness","gym","sport","training"], titlePrefix: "Fitness" };
  if (p.includes("ruhe")) return { category: "spa", triggers: ["ruhe","ruhebereich","entspannung"], titlePrefix: "Ruhebereich" };
  if (p.includes("anwendung") || p.includes("massage")) return { category: "spa", triggers: ["massage","anwendung","behandlung","spa-anwendung"], titlePrefix: "Anwendung" };
  if (p.includes("spa") || p.includes("wellness")) return { category: "spa", triggers: ["spa","wellness","entspannung"], titlePrefix: "Spa" };
  if (p.includes("beauty") || p.includes("kosmetik")) return { category: "beauty", triggers: ["beauty","kosmetik","schönheit"], titlePrefix: "Beauty" };
  if (p.includes("hochzeit")) return { category: "bankett", triggers: ["hochzeit","heiraten","trauung","feier"], titlePrefix: "Hochzeit" };
  if (p.includes("bankett") || p.includes("gala") || p.includes("feier")) return { category: "bankett", triggers: ["bankett","feier","fest","gala"], titlePrefix: "Bankett" };
  if (p.includes("tagung") || p.includes("meeting") || p.includes("raeum") || p.includes("räum") || p.includes("konferenz")) return { category: "raum", triggers: ["tagung","raum","saal","meeting","konferenz","tagungsraum"], titlePrefix: "Tagungsraum" };
  if (p.includes("restaurant") || p.includes("kulinarik") || p.includes("speise")) return { category: "restaurant", triggers: ["restaurant","essen","kulinarik","menü","speise"], titlePrefix: "Restaurant" };
  if (p.includes("bar") || p.includes("cocktail")) return { category: "restaurant", triggers: ["bar","drinks","cocktail","getränke"], titlePrefix: "Bar" };
  if (p.includes("terrasse")) return { category: "restaurant", triggers: ["terrasse","draussen","aussenterrasse"], titlePrefix: "Terrasse" };
  if (p.includes("zimmer") || p.includes("suite") || p.includes("uebernach")) return { category: "zimmer", triggers: ["zimmer","suite","übernachtung","schlafen"], titlePrefix: "Zimmer" };
  if (p.includes("umgebung") || p.includes("natur") || p.includes("heide")) return { category: "outdoor", triggers: ["umgebung","heide","natur","wandern"], titlePrefix: "Umgebung" };
  if (p.includes("arrangement") || p.includes("angebot") || p.includes("paket")) return { category: "general", triggers: ["arrangement","angebot","paket"], titlePrefix: "Arrangement" };
  return { category: "general", triggers: ["heidehof","hotel"], titlePrefix: "Heidehof" };
}

async function fetchHtml(url: string): Promise<string> {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 ClaraImporter" } });
  if (!r.ok) throw new Error(`Fetch ${url}: ${r.status}`);
  return await r.text();
}

function extractImageUrls(html: string, base: string, max = 20): { url: string; alt: string }[] {
  const out: { url: string; alt: string }[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  // Reset regex state
  IMG_RE.lastIndex = 0;
  while ((m = IMG_RE.exec(html)) !== null) {
    const abs = absolutize(m[1], base);
    if (!isUsableImage(abs) || seen.has(abs)) continue;
    seen.add(abs);
    out.push({ url: abs, alt: (m[2] ?? "").trim() });
  }

  SRCSET_RE.lastIndex = 0;
  while ((m = SRCSET_RE.exec(html)) !== null) {
    const candidates = m[1].split(",").map(s => s.trim().split(/\s+/)[0]);
    for (const c of candidates) {
      const abs = absolutize(c, base);
      if (!isUsableImage(abs) || seen.has(abs)) continue;
      seen.add(abs);
      out.push({ url: abs, alt: "" });
    }
  }

  const og = html.match(OG_RE);
  if (og) {
    const abs = absolutize(og[1], base);
    if (isUsableImage(abs) && !seen.has(abs)) {
      seen.add(abs);
      out.unshift({ url: abs, alt: "" });
    }
  }
  return out.slice(0, max);
}

function extractInternalLinks(html: string, base: string): string[] {
  const out = new Set<string>();
  const baseHost = new URL(base).host;
  let m: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(html)) !== null) {
    const abs = absolutize(m[1], base);
    if (!abs) continue;
    try {
      const u = new URL(abs);
      if (u.host !== baseHost) continue;
      if (!/\.(html?)?$/i.test(u.pathname) && u.pathname !== "/") continue;
      if (/\.(jpg|jpeg|png|webp|pdf|zip|css|js)$/i.test(u.pathname)) continue;
      out.add(u.toString().split("#")[0]);
    } catch { /* ignore */ }
  }
  return Array.from(out);
}

async function uploadToBucket(remoteUrl: string, category: string, idx: number): Promise<{ publicUrl: string; storagePath: string } | null> {
  try {
    const r = await fetch(remoteUrl);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") ?? "image/jpeg";
    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
    const fname = `${category}/${Date.now()}-${idx}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const bytes = new Uint8Array(await r.arrayBuffer());
    const { error: upErr } = await admin.storage.from("clara-media").upload(fname, bytes, { contentType: ct, upsert: false });
    if (upErr) { console.error("upload err", upErr); return null; }
    const { data } = admin.storage.from("clara-media").getPublicUrl(fname);
    return { publicUrl: data.publicUrl, storagePath: fname };
  } catch (e) {
    console.warn("upload failed", remoteUrl, e);
    return null;
  }
}

async function importImagesForPage(page: PageDef, maxPerPage = 20): Promise<{ imported: number; skipped: number; ids: string[] }> {
  let html = "";
  try { html = await fetchHtml(page.url); }
  catch (e) { console.warn("fetch page failed", page.url, e); return { imported: 0, skipped: 0, ids: [] }; }

  const imgs = extractImageUrls(html, page.url, maxPerPage);
  let imported = 0;
  let skipped = 0;
  const ids: string[] = [];

  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const { data: existing } = await admin
      .from("clara_media")
      .select("id")
      .contains("tags", [img.url])
      .maybeSingle();
    if (existing) { skipped++; continue; }

    const uploaded = await uploadToBucket(img.url, page.category, i);
    if (!uploaded) { skipped++; continue; }

    const title = img.alt && img.alt.length > 3 ? img.alt : `${page.titlePrefix} ${i + 1}`;
    const { data: ins, error: insErr } = await admin.from("clara_media").insert({
      title,
      description: img.alt ?? "",
      category: page.category,
      tags: [img.url, page.category, ...page.triggers],
      triggers: page.triggers,
      media_type: "image",
      url: uploaded.publicUrl,
      storage_path: uploaded.storagePath,
      is_active: true,
      sort_order: 0,
    }).select("id").single();
    if (insErr) { console.error("insert err", insErr); skipped++; continue; }
    if (ins?.id) ids.push(ins.id);
    imported++;
  }
  return { imported, skipped, ids };
}

async function importDirectImageUrls(urls: string[], category: string, triggers: string[], titlePrefix: string): Promise<{ imported: number; skipped: number; ids: string[] }> {
  let imported = 0, skipped = 0;
  const ids: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    if (!isUsableImage(u)) { skipped++; continue; }
    const { data: existing } = await admin
      .from("clara_media").select("id").contains("tags", [u]).maybeSingle();
    if (existing) { skipped++; continue; }
    const uploaded = await uploadToBucket(u, category, i);
    if (!uploaded) { skipped++; continue; }
    const { data: ins, error } = await admin.from("clara_media").insert({
      title: `${titlePrefix} ${i + 1}`,
      description: "",
      category,
      tags: [u, category, ...triggers],
      triggers,
      media_type: "image",
      url: uploaded.publicUrl,
      storage_path: uploaded.storagePath,
      is_active: true,
      sort_order: 0,
    }).select("id").single();
    if (error) { skipped++; continue; }
    if (ins?.id) ids.push(ins.id);
    imported++;
  }
  return { imported, skipped, ids };
}

async function triggerEmbedding(ids: string[]) {
  if (!ids.length) return;
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/clara-media-embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({ ids }),
    });
  } catch (e) { console.warn("embed trigger failed", e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authFail = await requireAdmin(req);
  if (authFail) return authFail;

  try {
    const body = await req.json().catch(() => ({}));
    const summary: { page: string; imported: number; skipped: number }[] = [];
    let totalImported = 0;
    const allIds: string[] = [];

    // MODE 3: direkte Bildliste
    if (Array.isArray(body.urls) && body.urls.length > 0) {
      const r = await importDirectImageUrls(
        body.urls,
        body.category ?? "general",
        body.triggers ?? [],
        body.titlePrefix ?? "Bild",
      );
      totalImported = r.imported;
      allIds.push(...r.ids);
      summary.push({ page: "manual-list", imported: r.imported, skipped: r.skipped });
    }
    // MODE 4: eigene Seitenliste
    else if (Array.isArray(body.pages) && body.pages.length > 0) {
      for (const p of body.pages as PageDef[]) {
        const r = await importImagesForPage(p, body.maxPerPage ?? 20);
        totalImported += r.imported;
        allIds.push(...r.ids);
        summary.push({ page: p.url, imported: r.imported, skipped: r.skipped });
      }
    }
    // MODE 2: einzelne URL crawlen + optional Tiefe
    else if (typeof body.url === "string") {
      const depth = Math.min(Math.max(body.depth ?? 0, 0), 2);
      const category = body.category ?? "general";
      const triggers = body.triggers ?? [];
      const titlePrefix = body.titlePrefix ?? "Bild";
      const visited = new Set<string>();
      const queue: string[] = [body.url];
      let level = 0;
      let levelEnd = 1;
      let processed = 0;

      while (queue.length && processed < (body.maxPages ?? 15)) {
        const u = queue.shift()!;
        if (visited.has(u)) continue;
        visited.add(u);
        processed++;
        const page: PageDef = { url: u, category, triggers, titlePrefix };
        const r = await importImagesForPage(page, body.maxPerPage ?? 15);
        totalImported += r.imported;
        allIds.push(...r.ids);
        summary.push({ page: u, imported: r.imported, skipped: r.skipped });

        if (level < depth) {
          try {
            const html = await fetchHtml(u);
            const links = extractInternalLinks(html, u);
            for (const l of links) if (!visited.has(l)) queue.push(l);
          } catch { /* ignore */ }
        }
        levelEnd--;
        if (levelEnd === 0) { level++; levelEnd = queue.length; }
      }
    }
    // MODE 5: vollständiger Site-Crawl (mode: "full")
    else if (body.mode === "full") {
      const root = body.url ?? "https://www.der-heidehof.de/";
      const maxPages = body.maxPages ?? 80;
      const maxPerPage = body.maxPerPage ?? 25;
      const visited = new Set<string>();
      const queue: string[] = [root];
      let processed = 0;

      while (queue.length && processed < maxPages) {
        const u = queue.shift()!;
        if (visited.has(u)) continue;
        visited.add(u);
        processed++;
        const { category, triggers, titlePrefix } = inferPageMeta(u);
        const r = await importImagesForPage({ url: u, category, triggers, titlePrefix }, maxPerPage);
        totalImported += r.imported;
        allIds.push(...r.ids);
        summary.push({ page: u, imported: r.imported, skipped: r.skipped });

        try {
          const html = await fetchHtml(u);
          const links = extractInternalLinks(html, u);
          for (const l of links) if (!visited.has(l) && queue.length + visited.size < maxPages * 2) queue.push(l);
        } catch { /* ignore */ }
      }
    }
    // MODE 1: Default Heidehof (kuratierte Liste)
    else {
      for (const page of DEFAULT_PAGES) {
        const r = await importImagesForPage(page, 25);
        totalImported += r.imported;
        allIds.push(...r.ids);
        summary.push({ page: page.url, imported: r.imported, skipped: r.skipped });
      }
    }


    // Embeddings im Hintergrund anstoßen
    triggerEmbedding(allIds).catch(() => {});

    return new Response(JSON.stringify({
      ok: true,
      total_imported: totalImported,
      embedded_queued: allIds.length,
      summary,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("import-heidehof-images error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
