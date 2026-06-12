import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const _authFail = await requireAdmin(req);
  if (_authFail) return _authFail;
  try {
    const { service_date, meal_type } = await req.json();
    if (!service_date || !meal_type) throw new Error("service_date und meal_type erforderlich");

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: orders }, { data: menu }, { data: rooms }] = await Promise.all([
      supa.from("conference_orders").select("id, room_id, participants, guest_name, company, notes")
        .eq("service_date", service_date).eq("meal_type", meal_type),
      supa.from("conference_menus").select("*").eq("menu_date", service_date).maybeSingle(),
      supa.from("conference_rooms").select("id, name"),
    ]);

    const orderIds = (orders ?? []).map((o: any) => o.id);
    const { data: items } = orderIds.length ? await supa.from("conference_order_items")
      .select("order_id, course, dish_type, quantity")
      .in("order_id", orderIds).eq("course", "main") : { data: [] };

    const dishName = (t: string) => menu?.[`${meal_type}_main_dish_${t}`]?.name ?? "—";
    const roomMap = new Map((rooms ?? []).map((r: any) => [r.id, r.name]));
    const orderToRoom = new Map((orders ?? []).map((o: any) => [o.id, o.room_id]));

    interface Agg { room: string; participants: number; fish: number; meat: number; veg: number; orders: any[]; }
    const agg = new Map<string, Agg>();
    for (const o of orders ?? []) {
      const k = o.room_id;
      if (!agg.has(k)) agg.set(k, { room: roomMap.get(k) as string ?? "Raum", participants: 0, fish: 0, meat: 0, veg: 0, orders: [] });
      const a = agg.get(k)!;
      a.participants += o.participants ?? 0;
      a.orders.push(o);
    }
    for (const it of items ?? []) {
      const room = orderToRoom.get(it.order_id);
      if (!room) continue;
      const a = agg.get(room); if (!a) continue;
      if (it.dish_type === "fish") a.fish += it.quantity;
      if (it.dish_type === "meat") a.meat += it.quantity;
      if (it.dish_type === "vegetarian") a.veg += it.quantity;
    }

    // Build PDF
    const pdf = await PDFDocument.create();
    const helv = await pdf.embedFont(StandardFonts.HelveticaBold);
    const helvR = await pdf.embedFont(StandardFonts.Helvetica);
    let page = pdf.addPage([595, 842]);
    const { width, height } = page.size();
    const gold = rgb(0.83, 0.66, 0.34);
    const dark = rgb(0.1, 0.08, 0.05);
    let y = height - 60;

    page.drawText("HOTEL DER HEIDEHOF", { x: 50, y, size: 9, font: helv, color: gold });
    y -= 22;
    page.drawText("Küchen-Aufstellplan", { x: 50, y, size: 28, font: helv, color: dark });
    y -= 22;
    const dateStr = new Date(service_date).toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    page.drawText(`${dateStr} · ${meal_type === "lunch" ? "Mittag" : "Abend"}`, { x: 50, y, size: 11, font: helvR, color: rgb(0.4, 0.35, 0.25) });
    y -= 14;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, color: gold, thickness: 1 });
    y -= 30;

    // Totals
    const totals = Array.from(agg.values()).reduce((a, r) => ({ p: a.p + r.participants, f: a.f + r.fish, m: a.m + r.meat, v: a.v + r.veg }), { p: 0, f: 0, m: 0, v: 0 });
    page.drawText(`Gesamt: ${totals.p} Personen  •  Fisch ${totals.f}  •  Fleisch ${totals.m}  •  Vegetarisch ${totals.v}`, { x: 50, y, size: 11, font: helv, color: dark });
    y -= 20;
    page.drawText(`Fisch:  ${dishName("fish")}`, { x: 50, y, size: 9, font: helvR, color: dark }); y -= 12;
    page.drawText(`Fleisch:  ${dishName("meat")}`, { x: 50, y, size: 9, font: helvR, color: dark }); y -= 12;
    page.drawText(`Vegetarisch:  ${dishName("vegetarian")}`, { x: 50, y, size: 9, font: helvR, color: dark }); y -= 25;

    // Per Room
    for (const a of Array.from(agg.values()).sort((x, y) => x.room.localeCompare(y.room))) {
      if (y < 150) { page = pdf.addPage([595, 842]); y = height - 60; }
      // Room header bar
      page.drawRectangle({ x: 50, y: y - 4, width: width - 100, height: 26, color: rgb(0.96, 0.93, 0.85) });
      page.drawText(a.room.toUpperCase(), { x: 60, y: y + 4, size: 13, font: helv, color: dark });
      page.drawText(`${a.participants} Personen`, { x: width - 160, y: y + 4, size: 11, font: helv, color: gold });
      y -= 35;

      // Tiles
      const tileW = (width - 130) / 3;
      const drawTile = (i: number, label: string, qty: number, dish: string) => {
        const x = 50 + i * (tileW + 15);
        page.drawRectangle({ x, y: y - 60, width: tileW, height: 60, borderColor: gold, borderWidth: 0.7 });
        page.drawText(label, { x: x + 8, y: y - 14, size: 8, font: helv, color: gold });
        page.drawText(String(qty), { x: x + 8, y: y - 38, size: 22, font: helv, color: dark });
        page.drawText(dish.slice(0, 40), { x: x + 8, y: y - 52, size: 7, font: helvR, color: rgb(0.4,0.35,0.25) });
      };
      drawTile(0, "FISCH", a.fish, dishName("fish"));
      drawTile(1, "FLEISCH", a.meat, dishName("meat"));
      drawTile(2, "VEGETARISCH", a.veg, dishName("vegetarian"));
      y -= 70;

      // Notes / orders
      for (const o of a.orders) {
        if (y < 80) { page = pdf.addPage([595, 842]); y = height - 60; }
        let line = `· ${o.guest_name}${o.company ? ` (${o.company})` : ""} – ${o.participants} P.`;
        if (o.notes) line += ` · ${o.notes}`;
        page.drawText(line.slice(0, 110), { x: 60, y, size: 8.5, font: helvR, color: rgb(0.3,0.27,0.22) });
        y -= 11;
      }
      y -= 18;
    }

    if (agg.size === 0) {
      page.drawText("Keine Bestellungen für diesen Service.", { x: 50, y, size: 11, font: helvR, color: dark });
    }

    const bytes = await pdf.save();
    const path = `kitchen-plans/${service_date}-${meal_type}-${Date.now()}.pdf`;
    const { error: upErr } = await supa.storage.from("menu-cards").upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supa.storage.from("menu-cards").getPublicUrl(path);
    return new Response(JSON.stringify({ success: true, url: pub.publicUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
