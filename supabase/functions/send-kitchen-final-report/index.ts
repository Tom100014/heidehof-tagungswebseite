// Daily kitchen report — sent at 10:30 by cron
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

function todayBerlin(): string {
  const d = new Date();
  const local = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
}

interface Agg {
  room: string;
  participants: number;
  fish: number;
  meat: number;
  vegetarian: number;
  orders: Array<{ guest_name: string; company: string | null; participants: number; notes: string | null; created_at: string }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({} as any));
    const serviceDate: string = body.service_date || todayBerlin();
    const mealType: "lunch" | "dinner" = body.meal_type || "lunch";
    const overrideTo: string[] | undefined = body.to;

    // Recipients from app_settings
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "kitchen_report_recipients")
      .maybeSingle();
    const cfg = (setting?.value ?? {}) as { to?: string[]; cc?: string[] };
    const to = overrideTo?.length ? overrideTo : (cfg.to ?? []).filter(Boolean);
    const cc = (cfg.cc ?? []).filter(Boolean);
    const fromAddr = "Hotel Der Heidehof <onboarding@resend.dev>";

    if (!to.length) {
      return new Response(JSON.stringify({ ok: false, error: "Keine Küchen-Empfänger konfiguriert" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch orders for date+meal
    const { data: orders, error: ordErr } = await supabase
      .from("conference_orders")
      .select("id, room_id, participants, guest_name, company, notes, created_at, meal_type")
      .eq("service_date", serviceDate)
      .eq("meal_type", mealType)
      .order("created_at", { ascending: true });
    if (ordErr) throw ordErr;

    const orderIds = (orders ?? []).map((o: any) => o.id);
    const [{ data: items }, { data: rooms }, { data: menu }] = await Promise.all([
      orderIds.length
        ? supabase.from("conference_order_items").select("order_id, course, dish_type, quantity").in("order_id", orderIds).eq("course", "main")
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("conference_rooms").select("id, name"),
      supabase.from("conference_menus").select("*").eq("menu_date", serviceDate).maybeSingle(),
    ]);

    const roomMap = new Map((rooms ?? []).map((r: any) => [r.id, r.name as string]));
    const orderToRoom = new Map((orders ?? []).map((o: any) => [o.id, o.room_id]));
    const agg = new Map<string, Agg>();
    for (const o of orders ?? []) {
      if (!agg.has(o.room_id)) {
        agg.set(o.room_id, {
          room: roomMap.get(o.room_id) ?? "Raum",
          participants: 0, fish: 0, meat: 0, vegetarian: 0, orders: [],
        });
      }
      const a = agg.get(o.room_id)!;
      a.participants += o.participants ?? 0;
      a.orders.push({
        guest_name: o.guest_name, company: o.company,
        participants: o.participants, notes: o.notes, created_at: o.created_at,
      });
    }
    for (const it of items ?? []) {
      const room = orderToRoom.get((it as any).order_id);
      if (!room) continue;
      const a = agg.get(room as string); if (!a) continue;
      const dt = (it as any).dish_type as "fish" | "meat" | "vegetarian" | null;
      if (dt && (dt === "fish" || dt === "meat" || dt === "vegetarian")) a[dt] += (it as any).quantity ?? 0;
    }

    const totals = Array.from(agg.values()).reduce(
      (a, r) => ({ p: a.p + r.participants, f: a.f + r.fish, m: a.m + r.meat, v: a.v + r.vegetarian }),
      { p: 0, f: 0, m: 0, v: 0 }
    );

    // Generate kitchen plan PDF
    let pdfUrl: string | null = null;
    try {
      const pdfRes = await supabase.functions.invoke("kitchen-plan-pdf", {
        body: { service_date: serviceDate, meal_type: mealType },
      });
      pdfUrl = (pdfRes.data as any)?.url ?? null;
    } catch (e) {
      console.warn("PDF generation failed:", e);
    }

    const dishName = (t: string) => (menu as any)?.[`${mealType}_main_dish_${t}`]?.name ?? "—";
    const dateStr = new Date(serviceDate).toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const roomsHtml = Array.from(agg.values()).sort((a, b) => a.room.localeCompare(b.room)).map((r) => `
      <tr><td colspan="2" style="background:#f7f3e8;padding:10px 12px;font-weight:700;color:#2a2418;border-top:2px solid #d9b45a;">
        ${r.room} <span style="font-weight:400;color:#7d6d4f;">· ${r.participants} Personen</span>
      </td></tr>
      <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">🐟 Fisch</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;">${r.fish}</td></tr>
      <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">🥩 Fleisch</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;">${r.meat}</td></tr>
      <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">🥗 Vegetarisch</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;">${r.vegetarian}</td></tr>
      ${r.orders.map(o => `<tr><td colspan="2" style="padding:6px 12px;font-size:12px;color:#6b5e44;border-bottom:1px solid #f3eee2;">· ${new Date(o.created_at).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})} – ${o.guest_name}${o.company ? ` (${o.company})` : ""} · ${o.participants} P.${o.notes ? ` · ${o.notes.slice(0,80)}` : ""}</td></tr>`).join("")}
    `).join("");

    const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#fff;color:#2a2418;margin:0;padding:24px;">
      <div style="max-width:680px;margin:auto;border:1px solid #e6dcc1;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a1408,#2a2418);color:#d9b45a;padding:20px 24px;">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;">Hotel Der Heidehof</div>
          <h1 style="margin:6px 0 0;font-size:22px;color:#f5e8c7;">Küchen-Tagesreport</h1>
          <div style="font-size:13px;color:#c9b88a;margin-top:4px;">${dateStr} · ${mealType === "lunch" ? "Mittagessen" : "Abendessen"}</div>
        </div>
        <div style="padding:20px 24px;background:#fffaf1;">
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
            <div style="flex:1;min-width:120px;background:#fff;border:1px solid #e6dcc1;border-radius:8px;padding:12px;"><div style="font-size:10px;color:#9a8a66;letter-spacing:1px;">PERSONEN</div><div style="font-size:24px;font-weight:700;">${totals.p}</div></div>
            <div style="flex:1;min-width:120px;background:#fff;border:1px solid #e6dcc1;border-radius:8px;padding:12px;"><div style="font-size:10px;color:#9a8a66;letter-spacing:1px;">FISCH</div><div style="font-size:24px;font-weight:700;">${totals.f}</div><div style="font-size:11px;color:#7d6d4f;">${dishName("fish")}</div></div>
            <div style="flex:1;min-width:120px;background:#fff;border:1px solid #e6dcc1;border-radius:8px;padding:12px;"><div style="font-size:10px;color:#9a8a66;letter-spacing:1px;">FLEISCH</div><div style="font-size:24px;font-weight:700;">${totals.m}</div><div style="font-size:11px;color:#7d6d4f;">${dishName("meat")}</div></div>
            <div style="flex:1;min-width:120px;background:#fff;border:1px solid #e6dcc1;border-radius:8px;padding:12px;"><div style="font-size:10px;color:#9a8a66;letter-spacing:1px;">VEGETARISCH</div><div style="font-size:24px;font-weight:700;">${totals.v}</div><div style="font-size:11px;color:#7d6d4f;">${dishName("vegetarian")}</div></div>
          </div>
          ${pdfUrl ? `<a href="${pdfUrl}" style="display:inline-block;background:#d9b45a;color:#1a1408;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:700;margin-bottom:16px;">📄 Aufstellplan als PDF öffnen</a>` : ""}
          <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e6dcc1;border-radius:8px;overflow:hidden;margin-top:12px;">
            ${roomsHtml || `<tr><td style="padding:24px;text-align:center;color:#7d6d4f;">Keine Bestellungen für diesen Service.</td></tr>`}
          </table>
        </div>
        <div style="padding:14px 24px;background:#1a1408;color:#9a8a66;font-size:11px;text-align:center;">Automatisch generiert · ${new Date().toLocaleString("de-DE",{timeZone:"Europe/Berlin"})}</div>
      </div></body></html>`;

    const triggerSource: string = body.trigger_source || (overrideTo ? "manual" : "cron");
    let sendErr: string | null = null;
    let sendRes: any = null;
    try {
      sendRes = await resend.emails.send({
        from: fromAddr,
        to,
        cc: cc.length ? cc : undefined,
        subject: `Küchen-Report ${dateStr} · ${totals.p} Personen (${totals.f}🐟 / ${totals.m}🥩 / ${totals.v}🥗)`,
        html,
      });
      if ((sendRes as any)?.error) sendErr = JSON.stringify((sendRes as any).error);
    } catch (e) {
      sendErr = (e as Error).message;
    }

    await supabase.from("kitchen_report_runs").insert({
      trigger_source: triggerSource,
      service_date: serviceDate,
      success: !sendErr,
      recipients: { to, cc },
      pdf_url: pdfUrl,
      orders_count: (orders ?? []).length,
      error: sendErr,
    });

    if (sendErr) {
      return new Response(JSON.stringify({ ok: false, error: sendErr }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, sent_to: to, cc, totals, pdf_url: pdfUrl, resend: sendRes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-kitchen-final-report failed:", e);
    try {
      await supabase.from("kitchen_report_runs").insert({
        trigger_source: "error",
        success: false,
        error: (e as Error).message,
      });
    } catch (_) {/* swallow */}
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
