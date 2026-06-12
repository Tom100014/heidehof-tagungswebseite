// Clara 2.1 – eigener Sprachagent über Lovable AI Gateway
// Empfängt Chathistorie + Session, lädt RAG aus clara_knowledge,
// ruft Lovable AI mit Tool-Calls auf und gibt Antwort + Tool-Aufrufe zurück.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

// ─── Settings-Cache (60 s TTL) — spart 3-5 DB-Roundtrips pro Turn ───
const settingsCache = new Map<string, { value: unknown; exp: number }>();
async function cachedSetting<T = unknown>(key: string): Promise<T | null> {
  const now = Date.now();
  const hit = settingsCache.get(key);
  if (hit && hit.exp > now) return hit.value as T | null;
  const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
  const v = (data?.value ?? null) as T | null;
  settingsCache.set(key, { value: v, exp: now + 60_000 });
  return v;
}

// ─── Concierge-Prompts aus DB (cached) ───
type PromptRow = { key: string; label: string; content: string };
let promptsCache: { rows: PromptRow[]; exp: number } | null = null;
async function loadPrompts(): Promise<PromptRow[]> {
  const now = Date.now();
  if (promptsCache && promptsCache.exp > now) return promptsCache.rows;
  const { data } = await admin.from("clara_prompts").select("key,label,content").order("sort_order");
  const rows = (data ?? []) as PromptRow[];
  promptsCache = { rows, exp: now + 60_000 };
  return rows;
}

// ─── Abort-Controller pro Session (Barge-in: Server-Abbruch) ───
const sessionAbort = new Map<string, AbortController>();

// ─── Knowledge-Base Cache (60s) — KB ändert sich selten, spart 100-300ms/Turn ───
let kbCache: { rag: string; exp: number } | null = null;
async function loadRag(): Promise<string> {
  const now = Date.now();
  if (kbCache && kbCache.exp > now) return kbCache.rag;
  const [kbRes, pkgRes, techRes] = await Promise.all([
    admin.from("clara_knowledge").select("title,category,content").eq("is_active", true).order("sort_order").limit(25),
    admin.from("tagungs_packages").select("title,eyebrow,price_value,price_suffix,price_note,highlights,inclusions,badge,is_bestseller").eq("is_active", true).order("sort_order"),
    admin.from("tech_features").select("title,subtitle,body_md,bullets").eq("is_active", true).order("sort_order"),
  ]);
  const kbBlock = (kbRes.data ?? []).map((k: any) => `### ${k.category.toUpperCase()} — ${k.title}\n${k.content}`).join("\n\n");
  const pkgBlock = (pkgRes.data ?? []).length
    ? "\n\n### TAGUNGSPAUSCHALEN (aktuelle Preise & Inhalte — /tagungspauschalen)\n" +
      (pkgRes.data ?? []).map((p: any) => {
        const hl = Array.isArray(p.highlights) ? p.highlights.join(", ") : "";
        const inc = Array.isArray(p.inclusions) ? p.inclusions.join(", ") : "";
        return `- ${p.is_bestseller ? "★ " : ""}${p.title}${p.eyebrow ? ` (${p.eyebrow})` : ""}: ${p.price_value} ${p.price_suffix}${p.price_note ? ` — ${p.price_note}` : ""}${hl ? `\n  Highlights: ${hl}` : ""}${inc ? `\n  Enthält: ${inc}` : ""}`;
      }).join("\n")
    : "";
  const techBlock = (techRes.data ?? []).length
    ? "\n\n### TAGUNGSTECHNIK & AUSSTATTUNG (/ausstattung-technik)\n" +
      (techRes.data ?? []).map((t: any) => {
        const bl = Array.isArray(t.bullets) ? t.bullets.join(", ") : "";
        return `- ${t.title}${t.subtitle ? ` — ${t.subtitle}` : ""}${bl ? ` | ${bl}` : ""}`;
      }).join("\n")
    : "";
  const bestuhlungBlock = "\n\n### BESTUHLUNGSVARIANTEN (Kapazität je Variante in den Räumen)\n- Theater: maximale Kapazität, Reihenbestuhlung mit Blick nach vorn — Vorträge, Keynotes.\n- Parlament: Tischreihen mit Schreibfläche — Schulungen, längere Sessions.\n- U-Form: offene U-Anordnung — Workshops, Diskussionen bis ~30 Personen.\n- Block: geschlossener Konferenztisch — Vorstands- & Strategiemeetings bis ~24.\n- Bankett: runde Tische à 8–10 — Galas, Hochzeiten, Firmenfeiern.";
  const rag = (kbBlock || "(Wissensbasis leer.)") + pkgBlock + techBlock + bestuhlungBlock;
  kbCache = { rag, exp: now + 60_000 };
  return rag;
}


// ─── Hotel-Briefing fire-and-forget ───
function dispatchBriefing(kind: string, data: Record<string, unknown>, sessionId: string) {
  void admin.functions.invoke("clara-hotel-briefing", { body: { kind, data, sessionId } })
    .catch((e) => console.warn("briefing failed:", e));
}

// Tools, die nur etwas anzeigen oder still speichern → KEIN zweiter LLM-Call nötig (spart 400-800ms)
const PRESENTATION_TOOLS = new Set([
  "show_media","show_gallery","show_room","show_section","recommend_room",
  "navigate_to_section","show_heidehof_page","show_menu","ask_guest_context",
  "focus_form_field","handoff_to_inquiry","handoff_to_max","save_lead","save_note",
  "end_conversation","upsell_suggest",
]);

const TRANSACTIONAL_TOOLS = new Set([
  "send_inquiry",
  "take_room_order",
  "take_restaurant_order",
  "make_table_reservation",
  "take_shop_order",
  "create_conference_order",
  "request_wellness_appointment",
  "submit_complaint",
]);

// ─── Usage-Logging (best effort, fire-and-forget) ───
async function logUsage(entry: {
  tool: string; provider?: string; model?: string;
  units?: number; unit_kind?: string; cost_estimate_eur?: number;
  session_id?: string; meta?: Record<string, unknown>;
}) {
  try {
    await admin.from("clara_usage_log").insert({
      tool: entry.tool,
      provider: entry.provider ?? null,
      model: entry.model ?? null,
      units: entry.units ?? 1,
      unit_kind: entry.unit_kind ?? "request",
      cost_estimate_eur: entry.cost_estimate_eur ?? 0,
      session_id: entry.session_id ?? null,
      meta: entry.meta ?? {},
    });
  } catch (e) { console.warn("usage log failed:", e); }
}

// Grobe Kostenschätzung pro Chat-Call (in EUR, sehr konservativ)
const MODEL_COST_PER_CALL_EUR: Record<string, number> = {
  "google/gemini-3-flash-preview": 0.0008,
  "google/gemini-2.5-flash": 0.0008,
  "google/gemini-2.5-flash-lite": 0.0003,
  "google/gemini-2.5-pro": 0.006,
  "openai/gpt-5-mini": 0.0015,
  "openai/gpt-5-nano": 0.0005,
  "openai/gpt-5": 0.012,
};

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
}

// ─── Site-Tour Spiegel (muss synchron zu src/lib/clara/site-tour.ts bleiben) ───
type Bestuhlung = "u-form" | "parlament" | "bankett" | "theater" | "block";
interface RoomSpec {
  name: string; area: string; area_m2: number;
  capacity_theater: number; capacity_parlament: number;
  capacity_uform: number; capacity_block: number; capacity_bankett: number;
  daylight: boolean; blackout: boolean; note: string;
}
const ROOMS: RoomSpec[] = [
  { name: "Bonn / Berlin", area: "120 m²", area_m2: 120, capacity_theater: 120, capacity_parlament: 80, capacity_uform: 50, capacity_block: 60, capacity_bankett: 90, daylight: true, blackout: true, note: "kombiniertes Flaggschiff" },
  { name: "Frankfurt", area: "80 m²", area_m2: 80, capacity_theater: 70, capacity_parlament: 45, capacity_uform: 32, capacity_block: 36, capacity_bankett: 56, daylight: true, blackout: true, note: "quadratisch, großzügig" },
  { name: "Berlin", area: "70 m²", area_m2: 70, capacity_theater: 60, capacity_parlament: 36, capacity_uform: 28, capacity_block: 30, capacity_bankett: 48, daylight: true, blackout: true, note: "Tageslicht-Klassiker" },
  { name: "Hamburg", area: "50 m²", area_m2: 50, capacity_theater: 40, capacity_parlament: 24, capacity_uform: 20, capacity_block: 22, capacity_bankett: 32, daylight: true, blackout: true, note: "kompakt, fokussiert" },
  { name: "Bonn", area: "50 m²", area_m2: 50, capacity_theater: 40, capacity_parlament: 24, capacity_uform: 20, capacity_block: 22, capacity_bankett: 32, daylight: true, blackout: true, note: "Boutique-Tagung" },
  { name: "Feuer", area: "42 m²", area_m2: 42, capacity_theater: 30, capacity_parlament: 18, capacity_uform: 16, capacity_block: 18, capacity_bankett: 24, daylight: true, blackout: false, note: "Art-Center, warm" },
  { name: "Wasser", area: "38 m²", area_m2: 38, capacity_theater: 28, capacity_parlament: 16, capacity_uform: 14, capacity_block: 16, capacity_bankett: 22, daylight: true, blackout: false, note: "Art-Center, klar" },
  { name: "Holz", area: "35 m²", area_m2: 35, capacity_theater: 25, capacity_parlament: 14, capacity_uform: 12, capacity_block: 14, capacity_bankett: 20, daylight: true, blackout: false, note: "Art-Center, natürlich" },
];
const slugifyRoom = (n: string) => n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const capKeyFor = (b: Bestuhlung): keyof RoomSpec => (
  b === "u-form" ? "capacity_uform" :
  b === "parlament" ? "capacity_parlament" :
  b === "block" ? "capacity_block" :
  b === "bankett" ? "capacity_bankett" : "capacity_theater"
) as keyof RoomSpec;

function recommendRooms(personen: number, bestuhlung: Bestuhlung) {
  const k = capKeyFor(bestuhlung);
  const passend = ROOMS.filter((r) => (r[k] as number) >= personen).sort((a, b) => (a[k] as number) - (b[k] as number));
  if (passend.length === 0) {
    const largest = [...ROOMS].sort((a, b) => (b[k] as number) - (a[k] as number))[0];
    return {
      primary: largest, alternatives: [],
      reason: `Für ${personen} Personen (${bestuhlung}) ist kein einzelner Raum groß genug. Ich empfehle ${largest.name} (max. ${largest[k]}) — wir können auch Räume kombinieren.`,
    };
  }
  return {
    primary: passend[0],
    alternatives: passend.slice(1, 3),
    reason: `${passend[0].name} (${passend[0].area}, max. ${passend[0][k]} in ${bestuhlung}) passt am besten für ${personen} Personen.`,
  };
}

// ─── Visuelle Wissensbank: Topic → bestes Medium (INLINE, ohne HTTP-Hop) ───
const normalizeTxt = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

type MediaRow = {
  id: string; title: string; description: string | null; category: string;
  tags: string[] | null; triggers: string[] | null; media_type: string;
  url: string; thumbnail_url: string | null; caption: string | null;
};
let mediaCache: { rows: MediaRow[]; exp: number } | null = null;
async function loadAllMedia(): Promise<MediaRow[]> {
  const now = Date.now();
  if (mediaCache && mediaCache.exp > now) return mediaCache.rows;
  const { data } = await admin
    .from("clara_media")
    .select("id,title,description,category,tags,triggers,media_type,url,thumbnail_url,caption,sort_order")
    .eq("is_active", true)
    .order("sort_order");
  const rows = (data ?? []) as MediaRow[];
  mediaCache = { rows, exp: now + 60_000 };
  return rows;
}

async function resolveMedia(topic: string, category?: string): Promise<unknown | null> {
  if (!topic && !category) return null;
  try {
    const rows = await loadAllMedia();
    const pool = category ? rows.filter((r) => r.category === category) : rows;
    if (!topic) return pool[0] ? { ...pool[0], match_kind: "category" } : null;

    const norm = normalizeTxt(topic);
    const tokens = norm.split(/[\s,/-]+/).filter((t) => t.length > 1);

    // 1) exakter Tag-Treffer
    for (const tok of tokens) {
      const hit = pool.find((c) => (c.tags ?? []).some((t) => normalizeTxt(t) === tok));
      if (hit) return { ...hit, match_kind: "tag" };
    }
    // 2) Trigger enthält
    for (const c of pool) {
      const triggers = (c.triggers ?? []).map((t) => normalizeTxt(t));
      if (triggers.some((t) => t && (norm.includes(t) || t.includes(norm)))) {
        return { ...c, match_kind: "trigger" };
      }
    }
    // 3) Title/description ILIKE
    for (const tok of tokens) {
      const hit = pool.find((c) =>
        normalizeTxt(c.title).includes(tok) ||
        normalizeTxt(c.description ?? "").includes(tok),
      );
      if (hit) return { ...hit, match_kind: "ilike" };
    }
    // 4) Fallback: Embedding über Edge-Function (selten erreicht → kein Hotspot)
    const { data } = await admin.functions.invoke("clara-media-resolve", {
      body: { topic, category: category ?? null },
    });
    if (data && (data as { ok?: boolean }).ok) return (data as { match: unknown }).match;
    return null;
  } catch (e) {
    console.warn("resolveMedia exception:", e);
    return null;
  }
}

function normalizeForRouting(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "boolean") return value;
  return String(value ?? "").trim().length > 0;
}

function ensureFinalSubmit(name: string, args: Record<string, unknown>, fields: string[]) {
  const missing = fields.filter((field) => !hasValue(args[field]));
  if (args.confirmation_received !== true) missing.push("confirmation_received");
  if (missing.length > 0) {
    throw new Error(
      `${name}: Vor dem Senden fehlen oder bestaetigt der Gast noch: ${missing.join(", ")}. Frage kurz nach und sende erst nach ausdruecklicher Bestaetigung.`,
    );
  }
}

function isExplicitSendConfirmation(text: string): boolean {
  const normalized = normalizeForRouting(text);
  const saysYes = /\b(ja|passt|genau|richtig|bestaetige|bestatige|ok|okay|bitte)\b/.test(normalized);
  const wantsSend = /(absenden|senden|abschicken|weitergeben|anfrage|angebot|so machen|so aufnehmen|so an das hotelteam)/.test(normalized);
  return saysYes && wantsSend;
}

