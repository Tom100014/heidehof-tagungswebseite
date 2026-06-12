// submit-silent-order — Nimmt eine stille (sprachlose) Bestellung entgegen,
// routet sie je nach Gasttyp in die richtige Tabelle und triggert die
// existierende E-Mail-Routing-Logik per `forward_request_to_route`-Trigger.
//
// Eingang: { guest_type, guest_name, contact, reference, notes, items[], total_eur, source }
// Ausgang: { success: true, order_id, target_table }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SilentOrderItem {
  id: string;
  kind: "food" | "drink" | "treatment";
  title: string;
  quantity: number;
  price_label?: string | null;
  price_eur?: number | null;
  scheduled_for?: string | null;
}

interface SilentOrderBody {
  guest_type: "tagungsgast" | "hotelgast" | "restaurantgast" | "spa_tagesgast" | "besucher";
  guest_name: string;
  contact?: string | null;
  reference?: string | null;
  notes?: string | null;
  items: SilentOrderItem[];
  total_eur: number;
  source?: string;
}

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSummary(items: SilentOrderItem[], total: number): string {
  const lines = items.map((i) => `• ${i.quantity}× ${i.title}${i.price_label ? ` (${i.price_label})` : ""}`);
  lines.push("");
  lines.push(`Summe (geschätzt): ${total.toFixed(2).replace(".", ",")} €`);
  return lines.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as SilentOrderBody;

    if (!body?.guest_name?.trim()) return ok({ success: false, error: "Name fehlt." }, 400);
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return ok({ success: false, error: "Warenkorb ist leer." }, 400);
    }

    const summary = buildSummary(body.items, body.total_eur ?? 0);
    const notes = [
      body.notes?.trim() || null,
      `Kontakt: ${body.contact ?? "—"}`,
      `Referenz: ${body.reference ?? "—"}`,
      "",
      "── Stille Bestellung (Web) ──",
      summary,
    ].filter(Boolean).join("\n");

    let target_table = "complaints"; // Fallback (existiert immer + hat E-Mail-Routing)
    let order_id: string | null = null;

    switch (body.guest_type) {
      case "tagungsgast": {
        // → conference_orders (room über reference matchen, sonst NULL behalten)
        let room_id: string | null = null;
        if (body.reference?.trim()) {
          const { data: room } = await admin
            .from("conference_rooms")
            .select("id")
            .ilike("name", `%${body.reference.trim()}%`)
            .maybeSingle();
          room_id = (room as { id?: string } | null)?.id ?? null;
        }
        if (room_id) {
          const today = new Date().toISOString().slice(0, 10);
          const meal = new Date().getHours() < 15 ? "lunch" : "dinner";
          const { data, error } = await admin
            .from("conference_orders")
            .insert({
              room_id,
              service_date: today,
              guest_name: body.guest_name,
              company: null,
              email: body.contact ?? null,
              meal_type: meal,
              participants: 1,
              notes,
              source: body.source ?? "silent_order_web",
            })
            .select("id")
            .single();
          if (!error && data) {
            order_id = data.id;
            target_table = "conference_orders";
          }
        }
        break;
      }
      // Hotel/Restaurant/Spa/Besucher → wir nutzen die generische `complaints`-Pipeline
      // (= „Anfrage an Empfang") — bestehender Trigger forward_request_to_route
      // verschickt die Mail an die richtige Adresse. Sobald dedizierte Tabellen
      // wie `room_orders` / `restaurant_orders` existieren, ist hier 1 Switch-
      // Branch zusätzlich nötig.
    }

    if (!order_id) {
      const category = (() => {
        switch (body.guest_type) {
          case "hotelgast": return "room_service";
          case "restaurantgast": return "fine_dining";
          case "spa_tagesgast": return "spa";
          default: return "general";
        }
      })();
      const { data, error } = await admin
        .from("complaints")
        .insert({
          guest_name: body.guest_name,
          guest_type: body.guest_type,
          room_or_table: body.reference ?? null,
          contact: body.contact ?? null,
          category,
          urgency: "normal",
          description: `Stille Bestellung\n\n${summary}\n\n${body.notes ?? ""}`,
          source: body.source ?? "silent_order_web",
        })
        .select("id")
        .single();
      if (error) {
        console.error("complaints insert failed", error);
        return ok({ success: false, error: error.message }, 500);
      }
      order_id = data.id;
      target_table = "complaints";
    }

    return ok({ success: true, order_id, target_table });
  } catch (err) {
    console.error("submit-silent-order error", err);
    return ok({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
