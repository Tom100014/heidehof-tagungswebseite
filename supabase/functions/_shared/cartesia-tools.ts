// Shared Cartesia tool definitions + push logic.
// Used by:
//   - supabase/functions/cartesia-agent-setup/index.ts (admin-only manual trigger)
//   - supabase/functions/cartesia-tools-sync/index.ts (open endpoint for DB triggers)
//
// We define the tools once here so prompt + push + verification stay in sync.

export const CARTESIA_AGENT_ID =
  Deno.env.get("CARTESIA_AGENT_ID")?.trim() ||
  "agent_gjYusgM21heczyikufbJ4P";

export const CARTESIA_WEBHOOK_URL =
  Deno.env.get("CARTESIA_WEBHOOK_URL")?.trim() ||
  "https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/cartesia-phone-handler";

export type ToolParamSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
};

export type ToolDef = {
  name: string;
  description: string;
  parameters: ToolParamSchema;
};

function s(desc: string) {
  return { type: "string", description: desc };
}
function i(desc: string) {
  return { type: "integer", description: desc };
}

export const CARTESIA_TOOLS: ToolDef[] = [
  {
    name: "get_call_context",
    description:
      "Liest still den aktuellen Website-/Button-Kontext des Anrufers (Seite, Sektion, Produkt, Trigger). Direkt nach der Begruessung aufrufen. context_token optional – falls Call-Metadaten einen enthalten, uebergeben.",
    parameters: {
      type: "object",
      properties: {
        context_token: s("Optionaler Token aus Call-Metadata"),
      },
    },
  },
  {
    name: "send_inquiry",
    description:
      "Speichert eine allgemeine Tagungs-/Event-Anfrage. Erst aufrufen, NACHDEM du dem Gast confirmed_summary vorgelesen und Bestaetigung erhalten hast.",
    parameters: {
      type: "object",
      properties: {
        name: s("Vollstaendiger Name"),
        email: s("E-Mail"),
        telefon: s("Telefonnummer"),
        firma: s("Firma (optional)"),
        anlass: s("Art der Veranstaltung"),
        personen: s("Anzahl Personen als Text"),
        datum: s("Wunschdatum"),
        nachricht: s("Freitext"),
        confirmed_summary: s("Vom Gast bestaetigte Zusammenfassung"),
      },
      required: ["name", "anlass", "personen", "confirmed_summary"],
    },
  },
  {
    name: "create_conference_order",
    description:
      "Tagungs-/Seminar-Menuebestellung. Erst nach Vorlesen und Bestaetigung der confirmed_summary aufrufen.",
    parameters: {
      type: "object",
      properties: {
        room_name: s("Name des Tagungsraums"),
        service_date: s("Servicedatum YYYY-MM-DD"),
        meal_type: s("breakfast | lunch | dinner | coffeebreak"),
        participants: i("Anzahl Teilnehmer"),
        guest_name: s("Ansprechpartner"),
        company: s("Firma (optional)"),
        email: s("E-Mail"),
        items: {
          type: "array",
          description: "Bestellpositionen",
          items: {
            type: "object",
            properties: {
              dish: s("Gerichtsname"),
              quantity: i("Anzahl"),
              category: s("vegetarisch|fleisch|fisch (optional)"),
            },
            required: ["dish", "quantity"],
          },
        },
        notes: s("Hinweise/Allergien"),
        confirmed_summary: s("Vom Gast bestaetigte Zusammenfassung"),
      },
      required: ["room_name", "service_date", "guest_name", "participants", "confirmed_summary"],
    },
  },
  {
    name: "make_table_reservation",
    description:
      "Tischreservierung fuer Restaurant Maxwell / Bar Maex. Erst nach Vorlesen und Bestaetigung aufrufen.",
    parameters: {
      type: "object",
      properties: {
        date: s("Datum YYYY-MM-DD"),
        time: s("Uhrzeit HH:MM"),
        persons: i("Anzahl Personen"),
        name: s("Name des Gasts"),
        telefon: s("Telefonnummer"),
        notes: s("Wuensche, Allergien, Anlass"),
        confirmed_summary: s("Vom Gast bestaetigte Zusammenfassung"),
      },
      required: ["date", "time", "persons", "name", "confirmed_summary"],
    },
  },
  {
    name: "request_wellness_appointment",
    description:
      "Wellness-/Spa-Terminwunsch. Erst nach Vorlesen und Bestaetigung aufrufen.",
    parameters: {
      type: "object",
      properties: {
        treatment: s("Behandlung"),
        date: s("Wunschdatum YYYY-MM-DD"),
        time: s("Uhrzeit HH:MM"),
        persons: i("Anzahl Personen"),
        guest_name: s("Name"),
        contact: s("Telefon oder E-Mail"),
        notes: s("Besondere Wuensche"),
        confirmed_summary: s("Vom Gast bestaetigte Zusammenfassung"),
      },
      required: ["treatment", "date", "guest_name", "confirmed_summary"],
    },
  },
  {
    name: "submit_complaint",
    description: "Beschwerde / Reklamation. Erst nach Vorlesen und Bestaetigung aufrufen.",
    parameters: {
      type: "object",
      properties: {
        category: s("zimmer, restaurant, service, sauberkeit, technik, sonstiges"),
        urgency: s("low | normal | high | critical"),
        description: s("Was ist passiert"),
        guest_name: s("Name"),
        contact: s("Telefon oder E-Mail"),
        room_or_table: s("Zimmernummer oder Tischnummer"),
        desired_solution: s("Was wuenscht der Gast"),
        confirmed_summary: s("Vom Gast bestaetigte Zusammenfassung"),
      },
      required: ["category", "description", "confirmed_summary"],
    },
  },
  {
    name: "take_restaurant_order",
    description:
      "Restaurant-/Bar-/Zimmer-Bestellung. Erst nach Vorlesen und Bestaetigung aufrufen.",
    parameters: {
      type: "object",
      properties: {
        guest_type: s("hotel_guest | extern | conference"),
        guest_name: s("Name"),
        table_or_room: s("Tischnummer oder Zimmer"),
        items: {
          type: "array",
          description: "Bestellpositionen",
          items: {
            type: "object",
            properties: {
              item: s("Speise oder Getraenk"),
              quantity: i("Anzahl"),
              notes: s("Sonderwuensche"),
            },
            required: ["item", "quantity"],
          },
        },
        notes: s("Allgemeine Hinweise"),
        confirmed_summary: s("Vom Gast bestaetigte Zusammenfassung"),
      },
      required: ["guest_name", "items", "confirmed_summary"],
    },
  },
];

