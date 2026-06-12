// Mews PMS Connector - outbound sync
// Actions: test, list_outlets, list_resources, list_products, list_services,
//          send_inquiry, send_conference_order, send_restaurant_order
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface MewsSettings {
  environment: string;
  platform_address: string;
  client_name: string;
  is_enabled: boolean;
  default_outlet_id: string | null;
  default_account_id: string | null;
}

async function getSettings(): Promise<MewsSettings | null> {
  const { data } = await admin.from("mews_settings").select("*").maybeSingle();
  return data as MewsSettings | null;
}

async function getCreds() {
  const clientToken = Deno.env.get("MEWS_CLIENT_TOKEN");
  const accessToken = Deno.env.get("MEWS_ACCESS_TOKEN");
  return { clientToken, accessToken };
}

async function getFieldPermissions(): Promise<Record<string, boolean>> {
  const { data } = await admin.from("mews_field_permissions").select("field_key,allowed");
  const map: Record<string, boolean> = {};
  (data ?? []).forEach((r: { field_key: string; allowed: boolean }) => { map[r.field_key] = r.allowed; });
  return map;
}

function maskPayload(body: Record<string, unknown>) {
  const clone = JSON.parse(JSON.stringify(body));
  if (clone.ClientToken) clone.ClientToken = "***";
  if (clone.AccessToken) clone.AccessToken = "***";
  return clone;
}

async function log(entry: {
  action: string;
  status: "ok" | "error" | "skipped" | "pending";
  http_status?: number;
  request?: unknown;
  response?: unknown;
  error?: string;
  source_table?: string;
  source_id?: string;
}) {
  await admin.from("mews_sync_log").insert({
    direction: "outbound",
    action: entry.action,
    status: entry.status,
    http_status: entry.http_status,
    request: entry.request,
    response: entry.response,
    error: entry.error,
    source_table: entry.source_table,
    source_id: entry.source_id,
  });
}

async function mewsCall(endpoint: string, body: Record<string, unknown>, settings: MewsSettings) {
  const { clientToken, accessToken } = await getCreds();
  if (!clientToken || !accessToken) {
    throw new Error("Mews-Zugangsdaten fehlen (MEWS_CLIENT_TOKEN / MEWS_ACCESS_TOKEN als Secret hinterlegen).");
  }
  const fullBody = {
    ClientToken: clientToken,
    AccessToken: accessToken,
    Client: settings.client_name,
    ...body,
  };
  const url = `${settings.platform_address.replace(/\/$/, "")}/api/connector/v1/${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fullBody),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch { /* keep text */ }
  return { ok: res.ok, status: res.status, body: parsed, sentBody: maskPayload(fullBody) };
}

async function assertAuthorized(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const client = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return false;
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", data.claims.sub);
  return (roles ?? []).some((r: { role: string }) => r.role === "admin" || r.role === "director");
}

function filterByPermissions<T extends Record<string, unknown>>(
  payload: T,
  perms: Record<string, boolean>,
  fieldMap: Record<string, string[]>,
): T {
  const out = { ...payload } as Record<string, unknown>;
  for (const [permKey, keys] of Object.entries(fieldMap)) {
    if (!perms[permKey]) {
      for (const k of keys) delete out[k];
    }
  }
  return out as T;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const isAdmin = await assertAuthorized(req);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Nicht berechtigt" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, payload } = await req.json();
    const settings = await getSettings();
    if (!settings) {
      return new Response(JSON.stringify({ error: "Mews-Einstellungen fehlen" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const perms = await getFieldPermissions();

    switch (action) {
      case "test": {
        const r = await mewsCall("configuration/get", {}, settings);
        const hotelName = (r.body as { Enterprise?: { Name?: string } })?.Enterprise?.Name;
        await admin.from("mews_settings").update({
          last_test_at: new Date().toISOString(),
          last_test_status: r.ok ? "ok" : "error",
          last_test_error: r.ok ? null : JSON.stringify(r.body).slice(0, 500),
          hotel_name: hotelName ?? null,
        }).neq("id", "00000000-0000-0000-0000-000000000000");
        await log({ action: "test", status: r.ok ? "ok" : "error", http_status: r.status, request: r.sentBody, response: r.body });
        return new Response(JSON.stringify({ ok: r.ok, hotel: hotelName, raw: r.body }), {
          status: r.ok ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_outlets": {
        const r = await mewsCall("outlets/getAll", {}, settings);
        return new Response(JSON.stringify(r.body), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "list_resources": {
        const r = await mewsCall("resources/getAll", {}, settings);
        return new Response(JSON.stringify(r.body), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "list_products": {
        const r = await mewsCall("products/getAll", {}, settings);
        return new Response(JSON.stringify(r.body), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "list_services": {
        const r = await mewsCall("services/getAll", {}, settings);
        return new Response(JSON.stringify(r.body), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "send_inquiry": {
        // Filter fields based on permissions
        const filtered = filterByPermissions(payload ?? {}, perms, {
          guest_first_name: ["FirstName"],
          guest_last_name: ["LastName"],
          guest_email: ["Email"],
          guest_phone: ["Phone"],
          company_name: ["CompanyName"],
          inquiry_summary: ["Summary"],
          inquiry_attendees: ["Attendees"],
          inquiry_dates: ["StartDate", "EndDate", "Duration"],
        });
        // For inquiries we use serviceOrders/add as a placeholder note record
        const r = await mewsCall("serviceOrders/add", {
          ServiceId: settings.default_outlet_id ?? null,
          Notes: JSON.stringify(filtered),
        }, settings);
        await log({
          action: "send_inquiry",
          status: r.ok ? "ok" : "error",
          http_status: r.status,
          request: r.sentBody,
          response: r.body,
          source_table: payload?.source_table,
          source_id: payload?.source_id,
        });
        return new Response(JSON.stringify(r.body), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "send_conference_order":
      case "send_restaurant_order": {
        // Map our items via mews_mappings (product)
        const items = Array.isArray(payload?.items) ? payload.items : [];
        const { data: productMappings } = await admin
          .from("mews_mappings")
          .select("local_id,mews_id")
          .eq("kind", "product")
          .eq("is_active", true);
        const map: Record<string, string> = {};
        (productMappings ?? []).forEach((m: { local_id: string; mews_id: string }) => { map[m.local_id] = m.mews_id; });

        const orderItems = items
          .map((it: { local_id: string; quantity?: number; unit_price?: number; name?: string }) => ({
            ProductId: map[it.local_id] ?? null,
            UnitCount: it.quantity ?? 1,
            UnitAmount: perms.prices ? { Currency: "EUR", GrossValue: it.unit_price ?? 0 } : undefined,
            Notes: it.name,
          }))
          .filter((it: { ProductId: string | null }) => it.ProductId);

        const body: Record<string, unknown> = {
          AccountId: payload?.account_id ?? settings.default_account_id,
          OutletId: payload?.outlet_id ?? settings.default_outlet_id,
          Items: orderItems,
          Notes: perms.special_requests ? payload?.notes : undefined,
        };

        const r = await mewsCall("orders/add", body, settings);
        await log({
          action,
          status: r.ok ? "ok" : "error",
          http_status: r.status,
          request: r.sentBody,
          response: r.body,
          source_table: payload?.source_table,
          source_id: payload?.source_id,
        });
        return new Response(JSON.stringify(r.body), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: `Unbekannte Aktion: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log({ action: "error", status: "error", error: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