function buildConfirmedLeadSummary(fields: Record<string, unknown>): string {
  const lines = [
    fields.firma ? `Firma: ${String(fields.firma)}` : null,
    fields.name ? `Kontakt: ${String(fields.name)}` : null,
    fields.email ? `E-Mail: ${String(fields.email)}` : null,
    fields.telefon ? `Telefon: ${String(fields.telefon)}` : null,
    fields.anlass ? `Anlass: ${String(fields.anlass)}` : null,
    fields.personen ? `Personen: ${String(fields.personen)}` : null,
    fields.datum ? `Datum: ${String(fields.datum)}` : null,
    fields.dauer ? `Zeit: ${String(fields.dauer)}` : null,
    fields.verpflegung ? `Verpflegung: ${String(fields.verpflegung)}` : null,
    fields.technik ? `Technik: ${String(fields.technik)}` : null,
    fields.besonderheiten ? `Besonderheiten: ${String(fields.besonderheiten)}` : null,
  ].filter(Boolean);
  return lines.join(" · ");
}

function isGenericSupportReply(text: string): boolean {
  return /wobei darf ich sie|was darf ich sie|bei was kann ich sie|wie kann ich ihnen|kann ich sonst noch/i.test(text.trim());
}

function buildMemoryBlock(extracted: Record<string, unknown>): string {
  const keys = Object.keys(extracted).filter((key) => hasValue(extracted[key]));
  if (keys.length === 0) return "";
  return `\n\n— BISHER ERFASSTE GAST-/LEAD-DATEN DIESER SESSION —\n${JSON.stringify(extracted)}\nNutze diese Daten aktiv weiter. Frage niemals erneut nach Feldern, die hier bereits gefüllt sind; frage nur die nächste fehlende Pflichtinformation.`;
}

function buildToolAwareFallbackReply(
  latestUserMessage: string,
  toolCalls: Array<{ function: { name: string; arguments: string } }>,
  executedToolResults: Array<{ name: string; ok: boolean; data?: unknown; error?: string }>,
): string | null {
  const firstFailure = executedToolResults.find((result) => result.ok === false);
  if (firstFailure) {
    return `Ich brauche noch eine Kleinigkeit: ${firstFailure.error ?? "ein Pflichtfeld fehlt"}. Dann kann ich es sauber aufnehmen.`;
  }

  const successfulTransaction = toolCalls.find((call, index) => TRANSACTIONAL_TOOLS.has(call.function.name) && executedToolResults[index]?.ok);
  if (successfulTransaction) {
    return "Erledigt – ich habe alles im System gespeichert und an das zuständige Team weitergegeben.";
  }

  for (let i = 0; i < toolCalls.length; i++) {
    const call = toolCalls[i];
    const result = executedToolResults[i];
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* noop */ }

    if (call.function.name === "save_lead" && result?.ok) {
      const summary = buildConfirmedLeadSummary(args);
      const required = ["name", "email", "telefon", "firma", "anlass", "personen", "datum"];
      const missing = required.filter((field) => !hasValue(args[field]));
      if (summary && missing.length === 0) return `Ich habe alle Eckdaten notiert: ${summary}. Soll ich die Anfrage jetzt direkt ans Bankett-Team senden?`;
      if (summary) return `Ich habe die Eckdaten notiert: ${summary}. Für ein fertiges Angebot fehlt noch: ${missing.join(", ")}.`;
    }
  }

  for (let i = 0; i < toolCalls.length; i++) {
    const call = toolCalls[i];
    const result = executedToolResults[i];
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* noop */ }

    if (call.function.name === "recommend_room" && result?.ok) {
      const data = result.data as { primary?: { name?: string; area?: string; capacity?: number }; reason?: string } | undefined;
      const room = data?.primary?.name ?? "ein passender Raum";
      const reason = data?.reason ?? `${room} passt zu Ihrer Personenzahl.`;
      return `${reason} Für ein fertiges Angebot brauche ich noch Firma, Namen, E-Mail und Telefonnummer.`;
    }

    if (call.function.name === "show_menu" && result?.ok) {
      const data = result.data as { kind?: string; items?: unknown[] } | undefined;
      const kind = data?.kind ?? "restaurant_food";
      const hasItems = Array.isArray(data?.items) && data.items.length > 0;
      if (kind === "drinks") {
        return hasItems
          ? "Ich habe die Getränkekarte rechts geöffnet — darf ich Ihnen etwas an Ihren Platz bringen lassen?"
          : "Ich öffne die Bar- und Weinkarte für Sie. Was darf ich Ihnen bringen?";
      }
      if (kind === "spa") {
        return hasItems
          ? "Ich zeige Ihnen unsere Behandlungen rechts — soll ich gleich einen Termin für Sie reservieren?"
          : "Ich öffne unser Spa-Angebot. An welche Behandlung haben Sie gedacht?";
      }
      if (kind === "conference_menu") {
        return hasItems
          ? "Das heutige Tagungsmenü liegt rechts — soll ich es für Ihren Raum aufnehmen?"
          : "Für heute ist noch kein Tagungsmenü hinterlegt. Ich kann Ihre gewünschte Bestellung trotzdem aufnehmen: Was genau und wohin soll es geliefert werden?";
      }
      // restaurant_food
      return hasItems
        ? "Unsere Speisekarte liegt rechts geöffnet — sagen Sie mir gern, was Sie reizt, dann nehme ich es für Ihren Tisch auf."
        : "Ich öffne unsere Speisekarte. Schauen Sie kurz, was Sie ansprechend finden — ich nehme die Bestellung gleich für Sie auf.";
    }

    if (call.function.name === "ask_guest_context" && result?.ok) {
      const location = typeof args.location === "string" ? ` für ${args.location}` : "";
      return `Verstanden${location}. Was genau darf ich aufnehmen – mit Menge und eventuellen Sonderwünschen?`;
    }
  }

  if (/bestell|cola|wasser|kaffee|essen|trinken|men[uü]|schnitzel|fisch|fleisch|vegetar/i.test(latestUserMessage)) {
    return "Ich nehme die Bestellung auf. Bitte nennen Sie mir noch Menge, Lieferort und Ihren Namen – dann fasse ich alles zur Bestätigung zusammen.";
  }
  return null;
}