// Body template that the webhook receives. Cartesia substitutes {{tool_name}},
// {{parameters}}, {{call.session_id}}, {{call.agent_id}} at runtime if the API
// supports templating; otherwise we include redundant flat fields that the
// handler also accepts (tool_name, parameters, session_id, agent_id).
const BODY_TEMPLATE = {
  tool_name: "{{tool_name}}",
  parameters: "{{parameters}}",
  session_id: "{{call.session_id}}",
  agent_id: "{{call.agent_id}}",
};

// Build several payload shapes for cross-version compatibility with the Cartesia
// agents API. We send each shape until one is accepted.
export function buildToolPayloads() {
  return CARTESIA_TOOLS.map((t) => ({
    // Modern shape (function-style)
    type: "function",
    name: t.name,
    description: t.description,
    parameters: t.parameters,
    // Webhook binding – multiple aliases used across Cartesia API versions
    webhook: {
      url: CARTESIA_WEBHOOK_URL,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: BODY_TEMPLATE,
    },
    url: CARTESIA_WEBHOOK_URL,
    method: "POST",
    body_template: BODY_TEMPLATE,
    // Some agent APIs expect server { type:"webhook", url:..., body:... }
    server: {
      type: "webhook",
      url: CARTESIA_WEBHOOK_URL,
      method: "POST",
      body: BODY_TEMPLATE,
    },
  }));
}

export type CartesiaAttempt = {
  method: string;
  path: string;
  shape: string;
  status: number;
  ok: boolean;
  body: unknown;
};

