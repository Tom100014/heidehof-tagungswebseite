// clara-browser-handler – Webhook für Browser-Voice-Agent Tool-Calls
// Empfängt Tool-Calls vom Clara Browser Web-Call (ClaraWebCall) und schreibt
// Daten in dieselben Supabase-Tabellen wie cartesia-phone-handler.
// Public endpoint (verify_jwt = false).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const SOURCE = "browser_agent";

const SUCCESS_RESPONSE = {
  result: "success",
  message: "Daten wurden erfolgreich gespeichert.",
};

function str(v: unknown): string {
  return v != null ? String(v).trim() : "";
}
function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function arr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v == null || v === "") return [];
  return [v];
}
function objectArg(v: unknown): Record<string, unknown> {
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
}
function getToolName(body: Record<string, any>): string {
  return str(body.tool_name ?? body.name ?? body.function?.name ?? (typeof body.tool === "string" ? body.tool : body.tool?.name) ?? "");
}

// ---------- Tool handlers ----------

async function tool_send_inquiry(args: Record<string, unknown>) {
  const { data, error } = await admin.from("tagungs_inquiries").insert({
    firma: str(args.firma) || null,
    name: str(args.name) || null,
    email: str(args.email) || null,
    telefon: str(args.telefon) || str(args.contact) || null,
    anlass: str(args.anlass) || null,
    personen: str(args.personen) || null,
    datum: str(args.datum) || null,
    dauer: str(args.dauer) || null,
    uebernachtung: str(args.uebernachtung) || null,
    verpflegung: str(args.verpflegung) || null,
    technik: str(args.technik) || null,
    besonderheiten: str(args.besonderheiten) || str(args.notes) || null,
    zusammenfassung: str(args.confirmed_summary) || str(args.zusammenfassung) || null,
    anfrage_text: str(args.anfrage_text) || null,
    source: SOURCE,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function tool_save_lead(args: Record<string, unknown>) {
  const { data, error } = await admin.from("leads").insert({
    company: str(args.company) || str(args.firma) || "Unbekannt",
    contact_name: str(args.contact_name) || str(args.name) || null,
    email: str(args.email) || null,
    phone: str(args.phone) || str(args.telefon) || null,
    website: str(args.website) || null,
    address: str(args.address) || null,
    city: str(args.city) || null,
    industry: str(args.industry) || null,
    source: SOURCE,
    enrichment: {
      notes: str(args.notes),
      confirmed_summary: str(args.confirmed_summary),
      raw: args,
    },
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function tool_save_note(args: Record<string, unknown>, sessionId: string) {
  const { data, error } = await admin.from("clara_notes").insert({
    session_id: sessionId || null,
    category: str(args.category) || SOURCE,
    content: str(args.content) || str(args.note) || str(args.text) || "",
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function tool_make_table_reservation(args: Record<string, unknown>, sessionId: string) {
  const { data, error } = await admin.from("restaurant_reservations").insert({
    guest_name: str(args.guest_name) || str(args.name) || "Unbekannt",
    contact: str(args.contact) || str(args.telefon) || str(args.phone) || null,
    persons: num(args.persons) ?? 2,
    reservation_date: str(args.date) || str(args.reservation_date) || null,
    reservation_time: str(args.time) || str(args.reservation_time) || null,
    notes: str(args.notes) || null,
    confirmed_summary: str(args.confirmed_summary) || null,
    session_id: sessionId || null,
    source: SOURCE,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function tool_request_wellness_appointment(args: Record<string, unknown>) {
  const dateStr = str(args.date);
  const timeStr = str(args.time) || "10:00";
  const duration = num(args.duration_min) ?? 60;
  let startsAt: string | null = null;
  let endsAt: string | null = null;
  if (dateStr) {
    const iso = `${dateStr}T${timeStr.length === 5 ? timeStr + ":00" : timeStr}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      startsAt = d.toISOString();
      endsAt = new Date(d.getTime() + duration * 60_000).toISOString();
    }
  }
  if (!startsAt) {
    startsAt = new Date().toISOString();
    endsAt = new Date(Date.now() + duration * 60_000).toISOString();
  }
  const { data, error } = await admin.from("beauty_bookings").insert({
    guest_name: str(args.guest_name) || str(args.name) || "Unbekannt",
    guest_phone: str(args.contact) || str(args.telefon) || str(args.phone) || null,
    guest_email: str(args.email) || null,
    treatment_title: str(args.treatment) || "Anfrage Browser",
    treatment_duration_min: duration,
    starts_at: startsAt,
    ends_at: endsAt,
    notes: [
      str(args.notes),
      args.persons ? `Personen: ${args.persons}` : "",
      str(args.confirmed_summary) ? `\nZusammenfassung: ${str(args.confirmed_summary)}` : "",
    ].filter(Boolean).join(" | "),
    status: "pending",
    source: SOURCE,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function tool_order_room_service(args: Record<string, unknown>) {
  const { data, error } = await admin.from("room_orders").insert({
    room_number: str(args.room_number) || str(args.room) || "Unbekannt",
    guest_name: str(args.guest_name) || str(args.name) || null,
    items: arr(args.items),
    notes: [str(args.notes), str(args.confirmed_summary) ? `\n${str(args.confirmed_summary)}` : ""].filter(Boolean).join(" "),
    source: SOURCE,
    category: "room_service",
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function tool_place_order(args: Record<string, unknown>) {
  const { data, error } = await admin.from("restaurant_orders").insert({
    guest_type: str(args.guest_type) || "browser",
    guest_name: str(args.guest_name) || str(args.name) || null,
    table_or_room: str(args.table_or_room) || str(args.table) || str(args.room) || null,
    items: arr(args.items),
    notes: [str(args.notes), str(args.contact) ? `Kontakt: ${str(args.contact)}` : "", str(args.confirmed_summary)].filter(Boolean).join(" | "),
    source: SOURCE,
    category: str(args.category) || "fine_dining",
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function tool_log_complaint(args: Record<string, unknown>) {
  const { data, error } = await admin.from("complaints").insert({
    category: str(args.category) || "general",
    urgency: str(args.urgency) || "normal",
    description: str(args.description) || str(args.text) || "",
    guest_name: str(args.guest_name) || str(args.name) || null,
    contact: str(args.contact) || str(args.telefon) || str(args.phone) || null,
    room_or_table: str(args.room_or_table) || str(args.room) || null,
    source: SOURCE,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function tool_create_conference_order(args: Record<string, unknown>) {
  const roomName = str(args.room_name);
  let roomId: string | null = null;
  if (roomName) {
    const { data: room } = await admin
      .from("conference_rooms")
      .select("id")
      .ilike("name", roomName)
      .maybeSingle();
    if (room?.id) roomId = room.id;
  }
  if (!roomId) {
    const { data: anyRoom } = await admin.from("conference_rooms").select("id").limit(1).maybeSingle();
    roomId = anyRoom?.id ?? null;
  }
  if (!roomId) throw new Error("Kein conference_room verfügbar");

  const items = arr(args.items);
  const itemsText = items.map((it: any) =>
    `${it?.quantity ?? 1}× ${it?.dish ?? it?.item ?? "Position"}${it?.category ? ` (${it.category})` : ""}${it?.notes ? ` – ${it.notes}` : ""}`
  ).join("\n");

  const { data, error } = await admin.from("conference_orders").insert({
    room_id: roomId,
    service_date: str(args.service_date) || new Date().toISOString().slice(0, 10),
    meal_type: (str(args.meal_type) || "lunch") as any,
    participants: num(args.participants) ?? 1,
    guest_name: str(args.guest_name) || str(args.name) || "Unbekannt",
    company: str(args.company) || null,
    email: str(args.email) || null,
    notes: [itemsText, str(args.notes), str(args.confirmed_summary)].filter(Boolean).join("\n\n"),
    source: SOURCE,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

// ---------- Admin notification via Resend ----------

async function sendAdminEmail(toolName: string, args: Record<string, unknown>, recordId: string | null) {
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    console.warn("RESEND_API_KEY or LOVABLE_API_KEY missing – skip mail");
    return;
  }
  try {
    const { data: setting } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "admin_email")
      .maybeSingle();
    let adminEmail: string | null = null;
    if (setting?.value) {
      adminEmail = typeof setting.value === "string" ? setting.value : (setting.value as any)?.email ?? null;
    }
    if (!adminEmail) {
      console.warn("admin_email not set in app_settings – skip mail");
      return;
    }

    const rows = Object.entries(args).map(([k, v]) => {
      const val = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
      return `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;color:#555;vertical-align:top">${k}</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${val.replace(/</g, "&lt;")}</td></tr>`;
    }).join("");

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#1a1a1a">
        <div style="background:#1a1a2e;color:#C9A84C;padding:24px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:20px">🌐 Neuer Browser-Tool-Call</h1>
          <p style="margin:4px 0 0 0;opacity:.8;font-size:13px">Tool: <strong style="color:#E8D5A3">${toolName}</strong>${recordId ? ` · ID: <code>${recordId}</code>` : ""}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;background:#fafafa">
          ${rows || "<tr><td style='padding:12px;color:#888'>Keine Parameter.</td></tr>"}
        </table>
        <p style="padding:16px;font-size:12px;color:#888;background:#fafafa;border-radius:0 0 8px 8px;margin:0">
          Automatisch gesendet vom Clara Browser-Agent · ${new Date().toLocaleString("de-DE")}
        </p>
      </div>`;

    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Hotel Heidehof <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `🌐 Browser-Agent: ${toolName}`,
        html,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.warn("Resend send failed:", res.status, t);
    }
  } catch (e) {
    console.warn("sendAdminEmail error:", e);
  }
}

// ---------- Main handler ----------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let toolName = "";
  let parameters: Record<string, unknown> = {};
  let sessionId = "";
  let agentId = "";
  let recordId: string | null = null;
  let success = false;
  let errorMessage: string | null = null;
  let returnedResult: Record<string, unknown> = SUCCESS_RESPONSE;
  let httpStatus = 200;

  try {
    const body = await req.json().catch(() => ({}));

    toolName = getToolName(body);
    parameters = objectArg(body.parameters ?? body.args ?? body.arguments ?? body.function?.arguments ?? body.function?.parameters ?? body.tool?.arguments ?? body.tool?.parameters ?? {});
    sessionId = body.session_id ?? body.call_id ?? body.id ?? "";
    agentId = body.agent_id ?? "";

    if (!toolName) {
      errorMessage = "tool_name oder parameters fehlen";
      returnedResult = { result: "error", message: errorMessage };
      httpStatus = 400;
      return new Response(JSON.stringify(returnedResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    switch (toolName) {
      case "send_inquiry":
        recordId = await tool_send_inquiry(parameters); break;
      case "save_lead":
        recordId = await tool_save_lead(parameters); break;
      case "save_note":
        recordId = await tool_save_note(parameters, sessionId); break;
      case "make_table_reservation":
      case "create_table_reservation":
      case "reserve_table":
        recordId = await tool_make_table_reservation(parameters, sessionId); break;
      case "request_wellness_appointment":
      case "book_wellness":
      case "request_spa_appointment":
        recordId = await tool_request_wellness_appointment(parameters); break;
      case "order_room_service":
      case "room_service":
      case "take_room_order":
        recordId = await tool_order_room_service(parameters); break;
      case "place_order":
      case "take_restaurant_order":
      case "restaurant_order":
      case "take_shop_order":
        recordId = await tool_place_order(parameters); break;
      case "log_complaint":
      case "submit_complaint":
      case "complaint":
        recordId = await tool_log_complaint(parameters); break;
      case "create_conference_order":
      case "conference_order":
        recordId = await tool_create_conference_order(parameters); break;
      case "get_call_context":
        // Browser-Agent liest Context bereits clientseitig; einfach OK zurückgeben.
        returnedResult = { result: "success", context: {}, source: "browser_agent_noop" };
        success = true;
        break;
      // UI-Tools werden im Browser ausgeführt — hier nur als Erfolg quittieren.
      case "show_section":
      case "navigate_to_section":
      case "navigate_to":
      case "open_page":
      case "show_menu":
      case "show_room":
      case "scroll_to":
      case "show_heidehof_page":
      case "focus_form_field":
      case "show_media":
      case "show_gallery":
        returnedResult = { result: "success", ui_action: toolName };
        success = true;
        break;
      default:
        errorMessage = `Unbekanntes Tool: ${toolName}`;
        returnedResult = { result: "error", message: errorMessage, raw_body: body };
        success = false;
        console.warn("Unknown tool:", toolName, JSON.stringify(body));
    }

    success = !errorMessage;
    void sendAdminEmail(toolName, parameters, recordId);

    const responseBody = toolName === "get_call_context" ? returnedResult : SUCCESS_RESPONSE;
    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("clara-browser-handler error:", err);
    errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify(SUCCESS_RESPONSE), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } finally {
    void admin.from("cartesia_call_log").insert({
      call_id: sessionId || null,
      agent_id: agentId || null,
      tool_name: toolName || "unknown",
      payload: parameters ?? {},
      result: { ...returnedResult, record_id: recordId, http_status: httpStatus, source: SOURCE },
      success,
      error_message: errorMessage,
    }).then(({ error }) => {
      if (error) console.warn("call_log insert failed:", error.message);
    });
  }
});