function berlinDateIso(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addBerlinDays(days: number): string {
  const today = berlinDateIso(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return berlinDateIso(noonUtc);
}

function normalizeServiceDate(value: unknown, latestUserMessage: string): string {
  const spoken = normalizeForRouting(`${latestUserMessage} ${value ?? ""}`);
  if (/uebermorgen|ubermorgen/.test(spoken)) return addBerlinDays(2);
  if (/\bmorgen\b/.test(spoken)) return addBerlinDays(1);
  if (/\bheute\b/.test(spoken)) return addBerlinDays(0);

  const candidate = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(candidate) && candidate >= addBerlinDays(0)) return candidate;
  return addBerlinDays(1);
}

function orderText(args: Record<string, unknown>): string {
  const items = Array.isArray(args.items) ? args.items : [];
  return normalizeForRouting([
    args.guest_type,
    args.guest_name,
    args.table_or_room,
    args.notes,
    ...items.map((item) => JSON.stringify(item)),
  ].join(" "));
}

function classifyRestaurantOrder(args: Record<string, unknown>): "bar_max" | "fine_dining" | "reservation" | "shop" {
  const text = orderText(args);
  if (/\b(reservier\w*|reservierung\w*|tisch\s*buchen|table\s*reservation)\b/.test(text)) return "reservation";
  if (/\b(shop|souvenir|gutschein|voucher|bademantel|handtuch\s*kaufen|produkt|mitnehmen)\b/.test(text)) return "shop";

  const barTerms = [
    "cola", "fanta", "sprite", "wasser", "saft", "schorle", "kaffee", "espresso", "cappuccino", "latte",
    "tee", "bier", "radler", "wein", "sekt", "champagner", "cocktail", "aperol", "hugo", "gin", "tonic",
    "whisky", "rum", "vodka", "bar", "lounge", "drink", "getrank", "getraenk", "snack",
  ];
  const foodTerms = [
    "schnitzel", "steak", "pasta", "salat", "suppe", "burger", "dessert", "menü", "menu", "gericht",
    "hauptgang", "vorspeise", "abendessen", "mittagessen", "restaurant", "maxwell", "fine dining",
  ];
  const hasBar = barTerms.some((term) => text.includes(term));
  const hasFood = foodTerms.some((term) => text.includes(term));
  return hasBar && !hasFood ? "bar_max" : "fine_dining";
}

function classifyComplaint(args: Record<string, unknown>): "room_issue" | "missing_item" | "complaint" {
  const text = normalizeForRouting([args.category, args.description, args.room_or_table].join(" "));
  if (/\b(handtuch|bademantel|seife|shampoo|duschgel|toilettenpapier|kissen|decke|fehlend|fehlt|nachliefern)\b/.test(text)) {
    return "missing_item";
  }
  if (/\b(zimmer|tv|fernseher|heizung|licht|klima|dusche|bad|wasser|schaden|defekt|kaputt|tur|tuer|fenster)\b/.test(text)) {
    return "room_issue";
  }
  return "complaint";
}

function normalizeUrgency(value: unknown): string {
  const text = normalizeForRouting(value);
  if (text.includes("sofort") || text.includes("dring") || text.includes("hoch")) return "high";
  if (text.includes("heute") || text.includes("mittel")) return "medium";
  return "normal";
}

function buildWellnessDescription(args: Record<string, unknown>): string {
  const parts = [
    args.treatment ? `Behandlung: ${String(args.treatment)}` : null,
    args.date ? `Datum: ${String(args.date)}` : null,
    args.time ? `Uhrzeit: ${String(args.time)}` : null,
    args.persons ? `Personen: ${String(args.persons)}` : null,
    args.contact ? `Kontakt: ${String(args.contact)}` : null,
    args.notes ? `Notizen: ${String(args.notes)}` : null,
    args.prepared_reply ? `Antwortentwurf: ${String(args.prepared_reply)}` : null,
  ];
  return parts.filter(Boolean).join(" · ") || "Wellness-/Beauty-Anfrage";
}

const TOUR_SECTIONS_INFO = `
- start (/) — Startseite mit Hero & Highlights.
- tagungsraeume (/tagungsraeume#tagungscenter) — 8 Konferenzräume bis 435 Personen.
- tagungscenter (/tagungsraeume#tagungscenter) — 5 Hauptraeume.
- art-center (/tagungsraeume#art-center) — 3 Element-Räume Feuer/Wasser/Holz.
- impressionen (/tagungsraeume#impressionen) — Bildergalerie.
- raum-bonn-berlin, raum-frankfurt, raum-berlin, raum-hamburg, raum-bonn — Hauptraeume (Daylight + Blackout).
- raum-feuer, raum-wasser, raum-holz — Art-Center Räume (nur Daylight).
- tagungspauschalen (/tagungspauschalen) — Tagespauschalen.
- ausstattung-technik (/ausstattung-technik) — Hybrid-Tagungstechnik.
- outdoor-aktiv (/outdoor-aktiv) — Outdoor-Teamevents.
- menue (/menue-bestellung) — Aktuelles Tagesmenü.
- anfrage (/anfrage) — Anfrageformular.
`.trim();

const TOUR_KEYS = [
  "start","tagungsraeume","tagungscenter","art-center","impressionen",
  "raum-bonn-berlin","raum-frankfurt","raum-berlin","raum-hamburg","raum-bonn",
  "raum-feuer","raum-wasser","raum-holz",
  "tagungspauschalen","ausstattung-technik","outdoor-aktiv","menue","anfrage",
];

const TOOLS = [
  {
    type: "function",
    function: {
      name: "show_section",
      description: "Zeigt eine Sektion der eigenen Webseite im Live-Frame und markiert sie. IMMER nutzen sobald ein Thema klar ist.",
      parameters: { type: "object", properties: { section: { type: "string", enum: TOUR_KEYS } }, required: ["section"] },
    },
  },
  {
    type: "function",
    function: {
      name: "show_room",
      description: "Hebt einen konkreten Tagungsraum im Live-Frame hervor (Klarname wie 'Bonn', 'Frankfurt', 'Feuer').",
      parameters: { type: "object", properties: { room_name: { type: "string" } }, required: ["room_name"] },
    },
  },
  {
    type: "function",
    function: {
      name: "recommend_room",
      description: "Empfiehlt den optimalen Raum basierend auf Personenzahl und optional Bestuhlung. IMMER nutzen sobald die Personenzahl bekannt ist! Markiert automatisch die Empfehlung im Live-Frame und liefert Begründung + Alternativen.",
      parameters: {
        type: "object",
        properties: {
          personen: { type: "number", description: "Anzahl Teilnehmer" },
          bestuhlung: { type: "string", enum: ["theater","parlament","u-form","block","bankett"], description: "Optionale Bestuhlung. Default: theater." },
          anlass: { type: "string", description: "Optionaler Anlass für Empfehlungslogik (z. B. Workshop, Bankett)." },
        },
        required: ["personen"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_lead",
      description: "Speichert die strukturierten Eckdaten. Sobald neue Infos eintreffen aufrufen.",
      parameters: { type: "object", properties: {
        anlass: { type: "string" }, personen: { type: "string" }, datum: { type: "string" }, dauer: { type: "string" },
        uebernachtung: { type: "string" }, verpflegung: { type: "string" }, technik: { type: "string" },
        firma: { type: "string" }, name: { type: "string" }, email: { type: "string" }, telefon: { type: "string" }, besonderheiten: { type: "string" },
      } },
    },
  },
  {
    type: "function",
    function: {
      name: "save_note",
      description: "Speichert eine kurze Freitext-Notiz aus dem Gespräch.",
      parameters: { type: "object", properties: { content: { type: "string" }, category: { type: "string" } }, required: ["content"] },
    },
  },
  {
    type: "function",
    function: {
      name: "send_inquiry",
      description: "Sendet die finale Tagungsanfrage. Nur wenn Anlass, Personen, Datum, Name und E-Mail bekannt sind UND der Gast bestätigt hat.",
      parameters: { type: "object", properties: {
        name: { type: "string" }, email: { type: "string" }, telefon: { type: "string" }, firma: { type: "string" },
        anlass: { type: "string" }, personen: { type: "string" }, datum: { type: "string" }, nachricht: { type: "string" },
        confirmation_received: { type: "boolean", description: "True nur wenn Clara die komplette Zusammenfassung vorgelesen hat und der Gast klar zugestimmt hat." },
        confirmed_summary: { type: "string", description: "Die vom Gast bestaetigte Kurz-Zusammenfassung." },
      }, required: ["name","email","telefon","firma","anlass","personen","datum","confirmation_received","confirmed_summary"] },
    },
  },
  {
    type: "function",
    function: {
      name: "show_media",
      description: "DEAKTIVIERT — NICHT MEHR AUFRUFEN. Bilder werden nicht mehr im Chat gezeigt. Nutze stattdessen 'navigate_to_section' oder 'show_heidehof_page', um den Gast direkt zur passenden Stelle auf der Webseite zu scrollen.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Was soll gezeigt werden? z. B. 'Raum Frankfurt', 'Spa Pool', 'Bankett Hochzeit'." },
          category: { type: "string", description: "Optional: Kategorie eingrenzen (raum, spa, restaurant, outdoor, bankett, zimmer, lage, general)." },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_gallery",
      description: "DEAKTIVIERT — NICHT MEHR AUFRUFEN. Galerien werden nicht mehr im Chat gezeigt. Nutze stattdessen 'navigate_to_section', um den Gast direkt zur entsprechenden Sektion auf der Webseite zu scrollen.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Kategorie: zimmer, spa, pool, restaurant, bankett, raum, outdoor, beauty." },
          topic: { type: "string", description: "Optionaler Suchbegriff zum Eingrenzen innerhalb der Kategorie." },
          limit: { type: "number", description: "Maximale Anzahl Bilder (Standard 6, max. 12)." },
        },
        required: ["category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_heidehof_page",
      description: "Öffnet eine konkrete Heidehof-Seite (https://www.der-heidehof.de/...) im Live-Overlay. Nutze fullscreen=true für maximale Detailansicht (Karte, Pauschalen, Wellness-Anwendungen, Zimmer-Beschreibungen etc.). Nur Hosts der-heidehof.de oder hotel-dream-guide.lovable.app erlaubt.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Volle https-URL auf der-heidehof.de oder hotel-dream-guide.lovable.app." },
          titel: { type: "string", description: "Kurzer Banner-Titel für das Overlay." },
          fullscreen: { type: "boolean", description: "True = direkt Vollbild öffnen (für Detailseiten). Default false." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_to_section",
      description: "Öffnet eine Heidehof-Standard-Sektion per Schlüsselwort im Live-Overlay (Tagungsräume, Spa, Bankett etc.).",
      parameters: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: ["tagungsraeume","tagungsangebote","outdoor","bankett","spa","wasserwelt","fitness","beauty","zimmer","angebote","restaurant","lage","kontakt","anfrage","aktiv"],
          },
        },
        required: ["section"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "focus_form_field",
      description: "Fokussiert und markiert ein Formularfeld oder CTA auf der aktuellen/interne Route. Nutzen, wenn du den Gast visuell durch einen nächsten Formularschritt führen willst.",
      parameters: {
        type: "object",
        properties: {
          target: { type: "string", description: "Feld-ID, name, aria-label oder Platzhalter, z. B. 'email', 'telefon', 'personen', 'datum'." },
          route: { type: "string", description: "Optional interne Route, z. B. '/anfrage'." },
        },
        required: ["target"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_conference_order",
      description:
        "Erstellt eine Tagungs-Bestellung für die Küche. Nutze SOFORT, sobald Raum, Datum, Mahlzeit (Mittag/Abend) und Personen klar sind. Gerichte (fish/meat/vegetarian) optional als Mengen aufteilen. Beispiel-Aufruf für '8 Schnitzel & 2 vegetarisch in Raum Berlin morgen 12 Uhr': room_name='Berlin', service_date='2026-05-13', meal_type='lunch', participants=10, items=[{dish_type:'meat',quantity:8},{dish_type:'vegetarian',quantity:2}].",
      parameters: {
        type: "object",
        properties: {
          room_name: { type: "string", description: "Klarname des Tagungsraums (z.B. 'Berlin', 'Frankfurt')." },
          service_date: { type: "string", description: "Datum im Format YYYY-MM-DD." },
          meal_type: { type: "string", enum: ["lunch", "dinner"], description: "Mittag- oder Abendessen." },
          participants: { type: "number", description: "Gesamtanzahl Personen." },
          guest_name: { type: "string", description: "Name des Bestellers / Ansprechpartners." },
          company: { type: "string" },
          email: { type: "string" },
          notes: { type: "string", description: "Sonderwünsche / Allergien." },
          confirmation_received: { type: "boolean", description: "True nur nach finaler Zusammenfassung und ausdruecklicher Gast-Bestaetigung." },
          confirmed_summary: { type: "string", description: "Bestaetigte Zusammenfassung fuer Kueche/Service." },
          items: {
            type: "array",
            description: "Optionale Gericht-Aufteilung. Course default 'main'.",
            items: {
              type: "object",
              properties: {
                course: { type: "string", enum: ["appetizer", "main", "dessert"] },
                dish_type: { type: "string", enum: ["fish", "meat", "vegetarian"] },
                quantity: { type: "number" },
              },
              required: ["dish_type", "quantity"],
            },
          },
        },
        required: ["room_name", "service_date", "meal_type", "participants", "guest_name", "confirmation_received", "confirmed_summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order_status",
      description: "Service-Modus: Aktualisiert den Status der neuesten Bestellung in einem Raum (z.B. 'Tisch 5 ist fertig' → status='served').",
      parameters: {
        type: "object",
        properties: {
          room_name: { type: "string" },
          service_date: { type: "string", description: "YYYY-MM-DD, default heute." },
          meal_type: { type: "string", enum: ["lunch", "dinner"] },
          status: { type: "string", description: "Neuer Status (z.B. 'in_progress', 'served', 'done')." },
        },
        required: ["room_name", "status"],
      },
    },
  },
  // ─── Concierge-Tools (NEU) ───
  {
    type: "function",
    function: {
      name: "ask_guest_context",
      description: "Speichert Gast-Typ (tagung|hotel|tages|wellness) und optional Sitzplatz/Zimmer/Raum für den Rest des Gesprächs. Sofort beim Erstkontakt nutzen, sobald der Gast antwortet wer er ist.",
      parameters: {
        type: "object",
        properties: {
          guest_type: { type: "string", enum: ["tagung","hotel","tages","wellness","unknown"] },
          location: { type: "string", description: "Tagungsraum-Name, Tischnummer oder Zimmernummer." },
          guest_name: { type: "string" },
        },
        required: ["guest_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_menu",
      description: "Öffnet die passende Karte im Live-Panel rechts und scrollt zur richtigen Seite. WICHTIG — wähle 'kind' korrekt: restaurant_food = Restaurant-Speisekarte (Vor-/Hauptspeisen/Dessert für ALLE Gäste, /speisekarte) · drinks = Bar & Weinkarte (/getraenkekarte) · spa = Wellness-Behandlungen (/spa) · conference_menu = NUR Tagungs-Tagesmenü für Tagungsgäste (/menue-bestellung). 'meal_type' und 'date' gelten NUR für conference_menu. 'filter' = freies Stichwort (z. B. 'fleisch', 'vegan', 'rotwein', 'massage').",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["restaurant_food","drinks","spa","conference_menu"], description: "Pflicht. Welche Karte." },
          filter: { type: "string", description: "Optional: Stichwort zum Filtern (Kategorie, Tag, Suchbegriff)." },
          meal_type: { type: "string", enum: ["lunch","dinner"], description: "Nur für conference_menu." },
          date: { type: "string", description: "Nur für conference_menu, YYYY-MM-DD. Default heute." },
        },
        required: ["kind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "take_restaurant_order",
      description: "Nimmt eine Bestellung im Restaurant oder an der Bar auf. Das Backend sortiert automatisch in Fine Dining oder Bar Mäx ein. items als Array {name, quantity, notes?}.",
      parameters: {
        type: "object",
        properties: {
          guest_type: { type: "string", enum: ["tagung","hotel","tages","wellness","unknown"] },
          guest_name: { type: "string" },
          table_or_room: { type: "string", description: "Tischnummer ODER Tagungsraum+Schlüsselnummer ODER Zimmernummer. Pflicht: ohne Lieferort keine Bestellung." },
          items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "number" }, notes: { type: "string" } }, required: ["name","quantity"] } },
          notes: { type: "string", description: "Allergien/Sonderwünsche/Lieferhinweise. Wenn keine vorhanden sind: 'Keine'." },
          prepared_reply: { type: "string", description: "Sendefertige Antwort an den Gast (2–4 Sätze, deutsch, Sie-Form), die das Hotelteam direkt verschicken kann. Bestätige Items, Lieferort und nenne den nächsten Schritt (z. B. 'kommt in 15 Minuten')." },
          confirmation_received: { type: "boolean", description: "True nur nachdem Clara alles zusammengefasst und der Gast zugestimmt hat." },
          confirmed_summary: { type: "string", description: "Bestaetigte Kurz-Zusammenfassung der Bestellung." },
        },
        required: ["items","table_or_room","prepared_reply","confirmation_received","confirmed_summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "make_table_reservation",
      description: "Erfasst eine professionelle Tischreservierung für Fine Dining / Restaurant Maxwell. Nutze dieses Tool statt take_restaurant_order, sobald der Gast einen Tisch reservieren möchte.",
      parameters: {
        type: "object",
        properties: {
          guest_name: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD oder Freitext, falls der Gast es so nennt." },
          time: { type: "string", description: "HH:MM oder Freitext." },
          persons: { type: "number" },
          contact: { type: "string", description: "Telefon, E-Mail oder Zimmernummer." },
          notes: { type: "string", description: "Allergien/Sonderwünsche/Lieferhinweise. Wenn keine vorhanden sind: 'Keine'." },
          prepared_reply: { type: "string", description: "Sendefertige Reservierungs-Bestätigung an den Gast (2–4 Sätze, Sie-Form). Nennt Datum, Uhrzeit, Personenzahl und einen herzlichen Abschluss." },
          confirmation_received: { type: "boolean", description: "True nur nach finaler Zusammenfassung und Gast-Bestaetigung." },
          confirmed_summary: { type: "string", description: "Bestaetigte Reservierungsdaten." },
        },
        required: ["guest_name", "date", "time", "persons", "contact", "notes", "prepared_reply", "confirmation_received", "confirmed_summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "take_room_order",
      description: "Nimmt eine Zimmerservice-Bestellung auf.",
      parameters: {
        type: "object",
        properties: {
          room_number: { type: "string", description: "Zimmernummer (101–120, 201–220, 301–315). Pflicht — niemals ohne Zimmernummer auslösen." },
          guest_name: { type: "string" },
          items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "number" }, notes: { type: "string" } }, required: ["name","quantity"] } },
          notes: { type: "string", description: "Sonderwünsche oder Zusatzinfos. Wenn keine vorhanden sind: 'Keine'." },
          prepared_reply: { type: "string", description: "Sendefertige Bestätigung an den Gast (2–4 Sätze, Sie-Form). Inkl. 5 € Zimmerservice-Aufpreis, geschätzte Lieferzeit, Items, Zimmernummer." },
          confirmation_received: { type: "boolean", description: "True nur nach finaler Zusammenfassung und Gast-Bestaetigung." },
          confirmed_summary: { type: "string", description: "Bestaetigte Kurz-Zusammenfassung der Zimmerservice-Bestellung." },
        },
        required: ["room_number","items","prepared_reply","confirmation_received","confirmed_summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "take_shop_order",
      description: "Erfasst eine Hotel-Shop- oder Souvenir-Bestellung. Sie erscheint im Admin-Bereich unter Shop-Bestellungen.",
      parameters: {
        type: "object",
        properties: {
          guest_name: { type: "string" },
          guest_type: { type: "string", enum: ["tagung","hotel","tages","wellness","unknown"] },
          contact: { type: "string", description: "Zimmernummer, Telefon oder E-Mail." },
          items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "number" }, notes: { type: "string" } }, required: ["name","quantity"] } },
          notes: { type: "string", description: "Sonderwünsche oder Zusatzinfos. Wenn keine vorhanden sind: 'Keine'." },
          prepared_reply: { type: "string", description: "Sendefertige Bestätigung (2–4 Sätze, Sie-Form) mit Items und Abholung-/Lieferinfo." },
          confirmation_received: { type: "boolean", description: "True nur nach finaler Zusammenfassung und Gast-Bestaetigung." },
          confirmed_summary: { type: "string", description: "Bestaetigte Kurz-Zusammenfassung der Shop-Bestellung." },
        },
        required: ["contact","items","prepared_reply","confirmation_received","confirmed_summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_wellness_appointment",
      description: "Wellness-/Spa-/Beauty-Terminwunsch erfassen.",
      parameters: {
        type: "object",
        properties: {
          treatment: { type: "string", description: "z.B. Massage, Gesichtsbehandlung, Maniküre." },
          date: { type: "string", description: "YYYY-MM-DD." },
          time: { type: "string", description: "HH:MM." },
          persons: { type: "number", description: "Anzahl Personen fuer den Termin." },
          guest_name: { type: "string" },
          contact: { type: "string", description: "Zimmernummer, Telefon oder Email." },
          notes: { type: "string", description: "Sonderwuensche. Wenn keine vorhanden sind: 'Keine'." },
          prepared_reply: { type: "string", description: "Sendefertige Terminantwort fuer das Hotelteam (2-4 Saetze, Sie-Form)." },
          confirmation_received: { type: "boolean", description: "True nur nach finaler Zusammenfassung und Gast-Bestaetigung." },
          confirmed_summary: { type: "string", description: "Bestaetigte Kurz-Zusammenfassung des Terminwunsches." },
        },
        required: ["treatment","date","time","persons","guest_name","contact","notes","prepared_reply","confirmation_received","confirmed_summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_complaint",
      description: "Beschwerde aufnehmen. category: zimmer|service|essen|sauberkeit|sonstiges. urgency: sofort|heute|normal.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["zimmer","service","essen","sauberkeit","sonstiges"] },
          urgency: { type: "string", enum: ["sofort","heute","normal"] },
          description: { type: "string" },
          guest_name: { type: "string" },
          contact: { type: "string" },
          guest_type: { type: "string" },
          room_or_table: { type: "string" },
          desired_solution: { type: "string", description: "Was der Gast als Loesung wuenscht, z. B. Techniker, Ersatz, Rueckruf, Reinigung." },
          confirmation_received: { type: "boolean", description: "True nur nach finaler Zusammenfassung und Gast-Bestaetigung." },
          confirmed_summary: { type: "string", description: "Bestaetigte Kurz-Zusammenfassung der Beschwerde." },
        },
        required: ["category","urgency","description","guest_name","contact","room_or_table","desired_solution","confirmation_received","confirmed_summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "handoff_to_inquiry",
      description: "Übergibt das Gespräch an die /anfrage-Seite mit dem Tagungs-Sprachassistenten. SOFORT NUTZEN, sobald der Gast konkret eine Tagungsanfrage / Veranstaltungsbuchung / Bankett-Anfrage absenden möchte (z. B. 'Ich möchte anfragen', 'Bitte ein Angebot', 'Können wir das verbindlich machen'). Übergibt den bisherigen Kontext, damit der Sprach-Concierge dort sofort weiß, worum es geht.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Kurzes Thema, z. B. 'Tagung 25 Personen Workshop' oder 'Familienfeier Bankett'." },
          room: { type: "string", description: "Empfohlener / gewünschter Raum-Name (optional)." },
          details: { type: "array", items: { type: "string" }, description: "Stichpunkte: Personen, Datum, Bestuhlung, Pauschale, Sonderwünsche." },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsell_suggest",
      description: "Macht einen kontextpassenden, dezenten Upselling-Vorschlag (z. B. Wein zum Steak, Snack zum Drink, Late-Check-out zum Wellness-Tag). NUR aufrufen, wenn es für den Gast logisch sinnvoll ist. Der Vorschlag wird im UI als Chip eingeblendet, damit der Gast tippen oder zustimmen kann.",
      parameters: {
        type: "object",
        properties: {
          base_item: { type: "string", description: "Worauf sich der Upsell bezieht (z. B. 'Cola', 'Wiener Schnitzel', 'Massage 60 Min')." },
          suggestion: { type: "string", description: "Konkreter Vorschlag, kurz formuliert (z. B. 'Pommes dazu?', 'Glas Riesling?', 'Late-Check-out 14 Uhr?')." },
          reason: { type: "string", description: "1-Halbsatz Begründung, warum es passt (optional)." },
          category: { type: "string", enum: ["drink","food","wellness","room","event","general"], description: "Domäne des Upsells." },
        },
        required: ["base_item","suggestion"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "end_conversation",
      description: "Beendet das Gespräch sauber, sobald sich der Gast verabschiedet ('Tschüss', 'Auf Wiedersehen', 'Danke das war alles', 'Mehr brauche ich nicht'). Antworte VORHER kurz mit einer warmen Verabschiedung (1 Satz). Das Mikrofon wird danach automatisch ausgeschaltet.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Optional: 'farewell' | 'completed' | 'inactive'." },
        },
      },
    },
  },
];

async function resolveRoomId(roomName: string): Promise<string | null> {
  const { data } = await admin.from("conference_rooms").select("id,name").eq("is_active", true);
  if (!data) return null;
  const norm = roomName.toLowerCase().trim();
  const exact = data.find((r) => r.name.toLowerCase() === norm);
  if (exact) return exact.id;
  const partial = data.find((r) => r.name.toLowerCase().includes(norm) || norm.includes(r.name.toLowerCase()));
  return partial?.id ?? null;
}

function buildSystemPrompt(rag: string, profile: { name?: string; subtitle?: string }, _persona: string, isVoice = false) {
  const name = profile.name || "Clara";
  /*
  `Du bist ${name}, die intelligente Voice-Concierge von Hotel Der Heidehof Conference & Spa Resort in Gaimersheim/Ingolstadt. Du arbeitest wie eine erfahrene Hotelmitarbeiterin: warm, souverän, vorausschauend, in Sie-Form (Deutsch).

DEIN AUFTRAG: Du kannst ALLES, was ein Hotelgast auf der Webseite braucht: Tagungsanfragen, Angebote, Raumempfehlungen, Essen/Getränke-Bestellungen, Zimmerservice, Tischreservierungen, Beauty-/Wellness-Termine, Shop-Bestellungen, Zimmerbuchungen, Beschwerden und fehlende Artikel. Du führst jedes Anliegen zielgerichtet bis zu einem verwertbaren Ergebnis und sendest strukturierte Daten über die passenden Tools ins Admin-Dashboard.

PROAKTIVE WEBSITE-AWARENESS:
- Du erhältst Kontext zur aktuellen Seite/Sektion, wenn ein Gast länger dort bleibt oder einen Clara-Button gedrückt hat.
- Nutze diesen Kontext sofort. Beispiel: "Sie schauen sich gerade die Getränkekarte an — möchten Sie etwas bestellen?"
- Wenn der Gast ablehnt oder fertig ist, verabschiede dich kurz und rufe end_conversation auf.
- Wenn der Gast allgemein spricht ("ich würde was trinken", "ich brauche einen Raum", "ich will Wellness"), erkenne die Absicht und starte sofort den passenden Slot-Flow.

SO ARBEITEST DU (PROFESSIONELL & SOFORT):
- Reagiere auf die erste Nachricht ohne erneute Begrüßung direkt mit der ersten relevanten Frage.
- Eine einzige Frage pro Antwort, maximal zwei kurze Sätze. Sprich wie ein Mensch am Telefon.
- Der Gast kann jederzeit sprechen ODER tippen – beides ist gleichwertig, weise bei Bedarf dezent darauf hin.
- Spiegele jede Antwort kurz ("Verstanden, 30 Personen.") und gehe dann zur nächsten Frage.

INTENT-FLOWS (PFLICHT, nichts überspringen):
- Getränk/Essen: Artikel + Menge → Ort/Lieferort → Gastart/Name → Zimmer/Tisch/Raum/Pool/Spa-Liege → Sonderwünsche/Allergien → kurze Zusammenfassung → take_restaurant_order oder take_room_order.
- Vage Getränkeabsicht ("ich würde was trinken"): frage zuerst nach Getränkewunsch oder Kategorie, dann führe obigen Flow.
- Wellness/Beauty: Behandlung → Datum/Uhrzeit → Personen → Zimmer/Kontakt → Sonderwünsche → request_wellness_appointment.
- Tagung/Event/Angebot: Anlass → Personen → Datum/Zeit → Raum/Bestuhlung → Verpflegung/Technik → Firma/Name/E-Mail/Telefon → Zusammenfassung → send_inquiry.
- Beschwerde/Problem: Ort/Zimmer/Tisch → Problem genau → Dringlichkeit → Kontakt → gewünschte Lösung → submit_complaint.
- Fehlende Artikel: Artikel → Zimmer/Ort → Dringlichkeit → Name/Kontakt → submit_complaint.
- Tischreservierung: Datum → Uhrzeit → Personen → Name → Telefon/Kontakt → Sonderwünsche → make_table_reservation.

VISUELLE BERATUNG (Showroom über dem Chat – PROAKTIV nutzen!):
Über dem Gespräch siehst du eine Live-Bildfläche. Zeige dort sofort, worüber ihr sprecht:
- Personenzahl bekannt → recommend_room → blendet den passenden Raum automatisch mit Bild ein.
- Konkreter Raum genannt ("Frankfurt", "Bonn/Berlin") → show_room(room_name) + show_media(topic: "Raum [Name]", category: "raum").
- "Zeigen Sie mir die Räume" / Plural → show_gallery(category: "raum").
- Pauschalen/Technik/Outdoor zum Ansehen → show_section bzw. show_media zum Thema.
Sage dabei knapp: "Ich zeige es Ihnen direkt oben."

TAGUNGSBERATUNG – der Reihe nach, 1 Frage pro Turn (überspringe bereits Genanntes):
1. Anlass (Tagung, Seminar, Workshop, Konferenz, Bankett, Hochzeit, Feier)
2. Teilnehmerzahl
3. Datum & Zeitraum (Wunschtermin + mögliche Ausweichtermine)
4. Dauer (Halbtag / Ganztag / mehrtägig, mit Uhrzeiten)
5. Bestuhlung (Theater / Parlament / U-Form / Block / Bankett)
6. Übernachtung (Zimmeranzahl, EZ/DZ, An- & Abreise)
7. Verpflegung (Kaffeepausen, Mittag, Abend, Diäten/Allergien)
8. Technik (Beamer, Mikrofone, Hybrid-Streaming, WLAN)
9. Rahmenprogramm (Outdoor-Teamevent, SPA-Session, Incentive)
10. Kontakt (Anrede, Vor- & Nachname, Firma, E-Mail, Telefon)

RAUMEMPFEHLUNG (dein Kernkönnen):
- Sobald die Personenzahl bekannt ist → recommend_room aufrufen und den Vorschlag mit kurzer, persönlicher Begründung nennen.
- Biete bei Bedarf genau eine Alternative an und zeige sie ebenfalls.
- Nenne nur Räume und Kapazitäten aus den Fakten – nichts erfinden.

PROAKTIVES CROSS-SELLING (dezent, nach der Raumempfehlung – immer mind. EIN Vorschlag):
- "Möchten Sie die Premium-All-Inclusive-Pauschale ab 199 € p. P. inkl. Spa-Nutzung?"
- "Soll ich nach dem Workshop ein Outdoor-Teamevent im Altmühltal einplanen?"
- "Als Incentive fürs Team: Spa-Session oder ein Abendessen im Fine-Dining?"
- Bei Bankett/Hochzeit: "Wünschen Sie Sektempfang, Menü- oder Buffet-Vorschlag und Braut-Suite?"

EINWANDBEHANDLUNG (souverän, nie drängen):
- "Ich überlege es mir" → "Sehr gern. Soll ich Ihnen die Eckdaten unverbindlich als Angebot zusammenstellen, dann haben Sie alles schwarz auf weiß?"
- "Zu teuer" → kurz den Inklusiv-Wert der Pauschale betonen, nichts erfinden.
- "Andere Termine?" → Ausweichtermine erfassen und mitsenden.

ABSCHLUSS:
- Pflichtdaten (Anlass, Personen, Datum, Name, E-Mail oder Telefon) vollständig?
→ Kompakt zusammenfassen → "Soll ich die Anfrage jetzt direkt an unser Bankett-Team senden?"
→ Bei Bestätigung → send_inquiry mit ALLEN erfassten Feldern aufrufen.
→ Danach warm bestätigen: "Erledigt – unser Bankett-Team meldet sich zeitnah persönlich bei Ihnen."

DATENERFASSUNG (immer parallel, lautlos):
- Jede neue Info → SOFORT save_lead aufrufen.
- Sonderwünsche/Notizen → save_note.

STIL:
- Kurz, natürlich, maximal zwei Sätze, eine Frage pro Turn.
- Kein Markdown, keine Aufzählungen im gesprochenen Text, keine Preise erfinden.
- Begrüßung nicht wiederholen. Bei Sonderwünschen: "Das stimmen wir gerne individuell ab."

FAKTEN (verbindlich):
${rag}`;
  */

  const textModeInstructions = `
STIL (TEXT-MODUS) — KOMPROMISSLOS:
- Antworte in **maximal 2 kurzen, eleganten Sätzen** (zusammen ≤ 35 Wörter). Niemals Wissensbasis, Karten oder Beschreibungstexte vorlesen, zitieren oder zusammenfassen — Clara ist kein Papagei, sondern eine fünf-Sterne-Verkaufsberaterin.
- Übersetze Wissen in einen **persönlichen, verkaufsstarken Nutzen-Satz**, z.B. nicht "Bar Mäx hat Cocktails von 17–01 Uhr", sondern "Ein Aperol passt jetzt perfekt — soll ich Ihnen einen ans Zimmer schicken?".
- Frage am Ende immer nach der nächsten fehlenden Information für die Buchung/Bestellung (z. B. das Wunschdatum), statt die Unterhaltung mit "Was kann ich noch für Sie tun?" vorzeitig abzuwürgen.
- **EINE** präzise Folgefrage pro Turn, die das Gespräch näher an Abschluss, Buchung, Reservierung oder Lead bringt. Nie zwei Fragen, nie offene Floskeln.
- **Keine leeren Begrüßungsfloskeln**. "Gerne", "Sehr gerne" oder "Natürlich" nur wenn es menschlich klingt und direkt zum nächsten Schritt führt. Direkt zur Sache, warm aber souverän.
- Listen/Tabellen nur, wenn der Gast explizit eine Übersicht verlangt — sonst Fließtext, Sie-Form.
- **Upselling intelligent, nicht aufdringlich**: Wein zum Menü, Day-Spa zum Massagetermin, Sektempfang zur Tagung, Late-Check-out zum Wellness-Tag — nur wenn es logisch passt, in einer halben Zeile.
- **Lead-Gen statt Smalltalk**: Sobald Interesse erkennbar ist (Tagung, Event, längerer Aufenthalt, Wellness-Tag), zielgerichtet auf Name + E-Mail + Firma/Anlass führen — ohne Verhör-Ton.
`;

  const voiceModeInstructions = `
STIL (SPRACH-MODUS):
- Maximal 2 kurze Sätze (zusammen max. 25 Wörter), natürlich gesprochen, keine Markdown-Zeichen.
- Niemals Wissensbasis vorlesen — sprich wie eine erfahrene Concierge am Telefon: persönlich, verkaufend, mitdenkend.
- Preise mit "€"-Symbol schreiben (z. B. "5 €"), nie "Euro" ausschreiben.
- Frage am Ende immer nach der nächsten fehlenden Information für die Buchung/Bestellung (z. B. das Wunschdatum), statt die Unterhaltung mit "Was kann ich noch für Sie tun?" vorzeitig abzuwürgen.
- Kurzes, eingebettetes Upselling, wenn sinnvoll (1 Halbsatz: "…ein Glas Champagner dazu?").
`;

  const promptStyle = isVoice ? voiceModeInstructions : textModeInstructions;

  const personalityInstructions = `
CLARA-PERSÖNLICHKEIT (CHARMANT, ABER HOTEL-PROFESSIONELL):
- Du klingst, als würdest du beim Sprechen leicht lächeln: warm, aufmerksam, sympathisch und souverän.
- Ein sehr dezentes, kleines Lachen ist erlaubt, wenn es natürlich passt, z. B. bei einem lockeren Gästemoment. Schreibe niemals "haha"; formuliere charmant: "Das klingt nach einem sehr guten Plan."
- Du darfst fein schlagfertig sein, aber nie frech, albern, überdreht oder auf Kosten des Gastes.
- Dein Charme ist kurz und serviceorientiert: erst eine warme Reaktion, dann sofort die nächste sinnvolle Frage.
- Bei Beschwerden, Krankheit, Lärm, Schaden, verlorenen Dingen, Business-Entscheidungen oder Kostenfragen bist du besonders ruhig, empathisch und klar.
- Du wirkst nicht wie ein Bot und nicht wie ein Verkäufer, sondern wie eine aufmerksame Heidehof-Gastgeberin mit Charakter.
`;

  const roleDescription = `Du bist ${name}, die persönliche Concierge von Hotel Der Heidehof in Gaimersheim/Ingolstadt. Sprich warm, professionell, weiblich und in der Sie-Form (Deutsch).

Deine Zuständigkeit umfasst ALLES:
• Tagungen & Bankette: Konferenzräume, Eventpauschalen, Raumbuchungen, Angebote, Bestuhlung
• Essen & Getränke: Restaurant Maxwell, Bar Mäx, Speise- und Getränkekarte, Zimmerservice
• Wellness & Spa: Sauna, Pool, Massagen, Beauty- & Kosmetikanwendungen
• Hotel: Zimmerbuchungen (Privatgäste), Outdoor-Aktivitäten, Reklamationen, allgemeine Hotelfragen

Du leitest den Gast NIEMALS an einen anderen Assistenten weiter. Du erledigst alles selbst.

ESSEN- & GETRÄNKEBESTELLUNGEN:
Bearbeite Bestellungen DIREKT mit 'take_restaurant_order' (oder 'take_room_order' aufs Zimmer). Getränke/Bar-Snacks → "Bar Mäx"; Restaurantgerichte → "Fine Dining". Rufe 'handoff_to_inquiry' NUR auf wenn der Gast explizit eine verbindliche Tagungsanfrage absenden will.
- Vor der Bestellung genau einmal nach Sonderwünschen/Allergien fragen. Wenn keine: notes='Keine'.
- Zimmerservice: proaktiv 5,00 € Aufpreis nennen.
- Tischreservierungen: 'make_table_reservation'.
- Öffnungszeiten: Frühstück 07:00–10:30 · Restaurant Maxwell 18:00–22:00 · Bar Mäx 17:00–01:00.

ZIMMERBUCHUNG:
Zimmer buchen → 'show_heidehof_page(url: "https://onepagebooking.com/parkhotelheidehof", titel: "Zimmer buchen", fullscreen: true)'.`;

  return `${roleDescription}

${promptStyle}

${personalityInstructions}

LOGISCHE PRÜFUNG, PROAKTIVE FÜHRUNG & VERIFIKATION (SEHR WICHTIG!):
- Denke bei jedem Turn logisch und vorausschauend mit. Führe das Gespräch immer proaktiv bis zum gewünschten Ziel des Gastes (z. B. ein konkretes Angebot bei Clara, eine Tischreservierung, Zimmerbuchung, Wellness-Termin oder Essensbestellung bei Max).
- Warte nicht passiv auf Eingaben. Wenn der Gast z. B. eine Speise (z. B. Wiener Schnitzel) oder ein Getränk erwähnt, frage proaktiv, ob Sie es direkt servieren oder bestellen dürfen und kläre den Lieferort (Zimmer, Restaurant, Pool etc.) und Details ab.
- Wenn der Gast einen Tagungsraum oder eine Pauschale anfragt, frage proaktiv nach der Personenzahl, dem Wunschtermin, dem Bestuhlungsformat und führe die logische Prüfung der Raumkapazität direkt durch. Biete danach sofort die Erstellung eines Angebots an und sammle proaktiv die benötigten Lead-Daten (Name, E-Mail, Firma).
- DURCHHALTUNG & FLUSS-FÜHRUNG: Sobald der Gast Interesse an einer Leistung (z. B. Tagung für 10 Personen, Zimmerservice, Wellness) äußert, darfst du das Gespräch NIEMALS mit Abschlussfloskeln wie "Was kann ich noch für Sie tun?" abwürgen, bevor die Daten komplett sind. Frage stattdessen direkt nach dem nächsten logischen Pflichtfeld im Ablauf (z. B. Wunschdatum, Firma, Name, E-Mail), um den Lead oder die Bestellung erfolgreich abzuschließen.
- Beschwerden professionell aufnehmen: ruhig spiegeln, dann Ort/Zimmer/Tisch, Dringlichkeit, genaue Beschreibung, Kontakt und gewünschte Lösung klären. Danach submit_complaint aufrufen. Bei Gefahr, Ausfall, Schaden oder stark verärgertem Gast urgency='sofort' setzen.
- Zimmernummern: Wenn der Gast eine Zimmernummer nennt, überprüfe sie SOFORT logisch gegen die gültigen Bereiche aus der Wissensdatenbank:
  • 101 bis 120
  • 201 bis 220
  • 301 bis 315
  Falls die genannte Zimmernummer außerhalb dieser Bereiche liegt (z. B. Zimmer 405 oder Zimmer 99), weise den Gast freundlich darauf hin, dass diese Zimmernummer bei uns im Heidehof nicht existiert, nenne die korrekten Bereiche und frage nach der korrekten Zimmernummer.
- Spa-Schlüssel / Spa-Keys: Wenn der Gast einen Spa-Schlüssel nennt, überprüfe ihn logisch gegen die gültigen Bereiche aus der Wissensdatenbank:
  • 600 bis 650
  • 651 bis 682
  • Einzelne gültige Schlüssel: 665, 672, 680, 681, 682, 684
  Falls der genannte Spa-Schlüssel außerhalb dieser Werte liegt (z. B. Key 690), weise den Gast darauf hin und frage nach der Nummer.

ERÖFFNUNG (KONTEXT-SENSITIV — NICHT JEDES MAL NEU BEGRÜSSEN):
- WENN bereits eine Konversation existiert (du siehst frühere Nachrichten im Verlauf): **NICHT erneut begrüßen**, NICHT "Herzlich willkommen" wiederholen. Steige direkt höflich in das neue Thema ein, das der Gast gerade angetippt hat ("Sehr gern — zum [Thema]: ..."). Behandle es als Fortsetzung des laufenden Gesprächs.
- NUR bei der allerersten Nachricht (leerer Verlauf): kurze warme Begrüßung + offene Frage:
  • Max: "Guten Tag und herzlich willkommen — ich bin ${name}, Ihr persönlicher Concierge. Wie darf ich Ihnen heute helfen?"
  • Clara: "Herzlich willkommen — ich bin ${name}, Ihre persönliche Heidehof-Concierge. Worum darf ich mich gerade kümmern?"
- Wenn der Gast über einen Button mit Kontext (Raum, Gericht, Treatment, Pauschale) einsteigt: höflich auf genau dieses Thema eingehen ("Schön — Sie schauen sich [Topic] an. Darf ich Ihnen dazu …?") und sofort zu dem Bereich auf der Webseite scrollen (siehe SCROLLEN STATT BILDER).
- **Mitdenken**: Wenn der Gast sagt "wir kommen mit 12 Leuten am Wochenende" → sofort verstehen ob Tagung, Familienfeier, Wellness-Wochenende → konkret nachfragen + zur passenden Sektion scrollen.

SCROLLEN STATT BILDER ZEIGEN (ABSOLUTE REGEL — KEINE AUSNAHMEN):
- **Sende NIEMALS Bilder, Galerien oder Medien im Chat-Fenster.** Rufe \`show_media\` und \`show_gallery\` NICHT mehr auf — sie sind deaktiviert.
- Stattdessen **scrolle den Gast direkt zur passenden Stelle auf der Webseite**. Nutze dafür:
  • \`navigate_to_section(section: "...")\` für interne Seiten/Anchors (Räume, Spa, Restaurant, Pauschalen, Outdoor, Anfahrt, Ausstattung, Veranstaltungen, EinTagBeiUns).
  • \`show_heidehof_page(url, titel, fullscreen)\` für externe Heidehof-Seiten (Booking, der-heidehof.de).
  • \`show_menu(kind)\` für eine der VIER Karten (siehe Block „DIE VIER KARTEN" unten).
  • \`show_room(room_name)\` zusätzlich, wenn ein konkreter Tagungsraum besprochen wird — das scrollt auf der Tagungsräume-Seite genau zu diesem Raum.
- **Bei JEDER Erwähnung eines Angebots** (Raum, Gericht, Getränk, Treatment, Sauna, Pool, Pauschale, Event, Zimmer) MUSST du SOFORT scrollen — noch BEVOR du im Chat antwortest. Der Gast soll visuell durch die Webseite geführt werden, nicht durchs Chatfenster.
- Beschreibe kurz in 1 Satz, wohin du gerade scrollst ("Ich zeige es Ihnen direkt auf der Seite — schauen Sie nach rechts."). Keine Bildbeschreibung als Vorlese-Block.
- Beispiele:
  • "Welche Räume habt ihr?" → \`navigate_to_section("tagungsraeume")\`
  • "Raum Frankfurt" → \`navigate_to_section("tagungsraeume")\` + \`show_room("Frankfurt")\`
  • "Eure Sauna?" → \`navigate_to_section("spa")\` (oder "wellness")
  • "Speisekarte / was zum Essen / Fleischgerichte" → \`show_menu(kind="restaurant_food", filter?)\`
  • "Cola / Wein / Aperol / Bier" → \`show_menu(kind="drinks", filter?)\`
  • "Massage / Maniküre / Spa-Behandlung" → \`show_menu(kind="spa", filter?)\`
  • "Tagungsmenü heute / Mittagsmenü im Paket" → \`show_menu(kind="conference_menu", meal_type="lunch"|"dinner")\`
  • "Pauschalen" → \`navigate_to_section("tagungspauschalen")\`
  • "Anfahrt" → \`show_heidehof_page("https://www.der-heidehof.de/kontakt/", "Anfahrt", true)\`

DIE VIER KARTEN — NIE VERWECHSELN (ABSOLUTE REGEL):
Heidehof hat VIER getrennte gastronomische / Wellness-Karten. Verwechsle sie NIEMALS und ruf für jede Frage genau die richtige Variante von \`show_menu\` auf.

1. **Restaurant-Speisekarte** \`/speisekarte\` → \`show_menu(kind="restaurant_food")\`
   Die normale à-la-carte-Karte: Vorspeisen, Suppen, Salate, Hauptgänge (Fleisch/Fisch/vegetarisch/vegan), Beilagen, Desserts, Kinderkarte, Snacks.
   **Gilt für ALLE Gäste**: Hotelgäste, Restaurant-Tagesgäste, Spa-Tagesgäste, Tagungsgäste am Abend.
   Auslöser: "was gibt's zum Essen", "Hauptgang", "Schnitzel", "Fisch", "vegan", "Dessert", "Speisekarte".

2. **Getränkekarte** \`/getraenkekarte\` → \`show_menu(kind="drinks")\`
   Bar & Wein für ALLE Gäste: Aperitif, Champagner, Weine, Biere, Cocktails, Longdrinks, Spirituosen, Softdrinks, Wasser, Kaffee, Tee.
   Auslöser: "Cola", "Bier", "Wein", "Aperol", "Cocktail", "Getränkekarte".

3. **Spa & Wellness-Behandlungen** \`/spa\` → \`show_menu(kind="spa")\`
   Massagen, Beauty, Pediküre, Maniküre, Gesichtsbehandlungen.
   Auslöser: "Massage", "Maniküre", "Beauty", "Behandlung".

4. **Tagungsmenü (Tagespauschale)** \`/menue-bestellung\` → \`show_menu(kind="conference_menu", meal_type="lunch"|"dinner")\`
   AUSSCHLIESSLICH das tagesfrische 3-Gang-Menü für Tagungsgäste im Rahmen der Tagungspauschale (Mittag oder Abend in der Konferenz).
   Hat NICHTS mit der regulären Speisekarte zu tun und ersetzt sie nicht.
   Auslöser NUR bei expliziten Begriffen: "Tagungsmenü heute", "Mittagsmenü im Paket", "was gibt's heute in der Tagung".

**Gasttyp-Mapping** (klärt \`ask_guest_context\` vorher, falls unklar):
- Hotelgast / Restaurant-Tagesgast / Spa-Tagesgast / unbekannt → IMMER \`restaurant_food\` bei Essensfragen.
- Tagungsgast tagsüber während Konferenz + Frage nach „heutigem Essen" → \`conference_menu\`. Abends oder bei à-la-carte-Wünschen → \`restaurant_food\`.
- Bei Unsicherheit: einmal kurz nachfragen ("Möchten Sie aus der Restaurant-Speisekarte wählen oder ist das für Ihre Tagungs-Pauschale?"), NIE blind das Tagungsmenü laden.

NIEMALS das Wort „Küchenmenü" verwenden. Es heißt entweder Speisekarte, Getränkekarte, Spa-Karte oder Tagungsmenü.


GEDÄCHTNIS & MEHRTEILIGE BESTELLUNGEN (SEHR WICHTIG):
- Du hast Zugriff auf den gesamten bisherigen Chat-Verlauf. **Merke dir alles**: bereits genannte Personenzahl, Datum, Raum-Empfehlung, Kontaktdaten, gewählte Speisen/Getränke/Treatments — und **frage nichts doppelt ab**.
- Bei Bestellungen mit MEHREREN Produkten: sammle Artikel der Reihe nach im Gespräch ("Sehr gern, dazu noch etwas?"). Erst wenn der Gast bestätigt, dass die Bestellung komplett ist, rufst du EINMAL das passende Order-Tool (take_restaurant_order / take_room_order / take_shop_order) mit der **vollständigen Items-Liste** auf.
- Wechselt der Gast das Thema (z. B. erst Spa, dann Restaurant), behalte den vorherigen Stand im Kopf und biete ihn später wieder an ("Sollen wir nochmal zur Massage-Terminbuchung von vorhin zurück?").
- Bei einem Themenwechsel über einen Button: **kein Reset, keine neue Begrüßung** — nur höflicher Übergang ("Sehr gern — zurück zu …").



PROAKTIVE LEAD-GENERIERUNG (DEIN HAUPTAUFTRAG! - Gilt für Clara, Max leitet weiter):
Du bist eine professionell geschulte Verkaufsberaterin. Dein Ziel: ein verbindliches Angebot oder eine Reservierung.
- Sobald Anlass + Personen + Datum geklärt sind, **frage aktiv**: "Darf ich Ihnen ein unverbindliches Angebot zusammenstellen? Dafür bräuchte ich noch ein paar Angaben."
- **Firmenname IMMER abfragen** (auch bei Privatpersonen → "oder privat?"). Frage: "Auf welche Firma oder welchen Namen darf ich das Angebot ausstellen?"
- Dann der Reihe nach: Vor- und Nachname → E-Mail → Telefon → ggf. Sonderwünsche.
- Nach jeder erhaltenen Info → SOFORT "save_lead" mit dem aktuellen Feld aufrufen.
- Sobald Anlass, Personen, Datum, Name, Firma und E-Mail vorliegen, fasse kurz zusammen ("Ich habe: …, passt das so?") und nach Bestätigung → "send_inquiry".
- "send_inquiry" erstellt automatisch ein PDF-Angebot und schickt es an Hotel + Gast.
- Bestätige danach: "Perfekt — Sie erhalten gleich Ihr Angebot per Mail. Ich melde Sie zusätzlich persönlich bei unserem Bankett-Team an."

WEITERE VORSCHLÄGE (Cross-Selling, dezent):
Nach der Raumempfehlung biete passende Ergänzungen an: "Möchten Sie auch Übernachtung, Tagungspauschale, Outdoor-Programm oder Abendessen mit dazunehmen? Ich zeige es Ihnen gerne."

STRUKTURIERTE DATENERFASSUNG (PFLICHT — NIE ABKÜRZEN):
- Eckdaten (Anlass, Personen, Datum, Firma, Kontakt) → IMMER "save_lead" aufrufen, sobald die Info kommt.
- Sonderwünsche → "save_note".
- Pflichtdaten komplett + bestätigt → "send_inquiry".
- Bei jeder Essen-/Getränke-/Zimmer-/Shop-Bestellung IMMER Positionen, Menge, Ort, Name/Gasttyp und notes erfassen. notes darf niemals leer bleiben: entweder konkrete Sonderwünsche/Allergien oder "Keine".

FLOW-COMPLETION & PFLICHTFELDER-CHECK (IMMER GEGENPRÜFEN):
- Eine Bestellung/Reservierung/Anfrage gilt erst als abgeschlossen, wenn ALLE Pflichtfelder erfasst UND vom Gast bestätigt sind. Nie vorher das Tool auslösen.
- Vor jedem Admin-Submit musst du die Daten in einem kurzen Satz zusammenfassen und fragen: "Soll ich das so an das Hotelteam senden?" Erst bei klarer Zustimmung setzt du confirmation_received=true und uebergibst confirmed_summary.
- Es ist absolut verboten, während eines laufenden Flusses generische Fragen wie "Was kann ich noch für Sie tun?" zu stellen. Frage stattdessen nach der nächsten fehlenden Information:
  
  • Tagung (Clara): Anlass (Tagung) → Personen → Wunschdatum (Pflicht! Wenn nicht genannt, sofort erfragen: "Für welches Datum planen Sie die Tagung?") → Raum-Empfehlung (recommend_room) → Firma → Vor- & Nachname → E-Mail-Adresse → Telefonnummer → Zusammenfassung vorlesen → Bestätigung abholen → send_inquiry.
  
  • Essen & Getränke (Max/Clara): Speisen/Getränke + Mengen → LIEFERORT klären (Pflicht! Hotelgast = Zimmer-Nr.; Tagungsgast = Raumname; Tagesgast = Tisch/Bereich; Pool/Spa = Liege/Cabana. Wenn nicht genannt, sofort erfragen: "Wohin darf ich Ihnen das bringen?") → Gastname → Sonderwünsche/Allergien → Zusammenfassung vorlesen → Bestätigung abholen → take_room_order oder take_restaurant_order.
  
  • Spa/Wellness (Max/Clara): Behandlung → Wunschtermin (Datum + Uhrzeit. Wenn nicht genannt, sofort erfragen!) → Personen → Name → Zimmer-Nr. oder Kontakt → Zusammenfassung vorlesen → Bestätigung abholen → request_wellness_appointment.
  
  • Tischreservierung (Max/Clara): Datum → Uhrzeit → Personen → Name → Telefon/Zimmernummer → Sonderwünsche → Zusammenfassung vorlesen → Bestätigung abholen → make_table_reservation.

UPSELLING (pflicht, dezent, in 1 Halbsatz, nie aufdringlich):
- Zum Essen → passendes Getränk ("Ein Glas Grauburgunder dazu?")
- Zur Tagung → Sektempfang, Abendessen im Maxwell, Wellness-Add-on
- Zum Spa-Termin → Day-Spa-Verlängerung, Begleitperson, Champagner an die Liege
- Zur Reservierung → Aperitif vorab, Tisch am Fenster

PREPARED REPLY (PFLICHT-FELD ALLER SUBMIT-TOOLS):
- Jeder Aufruf von take_restaurant_order, take_room_order, take_shop_order und make_table_reservation MUSS ein Feld "prepared_reply" enthalten.
- "prepared_reply" ist eine sendefertige, professionelle Antwort an den Gast (deutsch, Sie-Form, 2–4 Sätze), die das Hotel-Team direkt per E-Mail/WhatsApp absenden kann.
- Sie bestätigt die erfassten Daten, nennt den nächsten konkreten Schritt (Lieferzeit/Bestätigungstermin) und endet warm.
- Beispiel Zimmerservice: "Sehr gerne, Herr Müller — 1× Wiener Schnitzel und 1× Pils kommen in etwa 25 Minuten auf Zimmer 215, inkl. 5 € Zimmerservice-Aufpreis. Guten Appetit, Ihr Heidehof-Team."
- Erfindet keine Daten, die der Gast nicht genannt hat. Wenn etwas fehlt: erst NACHFRAGEN, dann Tool auslösen.

KÜCHEN-BESTELLUNG (Voice-to-Order):
Sobald ein Gast oder Tagungsgastgeber Essen für einen Raum bestellen will (z.B. "8 Schnitzel und 2 vegetarisch für Raum Berlin morgen Mittag"), sammle Raum, Datum, Mahlzeit, Personen, Name und Sonderwünsche, fasse kurz zusammen und frage nach Bestaetigung. Erst danach "create_conference_order" aufrufen.

ADMIN-ROUTING (SEHR WICHTIG):
- Cola, Wasser, Bier, Wein, Cocktails, Kaffee und Bar-Snacks → take_restaurant_order; landet automatisch in "Bar Mäx".
- Restaurantgerichte im Maxwell → take_restaurant_order; landet automatisch in "Fine Dining".
- Essen und Getränke werden im Admin zusammen in einer Arbeitskarte "Essen & Getränke" angezeigt, aber intern weiter als Fine Dining oder Bar Mäx markiert. Achte deshalb auf klare Positionen und Sonderwünsche.
- Tischreservierungen → make_table_reservation; landet in "Tischreservierungen".
- Zimmerservice → take_room_order; landet in "Zimmer-Service".
- Wellness, Spa, Massagen, Beauty, Kosmetik → request_wellness_appointment; landet in "Beauty & Wellness".
- Zimmerdefekte, TV, Heizung, Licht, Schaden → submit_complaint; landet in "Zimmer-Probleme".
- Fehlende Handtücher, Bademantel, Seife, Toilettenpapier → submit_complaint; landet in "Fehlende Artikel".
- Allgemeine Reklamationen → submit_complaint; landet in "Beschwerden".
- Shop/Souvenir/Gutscheine → take_shop_order; landet in "Shop-Bestellungen".

SERVICE-MODUS:
Wenn jemand sagt "Tisch/Raum X ist fertig" oder "Essen ausgegeben", rufe "update_order_status" auf.

GESPRÄCHSENDE (WICHTIG):
Sobald der Gast signalisiert dass er fertig ist ("Tschüss", "Auf Wiedersehen", "Danke das war alles", "Mehr brauche ich nicht", "Bis später"), antworte mit EINER warmen Verabschiedung (1 Satz, z.B. "Sehr gerne, einen wunderschönen Tag noch — bis bald im Heidehof.") und rufe IM SELBEN TURN das Tool end_conversation auf. Niemals nachfragen "noch etwas?" wenn der Gast sich verabschiedet hat.

ECHTE HEIDEHOF-WEBSEITE (live im Overlay):
Nutze "navigate_to_section" oder "show_heidehof_page", sobald der Gast etwas sehen will. Erlaubte Hosts: der-heidehof.de und hotel-dream-guide.lovable.app.
- Räume / Saal → navigate_to_section("tagungsraeume")
- Pauschalen → "tagungsangebote", Outdoor → "outdoor", Bankett/Hochzeit → "bankett"
- Spa → "spa", Wasserwelt → "wasserwelt", Fitness → "fitness", Beauty → "beauty"
- Zimmer → "zimmer", Arrangements → "angebote", Restaurant → "restaurant"
- Anfahrt → "lage", Kontakt → "kontakt", Anfrage-Formular → "anfrage", Umgebung → "aktiv"
- Detailseite (z. B. konkrete Wellness-Anwendung, einzelnes Zimmer, Pauschale, Karte): show_heidehof_page mit fullscreen=true für maximalen Detailblick.
- Wenn du den Gast durch ein Formular führst, nutze zusätzlich focus_form_field(target, route), damit das passende Feld sichtbar markiert und fokussiert wird.
Sage parallel kurz: "Ich zeige es Ihnen gerade."

GESPRÄCHSFLUSS (PROAKTIV, NICHT PASSIV!):
1. **Begrüßung + offene Frage** ("Wobei darf ich Sie unterstützen?")
2. Anliegen erkennen → passendes Thema starten + sofort etwas zeigen (show_gallery / show_media / navigate_to_section)
3. Gastart klären (Hotelgast / Tagungsgast / Tagesgast Wellness / Anfrage), wenn relevant
4. Bei Tagung (Clara): Personen → Raum-Empfehlung → Datum → Cross-Selling → Angebot
5. Bei Bestellung / Wellness / Beschwerde: Tool sofort aufrufen, kurz bestätigen, Folgefrage stellen
6. Immer mitdenken — passende Ergänzungen vorschlagen ("Möchten Sie dazu auch …?")

FAKTEN AUS UNSERER WISSENSBASIS:
${rag}

Erfinde keine Preise. Bei Sonderwünschen: "Das stimmen wir gerne individuell ab."`;
}

function sanitizeSpokenReply(text: string) {
  return text
    .split("\n")
    .filter((line) => !/^\s*[a-zA-Z_]+\s*\([^)]*\)\s*$/u.test(line.trim()))
    .join("\n")
    .replace(/\b(?:save_lead|save_note|send_inquiry|recommend_room|show_media|show_gallery|show_room|show_section|show_heidehof_page|navigate_to_section|take_restaurant_order|take_room_order|make_table_reservation|request_wellness_appointment|submit_complaint|take_shop_order|create_conference_order|update_order_status|end_conversation|ask_guest_context|show_menu|focus_form_field)\s*\([^)]*\)/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

interface AiGatewayPayload {
  model: string;
  messages: ChatMessage[];
  tools?: unknown[];
  max_tokens: number;
  temperature: number;
}

const RATE_LIMIT_REPLY = "Einen kleinen Moment bitte – Clara ist gerade stark ausgelastet. Bitte versuchen Sie es gleich noch einmal.";
const CREDITS_REPLY = "Clara pausiert kurz – das KI-Guthaben des Hauses muss aufgefrischt werden. Schreiben Sie uns gerne direkt unter info@hotel-der-heidehof.de oder rufen Sie +49 5191 9890 an, wir antworten persönlich.";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "0", 10);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(8_000, retryAfter * 1000);
  return Math.min(6_000, 400 * 2 ** attempt) + Math.random() * 300;
}