async function cartesiaRequest(
  apiKey: string,
  method: string,
  path: string,
  body?: unknown,
) {
  const res = await fetch(`https://api.cartesia.ai${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Cartesia-Version": "2026-03-01",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, ok: res.ok, body: parsed };
}

// Extract tool/function names from an /agents/{id} response, regardless of which
// field name the current API uses.
export function extractRegisteredTools(agentBody: unknown): string[] {
  const out = new Set<string>();
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const obj = node as Record<string, unknown>;
    for (const key of ["tools", "functions", "webhooks", "actions"]) {
      const arr = obj[key];
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && typeof item === "object") {
            const name =
              (item as Record<string, unknown>).name ??
              (item as Record<string, unknown>).tool_name ??
              ((item as Record<string, unknown>).function as Record<string, unknown> | undefined)?.name;
            if (typeof name === "string") out.add(name);
          }
        }
      }
    }
    // Recurse one level – Cartesia sometimes nests under config / settings.
    for (const v of Object.values(obj)) walk(v);
  };
  walk(agentBody);
  return Array.from(out);
}

export type SyncResult = {
  at: string;
  mode: "auto_push" | "manual_copy";
  success: boolean;
  agent_id: string;
  agent_reachable: boolean;
  push_succeeded: boolean;
  webhook_url: string;
  tools_intended: string[];
  tools_registered: string[];
  tools_missing: string[];
  api_attempts: CartesiaAttempt[];
  agent_probe: { status: number; body: unknown } | null;
  key_meta: { present: boolean; length: number; prefix: string; suffix: string };
  error?: string;
  hint?: string;
};

export async function pushAndVerifyTools(apiKey: string): Promise<SyncResult> {
  const at = new Date().toISOString();
  const tools_intended = CARTESIA_TOOLS.map((t) => t.name);
  const key_meta = {
    present: !!apiKey,
    length: apiKey?.length ?? 0,
    prefix: apiKey ? apiKey.slice(0, 7) : "",
    suffix: apiKey ? apiKey.slice(-4) : "",
  };

  if (!apiKey) {
    return {
      at, mode: "manual_copy", success: false,
      agent_id: CARTESIA_AGENT_ID,
      agent_reachable: false, push_succeeded: false,
      webhook_url: CARTESIA_WEBHOOK_URL,
      tools_intended, tools_registered: [], tools_missing: tools_intended,
      api_attempts: [], agent_probe: null, key_meta,
      error: "CARTESIA_ADMIN_API_KEY / CARTESIA_API_KEY fehlt",
      hint: "Setze CARTESIA_ADMIN_API_KEY als Edge-Function-Secret. Der Key muss zum Workspace des Agenten gehoeren.",
    };
  }

  const tools = buildToolPayloads();
  const attempts: CartesiaAttempt[] = [];

  // 1) Probe agent
  const probe = await cartesiaRequest(apiKey, "GET", `/agents/${CARTESIA_AGENT_ID}`);
  const agent_reachable = probe.ok;
  let push_succeeded = false;

  if (agent_reachable) {
    // Try several shapes/endpoints. First win short-circuits.
    const flatTools = tools;
    const candidates: Array<{ method: string; path: string; shape: string; body: unknown }> = [
      { method: "PATCH", path: `/agents/${CARTESIA_AGENT_ID}`, shape: "tools_root", body: { tools: flatTools } },
      { method: "PATCH", path: `/agents/${CARTESIA_AGENT_ID}`, shape: "functions_root", body: { functions: flatTools } },
      { method: "PATCH", path: `/agents/${CARTESIA_AGENT_ID}`, shape: "config_tools", body: { config: { tools: flatTools } } },
      { method: "PUT",   path: `/agents/${CARTESIA_AGENT_ID}`, shape: "tools_root", body: { tools: flatTools } },
      { method: "PATCH", path: `/agents/${CARTESIA_AGENT_ID}/config`, shape: "tools_in_config_path", body: { tools: flatTools } },
      { method: "POST",  path: `/agents/${CARTESIA_AGENT_ID}/tools`, shape: "tools_collection", body: { tools: flatTools } },
      { method: "PUT",   path: `/agents/${CARTESIA_AGENT_ID}/tools`, shape: "tools_collection_put", body: { tools: flatTools } },
    ];
    for (const c of candidates) {
      const r = await cartesiaRequest(apiKey, c.method, c.path, c.body);
      attempts.push({ method: c.method, path: c.path, shape: c.shape, status: r.status, ok: r.ok, body: r.body });
      if (r.ok) { push_succeeded = true; break; }
    }
  }

  // 2) Re-probe agent to read registered tool names
  let tools_registered: string[] = [];
  let finalProbe = probe;
  if (agent_reachable) {
    finalProbe = await cartesiaRequest(apiKey, "GET", `/agents/${CARTESIA_AGENT_ID}`);
    tools_registered = extractRegisteredTools(finalProbe.body);
  }
  const tools_missing = tools_intended.filter((t) => !tools_registered.includes(t));

  return {
    at,
    mode: push_succeeded ? "auto_push" : "manual_copy",
    success: agent_reachable && push_succeeded && tools_missing.length === 0,
    agent_id: CARTESIA_AGENT_ID,
    agent_reachable,
    push_succeeded,
    webhook_url: CARTESIA_WEBHOOK_URL,
    tools_intended,
    tools_registered,
    tools_missing,
    api_attempts: attempts,
    agent_probe: { status: finalProbe.status, body: finalProbe.body },
    key_meta,
    hint: push_succeeded
      ? (tools_missing.length === 0
          ? "Alle Tools registriert."
          : `Push akzeptiert, aber Agent meldet folgende Tools NICHT als registriert: ${tools_missing.join(", ")}. Cartesia-Schema kann abweichen – Tools im Agent Builder pruefen.`)
      : (agent_reachable
          ? "Agent erreichbar, aber kein API-Endpoint akzeptierte die Tools. Tools manuell im Cartesia Agent Builder einfuegen (siehe tools_intended)."
          : `Agent nicht erreichbar (HTTP ${probe.status}). Vermutlich gehoert der API-Key nicht zum Workspace des Agenten oder die Agent-ID ist falsch.`),
  };
}

export function readCartesiaApiKey(): string {
  return (
    Deno.env.get("CARTESIA_ADMIN_API_KEY")?.trim() ||
    Deno.env.get("CARTESIA_API_KEY")?.trim() ||
    ""
  );
}
