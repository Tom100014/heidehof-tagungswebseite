// Reicher Kontext für Clara. Wird vor dem Öffnen ihres Chats gesetzt,
// damit sie sich proaktiv auf das genaue Produkt / die Sektion / den Raum bezieht.

export type ClaraContextCategory =
  | "drink"        // Getränk → Bar / Pool / Wellness
  | "food"         // Speise → Restaurant / Room-Service
  | "event"        // Veranstaltung / Gala / Brunch
  | "tagung"       // Tagung & Bankett (gehört zu Anfrage-Clara!)
  | "room"         // Tagungsraum oder Hotelzimmer
  | "wellness"     // Treatment / Massage / Pool
  | "package"      // Pauschale / Angebot
  | "general";

export type ClaraInquiryContext = {
  /** Kurzer Themen-Tag, z. B. "Aperol Spritz", "Wiener Schnitzel", "Raum Saal Aurelius" */
  topic?: string;
  /** Optional: konkreter Raum-Name (für Raum-CTAs) */
  room?: string;
  /** Optional: kurze Detail-Liste, die Clara im Opener zitieren darf (Preis, Volumen, Ausstattung …) */
  details?: string[];
  /** Quelle (Pfad oder Page-Label) für Logging / Personalisierung */
  source?: string;
  /** Kategorie steuert den Opener-Stil (Concierge vs. Bankett) */
  category?: ClaraContextCategory;
  /** Proaktiver Auslöser, z. B. route-dwell, section-view, product-click, form-focus */
  trigger?: string;
  /** Sichtbarer Seiten-/Sektionskontext, der im Opener genannt werden darf */
  section?: string;
  /** Optionales Ziel für Co-Pilot-Aktionen wie Formularfeld-Fokus */
  target?: string;
  /** Lokaler Tages-/Situationskontext für eine natürliche Begrüßung. */
  timeOfDay?: "morgens" | "mittags" | "nachmittags" | "abends" | "nachts";
  dayLabel?: string;
  localDate?: string;
  localTime?: string;
  weather?: string;
  area_sqm?: number;
  capacity?: number;
  ts?: number;
};

const STORAGE_KEY = "clara_inquiry_context";
const PENDING_OPEN_KEY = "clara_open_pending";
const PENDING_OPEN_MAX_AGE_MS = 5_000;

export const writeClaraInquiryContext = (ctx: ClaraInquiryContext): void => {
  const next = { ...ctx, ts: Date.now() };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("clara:context-updated", { detail: next }));
  }
};

export const readClaraInquiryContext = (): ClaraInquiryContext | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClaraInquiryContext;
  } catch { return null; }
};

export const clearClaraInquiryContext = (): void => {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
};

/** Markiert einen pending Open-Wunsch (überlebt Mount-Race der Bubble). */
export const markClaraOpenPending = (ctx: ClaraInquiryContext): void => {
  try {
    sessionStorage.setItem(PENDING_OPEN_KEY, JSON.stringify({ ctx, ts: Date.now() }));
  } catch { /* ignore */ }
};

/** Liefert pending Kontext (falls jung genug) und löscht den Flag. */
export const consumeClaraOpenPending = (): ClaraInquiryContext | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_OPEN_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_OPEN_KEY);
    const parsed = JSON.parse(raw) as { ctx: ClaraInquiryContext; ts: number };
    if (!parsed?.ts || Date.now() - parsed.ts > PENDING_OPEN_MAX_AGE_MS) return null;
    return parsed.ctx ?? null;
  } catch { return null; }
};

/** Baut einen mailto-Link mit Kontext als Betreff (Direktanfrage an Reservierung) */
export const buildInquiryHref = (ctx: ClaraInquiryContext): string => {
  const subjectParts = [ctx.topic, ctx.room].filter(Boolean).join(" – ");
  const subject = subjectParts || "Anfrage über die Webseite";
  const bodyLines = [
    ctx.topic ? `Thema: ${ctx.topic}` : "",
    ctx.room ? `Raum: ${ctx.room}` : "",
    ctx.source ? `Quelle: ${ctx.source}` : "",
    ctx.details && ctx.details.length ? `Details: ${ctx.details.filter(Boolean).join(", ")}` : "",
    "",
    "Bitte ergänzen Sie hier Ihre Anfrage (gewünschtes Datum, Personenzahl, weitere Wünsche):",
    "",
  ].filter((l) => l !== undefined);
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", bodyLines.join("\n"));
  return `mailto:reservierung@der-heidehof.de?${params.toString()}`;
};

/** Öffnet den vorgefertigten Anfrage-mailto-Link */
export const openInquiryMail = (ctx: ClaraInquiryContext): void => {
  if (typeof window !== "undefined") {
    window.location.href = buildInquiryHref(ctx);
  }
};