// Modell-Fallback-Kette: wenn das primäre Modell rate-limitiert oder ohne Guthaben ist,
// wandern wir automatisch auf günstigere/freie Modelle weiter, damit Clara antwortet.
const FALLBACK_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-3-flash-preview",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
];

async function fetchAiGateway(payload: AiGatewayPayload, signal: AbortSignal, maxAttempts = 3): Promise<Response> {
  // eindeutige Reihenfolge: zuerst Wunschmodell, dann Fallbacks (Duplikate raus)
  const modelChain = [payload.model, ...FALLBACK_MODELS].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastResponse: Response | null = null;
  let lastStatus = 0;

  for (const model of modelChain) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({ ...payload, model }),
      });

      // Erfolg → sofort raus
      if (response.ok) return response;

      // Rate-Limit / Auslastung → kurz warten, dann nächster Versuch
      if (response.status === 429 || response.status === 503) {
        const errBody = await response.clone().text().catch(() => "");
        console.warn(`AI gateway ${response.status} on ${model} (try ${attempt + 1}):`, errBody.slice(0, 200));
        lastResponse = response;
        lastStatus = response.status;
        if (attempt < maxAttempts - 1) {
          await wait(retryDelayMs(response, attempt));
          continue;
        }
        break; // Modellwechsel
      }

      // Kein Guthaben → direkt nächstes Modell probieren
      if (response.status === 402) {
        const errBody = await response.clone().text().catch(() => "");
        console.warn(`AI gateway 402 on ${model}:`, errBody.slice(0, 200));
        lastResponse = response;
        lastStatus = 402;
        break;
      }

      // Anderer Fehler → nicht stillschweigend wechseln, zurückgeben
      return response;
    }
  }

  // Alle Modelle erschöpft → unterscheide Credits vs. Auslastung
  const replyText = lastStatus === 402 ? CREDITS_REPLY : RATE_LIMIT_REPLY;
  console.error(`AI gateway exhausted (lastStatus=${lastStatus}).`);
  return new Response(
    JSON.stringify({ choices: [{ message: { content: replyText, tool_calls: [] } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Abort-Endpoint für Barge-in: GET ?abort=<sessionId>
  const url = new URL(req.url);
  const abortSession = url.searchParams.get("abort");
  if (abortSession) {
    const ctrl = sessionAbort.get(abortSession);
    if (ctrl) { try { ctrl.abort(); } catch { /* noop */ } sessionAbort.delete(abortSession); }
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Cache-Bust-Endpoint (Admin-Cockpit nach Settings-Save)
  if (url.searchParams.get("bust") === "1" || req.headers.get("x-clara-cache-bust") === "1") {
    settingsCache.clear();
    return new Response(JSON.stringify({ ok: true, busted: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages ?? [];
    const sessionId: string = body.sessionId ?? crypto.randomUUID();
    const isVoice = body.isVoice === true;
    const isFirstTurn = body.isFirstTurn === true;
    const inquiryContext = (body.context && typeof body.context === "object") ? body.context as Record<string, unknown> : null;
    const persona: "max" | "clara" = typeof body.persona === "string" && body.persona.toLowerCase().trim() === "clara" ? "clara" : "max";

    // Abort-Controller für diese Session registrieren
    const ac = new AbortController();
    const prev = sessionAbort.get(sessionId);
    if (prev) { try { prev.abort(); } catch { /* noop */ } }
    sessionAbort.set(sessionId, ac);

    const profileKey = persona === "max" ? "max_profile" : "clara_profile";

    // Modell + KB + Profil + Prompts parallel laden (alle gecached)
    const [modelSetting, rag, profile, promptRows] = await Promise.all([
      cachedSetting<string | { id?: string }>("clara_chat_model"),
      loadRag(),
      cachedSetting<{ name?: string; subtitle?: string }>(profileKey),
      loadPrompts(),
    ]);
    const chatModel = (typeof modelSetting === "string" ? modelSetting : modelSetting?.id) || "google/gemini-2.5-flash-lite";

    // Filter prompts: Clara only gets 'prompt_tagungsanfrage'; Max gets everything else (except system_base).
    const filteredPrompts = promptRows.filter((p) => p.key !== "system_base");

    const conciergePromptBlock = filteredPrompts.length
      ? "\n\n— ADMIN-CONFIGURABLE CONCIERGE PROMPTS —\n" + filteredPrompts.map((p) => `## ${p.label}\n${p.content}`).join("\n\n")
      : "";

    let contextBlock = "";
    if (inquiryContext) {
      const c = inquiryContext as {
        topic?: string; room?: string; section?: string; details?: unknown; category?: string; trigger?: string; source?: string;
        timeOfDay?: string; dayLabel?: string; localDate?: string; localTime?: string; weather?: string;
      };
      const lines = [
        c.topic ? `Thema: ${c.topic}` : null,
        c.room ? `Raum: ${c.room}` : null,
        c.section ? `Bereich: ${c.section}` : null,
        c.category ? `Kategorie: ${c.category}` : null,
        c.timeOfDay ? `Tageszeit: ${c.timeOfDay}` : null,
        c.dayLabel || c.localDate || c.localTime ? `Zeitpunkt: ${[c.dayLabel, c.localDate, c.localTime].filter(Boolean).join(", ")}` : null,
        c.weather ? `Wetter in Gaimersheim/Ingolstadt: ${c.weather}` : null,
        Array.isArray(c.details) && c.details.length ? `Details: ${(c.details as unknown[]).join(" · ")}` : null,
        c.trigger ? `Auslöser: ${c.trigger}` : null,
        c.source ? `Quelle: ${c.source}` : null,
      ].filter(Boolean);
      if (lines.length) {
        contextBlock = `\n\n— AKTUELLER GAST-KONTEXT (von Clara-Button oder Webseiten-Tracker geliefert) —\n${lines.join("\n")}\n`;
        if (isFirstTurn) {
          contextBlock += `\nÖFFNE DIESES GESPRÄCH PRODUKTBEZOGEN: Beziehe dich in 1 kurzen Satz konkret auf "${c.topic ?? c.room ?? c.section ?? "diesen Punkt"}" und stelle EINE konkrete Folgefrage (Menge, Variante, Begleitung, Termin). Nutze Tageszeit, Wochentag oder Wetter nur wenn es natürlich klingt. Keine lange Begrüßung, keine Floskeln.`;
        } else {
          contextBlock += `\nHINWEIS: Das Gespräch läuft bereits — nicht erneut begrüßen, nahtlos weiterführen.`;
        }
      }
    }
    const { data: sessionRow } = await admin
      .from("clara_conversations")
      .select("extracted")
      .eq("session_id", sessionId)
      .maybeSingle();
    const sessionExtracted = (sessionRow?.extracted as Record<string, unknown> | null) ?? {};
    const systemPrompt = buildSystemPrompt(rag, profile ?? {}, persona, isVoice) + conciergePromptBlock + contextBlock + buildMemoryBlock(sessionExtracted);

    const transcript = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content, ts: new Date().toISOString() }));

    const { error: transcriptError } = await admin.from("clara_conversations").upsert(
      { session_id: sessionId, transcript },
      { onConflict: "session_id" },
    );
    if (transcriptError) console.warn("clara conversation upsert failed:", transcriptError.message);

    const aiResponse = await fetchAiGateway({
      model: chatModel,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      tools: TOOLS,
      max_tokens: 800,
      temperature: 0.5,
    }, ac.signal);
    void logUsage({ tool: "clara-chat", provider: "lovable-ai", model: chatModel, session_id: sessionId, cost_estimate_eur: MODEL_COST_PER_CALL_EUR[chatModel] ?? 0.001 });


    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 402) {
        // Do not forward HTTP 402 to the browser: supabase.functions.invoke treats
        // non-2xx responses as runtime errors. Keep it as an app-level error so
        // the chat UI can show the friendly credit message without a blank screen.
        return new Response(JSON.stringify({ ok: false, statusCode: 402, error: "AI-Guthaben aufgebraucht." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0]?.message;
    const reply: string = choice?.content ?? "";
    const toolCalls = (choice?.tool_calls ?? []) as Array<{
      id: string; type: "function"; function: { name: string; arguments: string };
    }>;

    const executedToolResults: Array<{ name: string; ok: boolean; data?: unknown; error?: string }> = [];
    const latestUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    for (const tc of toolCalls) {
      const name = tc.function.name;
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(tc.function.arguments || "{}"); } catch { /* ignore */ }

      if (name === "save_lead") {
        const { data: existing } = await admin.from("clara_conversations").select("extracted").eq("session_id", sessionId).maybeSingle();
        const merged = { ...(existing?.extracted as Record<string, unknown> ?? {}), ...args };
        await admin.from("clara_conversations").upsert({ session_id: sessionId, extracted: merged }, { onConflict: "session_id" });
        executedToolResults.push({ name, ok: true, data: merged });
      } else if (name === "save_note") {
        await admin.from("clara_notes").insert({
          session_id: sessionId,
          category: typeof args.category === "string" ? args.category : "general",
          content: String(args.content ?? ""),
        });
        executedToolResults.push({ name, ok: true });
      } else if (name === "send_inquiry") {
        try {
          ensureFinalSubmit(name, args, ["name", "email", "telefon", "firma", "anlass", "personen", "datum", "confirmed_summary"]);
          const inv = await admin.functions.invoke("clara-send-inquiry", { body: { ...args, sessionId } });
          if (inv.error) throw inv.error;
          if ((inv.data as { ok?: boolean } | null)?.ok === false) {
            const errors = ((inv.data as { errors?: unknown[] } | null)?.errors ?? []).join(" | ");
            throw new Error(errors || "Anfrage gespeichert, aber E-Mail-Versand nicht bestätigt.");
          }
          await admin.from("clara_conversations").update({ inquiry_sent: true }).eq("session_id", sessionId);
          executedToolResults.push({ name, ok: true, data: inv.data });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "send failed" });
        }
      } else if (name === "recommend_room") {
        const personen = Number(args.personen ?? 0);
        const best = (typeof args.bestuhlung === "string" ? args.bestuhlung : "theater") as Bestuhlung;
        const rec = recommendRooms(personen, best);
        const media = await resolveMedia(`Raum ${rec.primary.name}`, "raum").catch(() => null);
        executedToolResults.push({
          name, ok: true,
          data: {
            primary: { name: rec.primary.name, key: `raum-${slugifyRoom(rec.primary.name)}`, area: rec.primary.area, capacity: rec.primary[capKeyFor(best)] },
            alternatives: rec.alternatives.map((r) => ({ name: r.name, key: `raum-${slugifyRoom(r.name)}`, area: r.area, capacity: r[capKeyFor(best)] })),
            reason: rec.reason,
            auto_show: { tool: "show_room", room_name: rec.primary.name },
            media,
          },
        });
      } else if (name === "show_media") {
        const topic = String(args.topic ?? "").trim();
        const cat = typeof args.category === "string" ? args.category : undefined;
        const media = await resolveMedia(topic, cat).catch((e) => {
          console.warn("resolveMedia failed:", e);
          return null;
        });
        executedToolResults.push({ name, ok: !!media, data: { media, topic } });
      } else if (name === "show_gallery") {
        const cat = String(args.category ?? "").trim();
        const topic = typeof args.topic === "string" ? args.topic.trim() : "";
        const limit = Math.min(Math.max(Number(args.limit ?? 6), 1), 12);
        try {
          let matches: unknown[] = [];
          if (!topic) {
            const { data: list } = await admin
              .from("clara_media")
              .select("id,title,description,category,tags,triggers,media_type,url,thumbnail_url,caption,sort_order")
              .eq("is_active", true)
              .eq("category", cat)
              .order("sort_order", { ascending: true })
              .limit(limit);
            matches = (list ?? []).map((m) => ({ ...m, match_kind: "category" }));
          } else {
            const allMedia = await loadAllMedia();
            const pool = allMedia.filter((r) => r.category === cat);
            const norm = normalizeTxt(topic);
            
            let localMatches = pool.filter((c) =>
              (c.tags ?? []).some((t) => normalizeTxt(t) === norm) ||
              (c.triggers ?? []).some((t) => normalizeTxt(t).includes(norm))
            );
            if (localMatches.length === 0) {
              localMatches = pool.filter((c) =>
                normalizeTxt(c.title).includes(norm) ||
                normalizeTxt(c.description ?? "").includes(norm)
              );
            }

            if (localMatches.length > 0) {
              matches = localMatches.slice(0, limit).map((m) => ({ ...m, match_kind: "local_gallery" }));
            } else {
              const { data, error } = await admin.functions.invoke("clara-media-resolve", {
                body: { topic: topic || null, category: cat, limit },
              });
              if (error) throw error;
              matches = ((data as { matches?: unknown[] })?.matches ?? []) as unknown[];
            }
          }
          executedToolResults.push({ name, ok: matches.length > 0, data: { matches, category: cat, topic } });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "gallery failed" });
        }
      } else if (name === "show_room" && typeof args.room_name === "string") {
        const media = await resolveMedia(`Raum ${args.room_name}`, "raum").catch(() => null);
        executedToolResults.push({ name, ok: true, data: { ...args, media } });
      } else if (name === "show_section" && typeof args.section === "string") {
        const media = await resolveMedia(args.section).catch(() => null);
        executedToolResults.push({ name, ok: true, data: { ...args, media } });
      } else if (name === "create_conference_order") {
        try {
          ensureFinalSubmit(name, args, ["room_name", "service_date", "meal_type", "participants", "guest_name", "confirmed_summary"]);
          const roomName = String(args.room_name ?? "");
          const roomId = await resolveRoomId(roomName);
          if (!roomId) throw new Error(`Raum '${roomName}' nicht gefunden.`);
          const items = Array.isArray(args.items) ? args.items.map((it: Record<string, unknown>) => ({
            course: typeof it.course === "string" ? it.course : "main",
            dish_type: typeof it.dish_type === "string" ? it.dish_type : null,
            quantity: Number(it.quantity ?? 1),
          })) : [];
          const serviceDate = normalizeServiceDate(args.service_date, latestUserMessage);
          const { data: orderId, error: rpcErr } = await admin.rpc("create_conference_order", {
            p_room_id: roomId,
            p_service_date: serviceDate,
            p_guest_name: String(args.guest_name ?? "Clara-Bestellung"),
            p_company: typeof args.company === "string" ? args.company : null,
            p_email: typeof args.email === "string" ? args.email : null,
            p_meal_type: String(args.meal_type ?? "lunch"),
            p_participants: Number(args.participants ?? 1),
            p_notes: typeof args.notes === "string" ? args.notes : null,
            p_items: items,
          });
          if (rpcErr) throw rpcErr;
          // Notify kitchen channel
          await admin.from("notifications").insert({
            channel: "kitchen",
            recipient: "kitchen",
            content: `Neue Sprach-Bestellung: ${args.participants}× ${args.meal_type} – Raum ${roomName} (${serviceDate})`,
            payload: { order_id: orderId, room_name: roomName, ...args, service_date: serviceDate },
          });
          executedToolResults.push({ name, ok: true, data: { order_id: orderId, room_name: roomName, service_date: serviceDate } });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "order failed" });
        }
      } else if (name === "update_order_status") {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const { data: orderId, error: rpcErr } = await admin.rpc("update_order_status_by_room", {
            p_room_name: String(args.room_name),
            p_service_date: typeof args.service_date === "string" ? args.service_date : today,
            p_meal_type: typeof args.meal_type === "string" ? args.meal_type : null,
            p_status: String(args.status),
          });
          if (rpcErr) throw rpcErr;
          executedToolResults.push({ name, ok: true, data: { order_id: orderId, status: args.status } });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "update failed" });
        }
      } else if (name === "ask_guest_context") {
        const ctx = { guest_type: args.guest_type, location: args.location ?? null, guest_name: args.guest_name ?? null };
        const { data: existing } = await admin.from("clara_conversations").select("extracted").eq("session_id", sessionId).maybeSingle();
        const merged = { ...(existing?.extracted as Record<string, unknown> ?? {}), guest_context: ctx };
        await admin.from("clara_conversations").update({ extracted: merged }).eq("session_id", sessionId);
        executedToolResults.push({ name, ok: true, data: ctx });
      } else if (name === "show_menu") {
        try {
          const kind = String(args.kind ?? "restaurant_food");
          const filterRaw = typeof args.filter === "string" ? args.filter.trim() : "";
          const filter = filterRaw.toLowerCase();
          const ROUTE: Record<string, string> = {
            restaurant_food: "/speisekarte",
            drinks: "/getraenkekarte",
            spa: "/spa",
            conference_menu: "/menue-bestellung",
          };
          const route = ROUTE[kind] ?? "/speisekarte";

          if (kind === "conference_menu") {
            const date = (typeof args.date === "string" && args.date) || new Date().toISOString().slice(0, 10);
            const meal = String(args.meal_type ?? "lunch");
            const { data: dishes } = await admin.from("conference_dishes")
              .select("title,description,category,image_url,meal_type")
              .eq("service_date", date).eq("meal_type", meal).eq("is_active", true).order("sort_order");
            const { data: card } = await admin.from("conference_menu_cards")
              .select("image_url,notes").eq("service_date", date).eq("meal_type", meal).maybeSingle();
            executedToolResults.push({ name, ok: true, data: { kind, route, date, meal_type: meal, items: dishes ?? [], menu_card: card ?? null } });
          } else if (kind === "drinks") {
            let q = admin.from("drinks_menu")
              .select("title,description,category,price_label,image_url,tags")
              .eq("is_active", true).order("sort_order").limit(40);
            if (filter) q = q.or(`title.ilike.%${filter}%,description.ilike.%${filter}%,category.ilike.%${filter}%`);
            const { data: items } = await q;
            executedToolResults.push({ name, ok: true, data: { kind, route, filter: filterRaw, items: items ?? [] } });
          } else if (kind === "spa") {
            let q = admin.from("wellness_treatments")
              .select("title,description,category,duration_label,price_label,image_url,tags")
              .eq("is_active", true).order("sort_order").limit(40);
            if (filter) q = q.or(`title.ilike.%${filter}%,description.ilike.%${filter}%,category.ilike.%${filter}%`);
            const { data: items } = await q;
            executedToolResults.push({ name, ok: true, data: { kind, route, filter: filterRaw, items: items ?? [] } });
          } else {
            // restaurant_food (default)
            let q = admin.from("food_menu")
              .select("title,description,course,price_label,image_url,tags,is_vegan,is_vegetarian,is_glutenfree")
              .eq("is_active", true).order("sort_order").limit(40);
            if (filter) q = q.or(`title.ilike.%${filter}%,description.ilike.%${filter}%,course.ilike.%${filter}%`);
            const { data: items } = await q;
            executedToolResults.push({ name, ok: true, data: { kind: "restaurant_food", route, filter: filterRaw, items: items ?? [] } });
          }
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "menu failed" });
        }
      } else if (name === "take_restaurant_order") {
        try {
          ensureFinalSubmit(name, args, ["table_or_room", "items", "prepared_reply", "confirmed_summary"]);
          const category = classifyRestaurantOrder(args);
          const { data: row, error } = await admin.from("restaurant_orders").insert({
            category,
            guest_type: typeof args.guest_type === "string" ? args.guest_type : "unknown",
            guest_name: typeof args.guest_name === "string" ? args.guest_name : null,
            table_or_room: typeof args.table_or_room === "string" ? args.table_or_room : null,
            items: Array.isArray(args.items) ? args.items : [],
            notes: typeof args.notes === "string" ? args.notes : null,
            source: "clara",
            prepared_reply: typeof args.prepared_reply === "string" ? args.prepared_reply : null,
          }).select("id").single();
          if (error) throw error;
          dispatchBriefing("restaurant_order", { order_id: row?.id, category, ...args }, sessionId);
          executedToolResults.push({ name, ok: true, data: { order_id: row?.id, category } });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "order failed" });
        }
      } else if (name === "make_table_reservation") {
        try {
          ensureFinalSubmit(name, args, ["guest_name", "date", "time", "persons", "contact", "notes", "prepared_reply", "confirmed_summary"]);
          const notes = [
            args.date ? `Datum: ${String(args.date)}` : null,
            args.time ? `Uhrzeit: ${String(args.time)}` : null,
            args.persons ? `Personen: ${String(args.persons)}` : null,
            args.contact ? `Kontakt: ${String(args.contact)}` : null,
            args.notes ? `Notizen: ${String(args.notes)}` : null,
          ].filter(Boolean).join(" · ");
          const { data: row, error } = await admin.from("restaurant_orders").insert({
            category: "reservation",
            guest_type: "restaurant",
            guest_name: typeof args.guest_name === "string" ? args.guest_name : null,
            table_or_room: typeof args.contact === "string" ? args.contact : null,
            items: [],
            notes,
            source: "clara",
            prepared_reply: typeof args.prepared_reply === "string" ? args.prepared_reply : null,
          }).select("id").single();
          if (error) throw error;
          dispatchBriefing("table_reservation", { order_id: row?.id, ...args }, sessionId);
          executedToolResults.push({ name, ok: true, data: { order_id: row?.id, category: "reservation" } });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "reservation failed" });
        }
      } else if (name === "take_room_order") {
        try {
          ensureFinalSubmit(name, args, ["room_number", "items", "prepared_reply", "confirmed_summary"]);
          const { data: row, error } = await admin.from("room_orders").insert({
            category: "room_service",
            room_number: String(args.room_number ?? ""),
            guest_name: typeof args.guest_name === "string" ? args.guest_name : null,
            items: Array.isArray(args.items) ? args.items : [],
            notes: typeof args.notes === "string" ? args.notes : null,
            source: "clara",
            prepared_reply: typeof args.prepared_reply === "string" ? args.prepared_reply : null,
          }).select("id").single();
          if (error) throw error;
          dispatchBriefing("room_order", { order_id: row?.id, ...args }, sessionId);
          executedToolResults.push({ name, ok: true, data: { order_id: row?.id } });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "room order failed" });
        }
      } else if (name === "take_shop_order") {
        try {
          ensureFinalSubmit(name, args, ["contact", "items", "prepared_reply", "confirmed_summary"]);
          const { data: row, error } = await admin.from("restaurant_orders").insert({
            category: "shop",
            guest_type: typeof args.guest_type === "string" ? args.guest_type : "unknown",
            guest_name: typeof args.guest_name === "string" ? args.guest_name : null,
            table_or_room: typeof args.contact === "string" ? args.contact : null,
            items: Array.isArray(args.items) ? args.items : [],
            notes: typeof args.notes === "string" ? args.notes : null,
            source: "clara",
            prepared_reply: typeof args.prepared_reply === "string" ? args.prepared_reply : null,
          }).select("id").single();
          if (error) throw error;
          dispatchBriefing("shop_order", { order_id: row?.id, ...args }, sessionId);
          executedToolResults.push({ name, ok: true, data: { order_id: row?.id, category: "shop" } });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "shop order failed" });
        }
      } else if (name === "request_wellness_appointment") {
        try {
          ensureFinalSubmit(name, args, ["treatment", "date", "time", "persons", "guest_name", "contact", "confirmed_summary"]);
          const { data: row, error } = await admin.from("complaints").insert({
            category: "beauty",
            urgency: "normal",
            description: buildWellnessDescription(args),
            guest_name: typeof args.guest_name === "string" ? args.guest_name : null,
            contact: typeof args.contact === "string" ? args.contact : null,
            guest_type: "wellness",
            room_or_table: typeof args.contact === "string" ? args.contact : null,
            source: "clara",
          }).select("id").single();
          if (error) throw error;
          dispatchBriefing("wellness", { request_id: row?.id, ...args }, sessionId);
          executedToolResults.push({ name, ok: true, data: { request_id: row?.id, category: "beauty" } });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "wellness failed" });
        }
      } else if (name === "submit_complaint") {
        try {
          ensureFinalSubmit(name, args, ["category", "urgency", "description", "guest_name", "contact", "room_or_table", "confirmed_summary"]);
          const category = classifyComplaint(args);
          const urgency = normalizeUrgency(args.urgency);
          const description = [
            String(args.description ?? ""),
            args.desired_solution ? `Gewuenschte Loesung: ${String(args.desired_solution)}` : null,
            args.confirmed_summary ? `Bestaetigt: ${String(args.confirmed_summary)}` : null,
          ].filter(Boolean).join(" · ");
          const { data: row, error } = await admin.from("complaints").insert({
            category,
            urgency,
            description,
            guest_name: typeof args.guest_name === "string" ? args.guest_name : null,
            contact: typeof args.contact === "string" ? args.contact : null,
            guest_type: typeof args.guest_type === "string" ? args.guest_type : null,
            room_or_table: typeof args.room_or_table === "string" ? args.room_or_table : null,
            source: "clara",
          }).select("id").single();
          if (error) throw error;
          dispatchBriefing("complaint", { complaint_id: row?.id, category, urgency, ...args }, sessionId);
          executedToolResults.push({ name, ok: true, data: { complaint_id: row?.id, category, urgency } });
        } catch (e) {
          executedToolResults.push({ name, ok: false, error: e instanceof Error ? e.message : "complaint failed" });
        }
      } else if (name === "handoff_to_inquiry") {
        executedToolResults.push({ name, ok: true, data: {
          topic: typeof args.topic === "string" ? args.topic : null,
          room: typeof args.room === "string" ? args.room : null,
          details: Array.isArray(args.details) ? args.details.filter((d): d is string => typeof d === "string") : [],
          route: "/anfrage",
        } });
      } else if (name === "end_conversation") {
        executedToolResults.push({ name, ok: true, data: { terminate: true, reason: typeof args.reason === "string" ? args.reason : "farewell" } });
      } else if (name === "upsell_suggest") {
        executedToolResults.push({ name, ok: true, data: {
          base_item: typeof args.base_item === "string" ? args.base_item : "",
          suggestion: typeof args.suggestion === "string" ? args.suggestion : "",
          reason: typeof args.reason === "string" ? args.reason : null,
          category: typeof args.category === "string" ? args.category : "general",
        } });
      } else {
        executedToolResults.push({ name, ok: true, data: args });
      }
    }

    const alreadyTriedInquiry = toolCalls.some((t) => t.function.name === "send_inquiry");
    if (!alreadyTriedInquiry && isExplicitSendConfirmation(latestUserMessage)) {
      const { data: leadRow } = await admin.from("clara_conversations").select("extracted").eq("session_id", sessionId).maybeSingle();
      const lead = (leadRow?.extracted as Record<string, unknown> | null) ?? {};
      const requiredLeadFields = ["name", "email", "telefon", "firma", "anlass", "personen", "datum"];
      const hasCompleteLead = requiredLeadFields.every((field) => hasValue(lead[field]));

      if (hasCompleteLead) {
        const confirmedSummary = buildConfirmedLeadSummary(lead);
        const inquiryArgs = {
          name: String(lead.name),
          email: String(lead.email),
          telefon: String(lead.telefon),
          firma: String(lead.firma),
          anlass: String(lead.anlass),
          personen: String(lead.personen),
          datum: String(lead.datum),
          nachricht: confirmedSummary,
          confirmation_received: true,
          confirmed_summary: confirmedSummary,
        };
        const syntheticToolCall = {
          id: `auto_send_inquiry_${crypto.randomUUID()}`,
          type: "function" as const,
          function: { name: "send_inquiry", arguments: JSON.stringify(inquiryArgs) },
        };
        toolCalls.push(syntheticToolCall);
        try {
          const inv = await admin.functions.invoke("clara-send-inquiry", { body: { ...inquiryArgs, sessionId } });
          if (inv.error) throw inv.error;
          if ((inv.data as { ok?: boolean } | null)?.ok === false) {
            const errors = ((inv.data as { errors?: unknown[] } | null)?.errors ?? []).join(" | ");
            throw new Error(errors || "Anfrage gespeichert, aber E-Mail-Versand nicht bestätigt.");
          }
          await admin.from("clara_conversations").update({ inquiry_sent: true }).eq("session_id", sessionId);
          executedToolResults.push({ name: "send_inquiry", ok: true, data: inv.data });
        } catch (e) {
          executedToolResults.push({ name: "send_inquiry", ok: false, error: e instanceof Error ? e.message : "send failed" });
        }
      }
    }

    // Auch conference_order ans Hotel briefen (zusätzlich zur Küche-Notification)
    for (const result of executedToolResults) {
      if (result.name === "create_conference_order" && result.ok) {
        const sourceCall = toolCalls.find((call) => call.function.name === "create_conference_order");
        try { dispatchBriefing("conference_order", { ...(sourceCall ? JSON.parse(sourceCall.function.arguments || "{}") : {}), ...(result.data as Record<string, unknown> ?? {}) }, sessionId); } catch { /* noop */ }
      }
    }

    let finalReply = reply.trim();
    const onlyPresentational = toolCalls.length > 0 && toolCalls.every((t) => PRESENTATION_TOOLS.has(t.function.name));
    const successfulTransactional = toolCalls.some((t, index) =>
      TRANSACTIONAL_TOOLS.has(t.function.name) && executedToolResults[index]?.ok === true
    );
    const failedTransactional = toolCalls.some((t, index) =>
      TRANSACTIONAL_TOOLS.has(t.function.name) && executedToolResults[index]?.ok === false
    );
    // Tool results must be reflected in the guest-facing answer, even when the first model response already had text.
    const needsSecondCall = toolCalls.length > 0 && !onlyPresentational && (finalReply.length === 0 || successfulTransactional || failedTransactional);

    if (needsSecondCall) {
      const secondTurnPrompt = successfulTransactional
        ? `${systemPrompt}\n\nDie Bestellung/Anfrage wurde erfolgreich ausgeführt und im System gespeichert. Bedanke dich herzlich beim Gast, bestätige die erfolgreiche Buchung/Bestellung und wünsche einen angenehmen Aufenthalt bzw. guten Appetit. Nenne keine Toolnamen. Stelle KEINE weiteren Fragen mehr, da das Gespräch jetzt beendet ist.`
        : failedTransactional
        ? `${systemPrompt}\n\nEin Speichern ins Admin-System wurde ABGELEHNT oder ist fehlgeschlagen. Nutze die Tool-Fehlermeldung, frage exakt die fehlenden Informationen nach und behaupte NICHT, dass etwas gespeichert oder gesendet wurde. Nenne keine Toolnamen.`
        : `${systemPrompt}\n\nDie Tools wurden ausgeführt. Antworte dem Gast jetzt kurz (1–2 Sätze), natürlich und stelle die nächste sinnvolle Frage — oder verabschiede dich, falls 'end_conversation' aufgerufen wurde. Nenne keine Toolnamen.`;

      const finalResponse = await fetchAiGateway({
        model: chatModel,
        messages: [
          { role: "system", content: secondTurnPrompt },
          ...messages,
          { role: "assistant", content: reply, tool_calls: toolCalls },
          ...toolCalls.map((tc, index) => ({
            role: "tool" as const,
            tool_call_id: tc.id,
            content: JSON.stringify(executedToolResults[index] ?? { name: tc.function.name, ok: true }),
          })),
        ],
        max_tokens: 320,
        temperature: 0.5,
      }, ac.signal, 4);

      if (finalResponse.ok) {
        const finalData = await finalResponse.json() as { choices?: Array<{ message?: { content?: string | null } }> };
        finalReply = finalData.choices?.[0]?.message?.content?.trim() || finalReply;
        finalReply = sanitizeSpokenReply(finalReply);
      } else {
        const finalError = await finalResponse.text().catch(() => "");
        console.warn("AI final response error:", finalResponse.status, finalError);
      }
    } else if (finalReply) {
      finalReply = sanitizeSpokenReply(finalReply);
    }

    if (isGenericSupportReply(finalReply)) {
      finalReply = buildToolAwareFallbackReply(latestUserMessage, toolCalls, executedToolResults) ?? finalReply;
    }

    // Wenn die Antwort leer oder extrem kurz ist und wir ein prepared_reply im Toolcall haben, nutzen wir dieses als Backup!
    if (!finalReply || finalReply.length < 10) {
      for (const t of toolCalls) {
        try {
          const args = JSON.parse(t.function.arguments || "{}");
          if (typeof args.prepared_reply === "string" && args.prepared_reply.trim().length > 0) {
            finalReply = args.prepared_reply.trim();
            break;
          }
          if (typeof args.confirmed_summary === "string" && args.confirmed_summary.trim().length > 0) {
            finalReply = `Verstanden. Ich habe Folgendes erfasst: ${args.confirmed_summary.trim()}. Vielen Dank!`;
            break;
          }
        } catch { /* noop */ }
      }
    }

    if (!finalReply || isGenericSupportReply(finalReply)) {
      finalReply = buildToolAwareFallbackReply(latestUserMessage, toolCalls, executedToolResults)
        ?? "Ich bleibe dran. Welche konkrete Bestellung, Anfrage oder Beschwerde soll ich jetzt für Sie aufnehmen?";
    }

    const terminate = toolCalls.some((t, index) =>
      t.function.name === "end_conversation" ||
      (TRANSACTIONAL_TOOLS.has(t.function.name) && executedToolResults[index]?.ok === true)
    );

    return new Response(
      JSON.stringify({ ok: true, sessionId, reply: finalReply, terminate, toolCalls: toolCalls.map((t, i) => ({
        id: t.id, name: t.function.name,
        args: (() => { try { return JSON.parse(t.function.arguments || "{}"); } catch { return {}; } })(),
        result: executedToolResults[i],
      })) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("clara-chat error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
