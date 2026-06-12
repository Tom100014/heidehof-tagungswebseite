import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { loadHotelStyle, buildHotelStylePrompt, type ImageReferences, type ImageGenerationStyle } from "../_shared/hotel-image-style.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MainDish { name?: string; description?: string }
const dishName = (v: unknown): string => {
  if (!v) return "";
  if (typeof v === "string") { try { return (JSON.parse(v) as MainDish).name ?? ""; } catch { return v; } }
  return (v as MainDish).name ?? "";
};
const dishDesc = (v: unknown): string => {
  if (!v) return "";
  if (typeof v === "string") { try { return (JSON.parse(v) as MainDish).description ?? ""; } catch { return ""; } }
  return (v as MainDish).description ?? "";
};

async function generateImage(
  basePrompt: string,
  style: ImageGenerationStyle,
  references: ImageReferences,
): Promise<Uint8Array | null> {
  const fullPrompt = buildHotelStylePrompt(basePrompt, style);
  const refUrls = [
    references.background_url, references.plates_url, references.glasses_url,
    references.cutlery_url, references.mood_url,
  ].filter(Boolean) as string[];

  const content: Array<Record<string, unknown>> = [{ type: "text", text: fullPrompt }];
  for (const url of refUrls) content.push({ type: "image_url", image_url: { url } });

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: refUrls.length ? content : fullPrompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) { console.error("AI image error", await res.text()); return null; }
  const data = await res.json();
  const url: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url?.startsWith("data:")) return null;
  const base64 = url.split(",")[1];
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _authFail = await requireAdmin(req);
  if (_authFail) return _authFail;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let menu_id: string | undefined;
  let regenerate = false;
  let onlyTypes: string[] | null = null;
  let skipPdf = false;
  try {
    const body = await req.json();
    menu_id = body.menu_id;
    regenerate = !!body.regenerate;
    onlyTypes = Array.isArray(body.only_types) && body.only_types.length ? body.only_types as string[] : null;
    skipPdf = !!body.skip_pdf;
    if (!menu_id) throw new Error("menu_id erforderlich");


    const { data: menu, error: mErr } = await supabase.from("conference_menus").select("*").eq("id", menu_id).maybeSingle();
    if (mErr || !menu) throw new Error("Menü nicht gefunden");

    // Mark job as processing and continue work in background to avoid CPU limit on the request path
    await supabase.from("daily_menu_assets").upsert({
      menu_id, menu_date: menu.menu_date, status: "processing", error_message: null,
    }, { onConflict: "menu_id" });

    const work = (async () => {

    const dishMap: Record<string, { title: string; details: string }> = {
      lunch_appetizer:   { title: "Mittag Vorspeise", details: menu.lunch_appetizer ?? "" },
      lunch_meat:        { title: "Mittag Fleisch", details: dishName(menu.lunch_main_dish_meat) },
      lunch_fish:        { title: "Mittag Fisch", details: dishName(menu.lunch_main_dish_fish) },
      lunch_vegetarian:  { title: "Mittag Vegetarisch", details: dishName(menu.lunch_main_dish_vegetarian) },
      lunch_dessert:     { title: "Mittag Dessert", details: menu.lunch_dessert ?? "" },
      dinner_appetizer:  { title: "Abend Vorspeise", details: menu.dinner_appetizer ?? "" },
      dinner_meat:       { title: "Abend Fleisch", details: dishName(menu.dinner_main_dish_meat) },
      dinner_fish:       { title: "Abend Fisch", details: dishName(menu.dinner_main_dish_fish) },
      dinner_vegetarian: { title: "Abend Vegetarisch", details: dishName(menu.dinner_main_dish_vegetarian) },
      dinner_dessert:    { title: "Abend Dessert", details: menu.dinner_dessert ?? "" },
    };

    const { style: hotelStyle, references: hotelRefs } = await loadHotelStyle(supabase);
    const images: Record<string, string> = {};
    const warnings: string[] = [];

    for (const [type, info] of Object.entries(dishMap)) {
      if (onlyTypes && !onlyTypes.includes(type)) continue;
      if (!info.details) continue;

      // When regenerating a specific dish, deactivate previous active rows so the new one wins
      if (regenerate) {
        await supabase.from("conference_menu_images")
          .update({ is_active: false })
          .eq("menu_id", menu_id).eq("image_type", type).eq("is_active", true);
      }


      if (!regenerate) {
        const { data: existing } = await supabase
          .from("conference_menu_images").select("image_url")
          .eq("menu_id", menu_id).eq("image_type", type).eq("is_active", true)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (existing?.image_url) { images[type] = existing.image_url; continue; }
      }

      const bytes = await generateImage(`Food-Fotografie für Hotel-Tagungsmenü: ${info.details}.`, hotelStyle, hotelRefs);
      if (!bytes) { warnings.push(`${type}: KI-Bild fehlgeschlagen`); continue; }

      const path = `menus/${menu_id}/${type}.png`;
      const { error: upErr } = await supabase.storage.from("menu-images").upload(path, bytes, { contentType: "image/png", upsert: true });
      if (upErr) { warnings.push(`${type}: Upload fehlgeschlagen`); continue; }
      const { data: pub } = supabase.storage.from("menu-images").getPublicUrl(path);
      images[type] = pub.publicUrl;

      await supabase.from("conference_menu_images").insert({
        menu_id, image_type: type, image_url: pub.publicUrl, storage_path: path, is_active: true,
      });
    }

    // PDF (skip when only regenerating individual dishes)
    if (!skipPdf) {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595, 842]);
      const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
      const reg = await pdf.embedFont(StandardFonts.TimesRoman);
      let y = 800;
      page.drawText(`Tagesmenü ${new Date(menu.menu_date).toLocaleDateString("de-DE")}`, { x: 36, y, size: 18, font: bold, color: rgb(0.1,0.1,0.1) });
      y -= 24;
      page.drawLine({ start: { x: 36, y }, end: { x: 559, y }, thickness: 1, color: rgb(0.7,0.7,0.7) });
      y -= 20;

      const sections = [
        { h: "Mittag", items: [
          ["Vorspeise", menu.lunch_appetizer, "lunch_appetizer"],
          ["Fleisch", `${dishName(menu.lunch_main_dish_meat)} – ${dishDesc(menu.lunch_main_dish_meat)}`, "lunch_meat"],
          ["Fisch", `${dishName(menu.lunch_main_dish_fish)} – ${dishDesc(menu.lunch_main_dish_fish)}`, "lunch_fish"],
          ["Vegetarisch", `${dishName(menu.lunch_main_dish_vegetarian)} – ${dishDesc(menu.lunch_main_dish_vegetarian)}`, "lunch_vegetarian"],
          ["Dessert", menu.lunch_dessert, "lunch_dessert"],
        ]},
        { h: "Abend", items: [
          ["Vorspeise", menu.dinner_appetizer, "dinner_appetizer"],
          ["Fleisch", `${dishName(menu.dinner_main_dish_meat)} – ${dishDesc(menu.dinner_main_dish_meat)}`, "dinner_meat"],
          ["Fisch", `${dishName(menu.dinner_main_dish_fish)} – ${dishDesc(menu.dinner_main_dish_fish)}`, "dinner_fish"],
          ["Vegetarisch", `${dishName(menu.dinner_main_dish_vegetarian)} – ${dishDesc(menu.dinner_main_dish_vegetarian)}`, "dinner_vegetarian"],
          ["Dessert", menu.dinner_dessert, "dinner_dessert"],
        ]},
      ] as const;

      for (const sec of sections) {
        page.drawText(sec.h, { x: 36, y, size: 14, font: bold, color: rgb(0.15,0.15,0.15) });
        y -= 18;
        for (const [label, text, key] of sec.items) {
          if (!text || (typeof text === 'string' && text.trim() === '–')) continue;
          const line = `${label}: ${String(text).slice(0, 120)}`;
          page.drawText(line, { x: 36, y, size: 11, font: reg, color: rgb(0.15,0.15,0.15) });
          y -= 14;
          const url = images[key];
          if (url && y > 180) {
            try {
              const res = await fetch(url); const ab = new Uint8Array(await res.arrayBuffer());
              const img = await pdf.embedPng(ab);
              const sc = img.scaleToFit(523, 130);
              page.drawImage(img, { x: 36, y: y - sc.height, width: sc.width, height: sc.height });
              y -= sc.height + 10;
            } catch (e) { console.error("embed image", e); }
          }
        }
        y -= 8;
      }

      const pdfBytes = await pdf.save();
      const pdfPath = `daily/${menu.menu_date}.pdf`;
      await supabase.storage.from("menu-cards").upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
      const { data: pdfPub } = supabase.storage.from("menu-cards").getPublicUrl(pdfPath);

      await supabase.from("daily_menu_assets").upsert({
        menu_id, menu_date: menu.menu_date,
        pdf_path: pdfPath, pdf_url: pdfPub.publicUrl,
        images, status: warnings.length ? "ready_with_warnings" : "ready",
        error_message: warnings.join("; ") || null,
      }, { onConflict: "menu_id" });
    } else {
      // Only update images map + status, keep existing PDF
      await supabase.from("daily_menu_assets").upsert({
        menu_id, menu_date: menu.menu_date,
        images, status: warnings.length ? "ready_with_warnings" : "ready",
        error_message: warnings.join("; ") || null,
      }, { onConflict: "menu_id" });
    }

    })();

    // Run heavy work in background; respond immediately to avoid CPU/timeout limits
    // @ts-ignore EdgeRuntime is provided by Supabase edge runtime
    EdgeRuntime.waitUntil(
      work.catch(async (err) => {
        console.error("auto-menu-assets background failed", err);
        await supabase.from("daily_menu_assets").upsert({
          menu_id, menu_date: menu.menu_date,
          status: "failed", error_message: (err as Error).message,
        }, { onConflict: "menu_id" });
      })
    );

    return new Response(JSON.stringify({ success: true, status: "processing", menu_id }), {
      status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
