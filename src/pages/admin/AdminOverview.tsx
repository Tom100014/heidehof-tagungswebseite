import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarDays, Utensils, ShoppingBag, Sparkles, AlertTriangle,
  BookOpenCheck, MessageCircle, MailWarning, Activity,
  Inbox, RefreshCw, Archive, Trash2, CheckCircle, Clock, Users,
  ChefHat, Fish, Beef, Leaf, Search, Check, Loader2, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminSecurity, type AdminRole } from "@/utils/admin-security";

// Unified request type
interface UnifiedRequest {
  id: string;
  sourceTable: 'tagungs_inquiries' | 'conference_orders' | 'room_orders' | 'restaurant_orders' | 'complaints' | 'clara_conversations';
  created_at: string;
  read_at: string | null;
  type: string;
  colorKey: 'blue' | 'orange' | 'amber' | 'red' | 'pink' | 'green' | 'indigo' | 'zinc';
  title: string;
  subtitle: string;
  meta: string;
  status?: string;
  raw: any;
}

const itemsLabel = (items: unknown): string => {
  if (Array.isArray(items)) {
    return items.map((i: { quantity?: number; name?: string; notes?: string }) =>
      `${i.quantity ?? 1}× ${i.name ?? "?"}${i.notes ? ` (${i.notes})` : ""}`).join(", ");
  }
  if (typeof items === "string") return items;
  return "";
};

const orderCategoryLabel = (category: unknown): string => {
  if (category === "bar_max") return "Bar Mäx";
  if (category === "fine_dining") return "Fine Dining";
  if (category === "room_service") return "Zimmerservice";
  if (category === "shop") return "Shop";
  if (category === "reservation") return "Tischreservierung";
  return "Essen & Getränke";
};

const CATEGORY_LABELS: Record<string, string> = {
  fine_dining: "Fine Dining",
  bar_max: "Bar Mäx",
  reservation: "Tischreservierung",
  shop: "Shop-Bestellung",
  room_service: "Zimmer-Service",
  room_issue: "Zimmer-Problem",
  missing_item: "Fehlender Artikel",
  complaint: "Beschwerde",
  beauty: "Beauty & Wellness",
};

const MEAL_LABELS: Record<string, string> = {
  lunch: "Mittag",
  dinner: "Abend",
};

const URGENCY_LABELS: Record<string, string> = {
  high: "Sofort / dringend",
  medium: "Heute",
  normal: "Normal",
  sofort: "Sofort / dringend",
  heute: "Heute",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asText = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value, null, 2);
};

const formatGermanDate = (value: unknown): string => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return format(date, "dd.MM.yyyy", { locale: de });
};

const formatGermanTime = (value: unknown): string => {
  if (!value) return "-";
  const text = String(value);
  if (/^\d{1,2}:\d{2}$/.test(text)) return `${text} Uhr`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return `${format(date, "HH:mm", { locale: de })} Uhr`;
};

const formatCategory = (value: unknown): string => {
  const key = String(value ?? "");
  return (CATEGORY_LABELS[key] ?? key) || "-";
};

const formatMeal = (value: unknown): string => {
  const key = String(value ?? "");
  return (MEAL_LABELS[key] ?? key) || "-";
};

const formatUrgency = (value: unknown): string => {
  const key = String(value ?? "");
  return (URGENCY_LABELS[key] ?? key) || "-";
};

const SOURCE_LABELS: Record<UnifiedRequest["sourceTable"], string> = {
  tagungs_inquiries: "Tagungsanfragen",
  conference_orders: "Küchenaufträge Tagung",
  room_orders: "Zimmer-Service",
  restaurant_orders: "Essen & Getränke",
  complaints: "Service & Beschwerden",
  clara_conversations: "Clara-Gespräche",
};

const formatSource = (source: UnifiedRequest["sourceTable"] | undefined): string =>
  source ? SOURCE_LABELS[source] ?? source : "-";

const formatItems = (items: unknown): string => {
  if (!Array.isArray(items) || items.length === 0) return "-";
  return items.map((item) => {
    if (!isRecord(item)) return asText(item);
    const qty = item.quantity ?? item.qty ?? 1;
    const name = item.name ?? item.title ?? item.dish_type ?? "Position";
    const notes = item.notes ? ` (${String(item.notes)})` : "";
    return `${qty}× ${name}${notes}`;
  }).join("\n");
};

const formatTranscript = (transcript: unknown): string => {
  if (!Array.isArray(transcript) || transcript.length === 0) return "-";
  return transcript
    .map((entry) => {
      if (!isRecord(entry)) return asText(entry);
      const role = String(entry.role ?? "gast").toLowerCase().includes("assistant") ? "Clara" : "Gast";
      const content = String(entry.content ?? "").trim();
      return content ? `${role}: ${content}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
};

type DetailLine = { label: string; value: unknown; kind?: "date" | "time" | "items" | "category" | "meal" | "urgency" | "transcript" };
type DetailSection = { title: string; lines: DetailLine[] };

const renderDetailValue = (line: DetailLine): string => {
  if (line.kind === "date") return formatGermanDate(line.value);
  if (line.kind === "time") return formatGermanTime(line.value);
  if (line.kind === "items") return formatItems(line.value);
  if (line.kind === "category") return formatCategory(line.value);
  if (line.kind === "meal") return formatMeal(line.value);
  if (line.kind === "urgency") return formatUrgency(line.value);
  if (line.kind === "transcript") return formatTranscript(line.value);
  return asText(line.value);
};

const LABELS: Record<string, string> = {
  guest_type: "Gast-Typ",
  table_or_room: "Tisch/Zimmer",
  room_number: "Zimmernummer",
  items: "Bestellung",
  status: "Status",
  source: "Quelle",
  created_at: "Eingang",
  category: "Kategorie",
  guest_name: "Name des Gastes",
  company: "Firma",
  email: "E-Mail",
  notes: "Notizen",
  participants: "Personen",
  service_date: "Datum",
  meal_type: "Mahlzeit",
  urgency: "Dringlichkeit",
  description: "Beschreibung",
  contact: "Kontakt",
  room_or_table: "Ort",
  personen: "Personen",
  datum: "Anreisedatum",
  dauer: "Dauer",
  anlass: "Anlass",
  uebernachtung: "Übernachtung",
  verpflegung: "Verpflegung",
  technik: "Technik",
  raumvorschlag: "Raum",
  pauschalvorschlag: "Pauschale",
  besonderheiten: "Besonderheiten",
  zusammenfassung: "Zusammenfassung",
  anfrage_text: "Original Text",
  email_sent: "E-Mail Versand",
  email_error: "E-Mail Fehler",
};

const buildDetailSections = (table: string, r: any): DetailSection[] => {
  if (table === "restaurant_orders") {
    if (r.category === "reservation") {
      return [
        { title: "Einordnung", lines: [
          { label: "Schublade", value: r.category, kind: "category" },
          { label: "Datum", value: r.created_at, kind: "date" },
          { label: "Uhrzeit", value: r.created_at, kind: "time" },
          { label: "Status", value: r.status },
        ] },
        { title: "Reservierung", lines: [
          { label: "Name", value: r.guest_name },
          { label: "Kontakt", value: r.table_or_room },
          { label: "Details", value: r.notes },
        ] },
        { title: "Antwort an Gast", lines: [
          { label: "Entwurf", value: r.prepared_reply },
        ] },
      ];
    }

    if (r.category === "shop") {
      return [
        { title: "Einordnung", lines: [
          { label: "Schublade", value: r.category, kind: "category" },
          { label: "Datum", value: r.created_at, kind: "date" },
          { label: "Uhrzeit", value: r.created_at, kind: "time" },
          { label: "Status", value: r.status },
        ] },
        { title: "Gast & Kontakt", lines: [
          { label: "Name", value: r.guest_name },
          { label: "Gast-Typ", value: r.guest_type },
          { label: "Kontakt / Lieferort", value: r.table_or_room },
        ] },
        { title: "Shop-Bestellung", lines: [
          { label: "Positionen", value: r.items, kind: "items" },
          { label: "Sonderwünsche", value: r.notes },
        ] },
        { title: "Antwort an Gast", lines: [
          { label: "Entwurf", value: r.prepared_reply },
        ] },
      ];
    }

    return [
      { title: "Einordnung", lines: [
        { label: "Schublade", value: r.category, kind: "category" },
        { label: "Datum", value: r.created_at, kind: "date" },
        { label: "Uhrzeit", value: r.created_at, kind: "time" },
        { label: "Status", value: r.status },
      ] },
      { title: "Gast & Ort", lines: [
        { label: "Name", value: r.guest_name },
        { label: "Gast-Typ", value: r.guest_type },
        { label: "Tisch / Raum / Kontakt", value: r.table_or_room },
      ] },
      { title: "Essen & Getränke", lines: [
        { label: "Positionen", value: r.items, kind: "items" },
        { label: "Sonderwünsche / Allergien", value: r.notes },
      ] },
      { title: "Antwort an Gast", lines: [
        { label: "Entwurf", value: r.prepared_reply },
      ] },
    ];
  }

  if (table === "room_orders") {
    return [
      { title: "Einordnung", lines: [
        { label: "Schublade", value: r.category ?? "room_service", kind: "category" },
        { label: "Datum", value: r.created_at, kind: "date" },
        { label: "Uhrzeit", value: r.created_at, kind: "time" },
        { label: "Status", value: r.status },
      ] },
      { title: "Gast & Zimmer", lines: [
        { label: "Name", value: r.guest_name },
        { label: "Zimmernummer", value: r.room_number },
      ] },
      { title: "Bestellung", lines: [
        { label: "Positionen", value: r.items, kind: "items" },
        { label: "Sonderwünsche / Allergien", value: r.notes },
      ] },
      { title: "Antwort an Gast", lines: [
        { label: "Entwurf", value: r.prepared_reply },
      ] },
    ];
  }

  if (table === "complaints") {
    return [
      { title: "Einordnung", lines: [
        { label: "Schublade", value: r.category, kind: "category" },
        { label: "Priorität", value: r.urgency, kind: "urgency" },
        { label: "Datum", value: r.created_at, kind: "date" },
        { label: "Uhrzeit", value: r.created_at, kind: "time" },
        { label: "Status", value: r.status },
      ] },
      { title: "Gast & Ort", lines: [
        { label: "Name", value: r.guest_name },
        { label: "Gast-Typ", value: r.guest_type },
        { label: "Zimmer / Tisch / Bereich", value: r.room_or_table },
        { label: "Kontakt", value: r.contact },
      ] },
      { title: "Anliegen", lines: [
        { label: "Beschreibung", value: r.description },
      ] },
    ];
  }

  if (table === "clara_conversations") {
    return [
      { title: "Einordnung", lines: [
        { label: "Datum", value: r.created_at, kind: "date" },
        { label: "Uhrzeit", value: r.created_at, kind: "time" },
        { label: "Status", value: r.inquiry_sent ? "Anfrage gesendet" : "Offen" },
        { label: "Session", value: r.session_id },
      ] },
      { title: "Erkannte Daten", lines: [
        { label: "Auswertung", value: r.extracted },
      ] },
      { title: "Gespräch", lines: [
        { label: "Verlauf", value: r.transcript, kind: "transcript" },
      ] },
    ];
  }

  if (table === "conference_orders") {
    return [
      { title: "Zeit & Ort", lines: [
        { label: "Servicedatum", value: r.service_date, kind: "date" },
        { label: "Mahlzeit", value: r.meal_type, kind: "meal" },
        { label: "Eingang", value: r.created_at, kind: "time" },
      ] },
      { title: "Gast & Gruppe", lines: [
        { label: "Name", value: r.guest_name },
        { label: "Firma", value: r.company },
        { label: "Personen", value: r.participants },
        { label: "E-Mail", value: r.email },
      ] },
      { title: "Küche", lines: [
        { label: "Sonderwünsche / Allergien", value: r.notes },
        { label: "Status", value: r.status },
      ] },
    ];
  }

  if (table === "tagungs_inquiries") {
    return [
      { title: "Veranstaltungs-Eckdaten", lines: [
        { label: "Datum", value: r.datum },
        { label: "Anlass", value: r.anlass },
        { label: "Personen", value: r.personen },
        { label: "Dauer", value: r.dauer },
      ] },
      { title: "Leistungen & Wünsche", lines: [
        { label: "Übernachtung", value: r.uebernachtung },
        { label: "Verpflegung", value: r.verpflegung },
        { label: "Technik", value: r.technik },
        { label: "Besonderheiten", value: r.besonderheiten },
      ] },
      { title: "Veranstalter & Kontakt", lines: [
        { label: "Name", value: r.name },
        { label: "Firma", value: r.firma },
        { label: "E-Mail", value: r.email },
        { label: "Telefon", value: r.telefon },
      ] },
      { title: "System & Status", lines: [
        { label: "Eingangsdatum", value: r.created_at, kind: "date" },
        { label: "Status", value: r.status },
        { label: "E-Mail Versand", value: r.email_sent ? "Erfolgreich" : "Ausstehend" },
        { label: "E-Mail Fehler", value: r.email_error },
      ] }
    ];
  }

  return [{
    title: "Details",
    lines: Object.entries(r)
      .filter(([k, v]) => v !== null && v !== "" && k !== "id" && !k.startsWith("_") && k !== "read_at")
      .map(([k, value]) => ({
        label: LABELS[k] || k,
        value,
        kind: k === "items" ? "items" : k === "created_at" || k.includes("date") || k === "datum" ? "date" : undefined,
      })),
  }];
};

const colorStyles: Record<UnifiedRequest['colorKey'], { border: string; bg: string; badge: string; text: string; label: string }> = {
  blue: {
    border: "border-l-[6px] border-l-blue-500 hover:border-l-blue-400 border-border",
    bg: "bg-blue-500/8 hover:bg-blue-500/12",
    badge: "bg-blue-500/15 text-blue-200 border-blue-400/35",
    text: "text-blue-300",
    label: "Essen & Trinken"
  },
  orange: {
    border: "border-l-[6px] border-l-orange-500 hover:border-l-orange-400 border-border",
    bg: "bg-orange-500/8 hover:bg-orange-500/12",
    badge: "bg-orange-500/15 text-orange-200 border-orange-400/35",
    text: "text-orange-300",
    label: "Tagungs-Menü"
  },
  amber: {
    border: "border-l-[6px] border-l-amber-500 hover:border-l-amber-400 border-border",
    bg: "bg-amber-500/8 hover:bg-amber-500/12",
    badge: "bg-amber-500/15 text-amber-200 border-amber-400/35",
    text: "text-amber-300",
    label: "Seminar-Anfrage (Lead)"
  },
  red: {
    border: "border-l-[6px] border-l-rose-500 hover:border-l-rose-400 border-border",
    bg: "bg-rose-500/8 hover:bg-rose-500/12",
    badge: "bg-rose-500/15 text-rose-200 border-rose-400/35",
    text: "text-rose-300",
    label: "Beschwerde / Problem"
  },
  pink: {
    border: "border-l-[6px] border-l-pink-500 hover:border-l-pink-400 border-border",
    bg: "bg-pink-500/8 hover:bg-pink-500/12",
    badge: "bg-pink-500/15 text-pink-200 border-pink-400/35",
    text: "text-pink-300",
    label: "Wellness & Spa"
  },
  green: {
    border: "border-l-[6px] border-l-emerald-500 hover:border-l-emerald-400 border-border",
    bg: "bg-emerald-500/8 hover:bg-emerald-500/12",
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-400/35",
    text: "text-emerald-300",
    label: "Tischreservierung"
  },
  indigo: {
    border: "border-l-[6px] border-l-indigo-500 hover:border-l-indigo-400 border-border",
    bg: "bg-indigo-500/8 hover:bg-indigo-500/12",
    badge: "bg-indigo-500/15 text-indigo-200 border-indigo-400/35",
    text: "text-indigo-300",
    label: "Shop-Bestellung"
  },
  zinc: {
    border: "border-l-[6px] border-l-zinc-400 dark:border-l-zinc-600 hover:border-l-zinc-300 border-border",
    bg: "bg-zinc-500/8 hover:bg-zinc-500/12",
    badge: "bg-zinc-500/15 text-zinc-200 border-zinc-400/35",
    text: "text-zinc-300",
    label: "Gesprächsverlauf"
  }
};

const KITCHEN_STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  new:        { label: "Neu",            cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200", icon: Clock },
  confirmed:  { label: "Bestätigt",      cls: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-200", icon: CheckCircle },
  in_kitchen: { label: "In der Küche",   cls: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200", icon: ChefHat },
  completed:  { label: "Geliefert",      cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200", icon: CheckCircle },
  cancelled:  { label: "Storniert",      cls: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200", icon: AlertTriangle },
};

const CLOSED_STATUSES = new Set(["completed", "cancelled", "served", "archived", "gewonnen", "abgesagt"]);
const LIVE_WINDOW_DAYS = 14;
const LEAD_WINDOW_DAYS = 30;

const isToday = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
};

const ageInDays = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
};

const normalizeLiveText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const isMeaningfulText = (value: unknown) => {
  const text = normalizeLiveText(value);
  if (!text || text === "-" || text === "—") return false;
  return !["anonym", "anonyme anfrage", "unbekannt", "gast", "test", "n/a"].includes(text);
};

const parseBusinessDate = (value: unknown): Date | null => {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const german = text.match(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})\b/);
  if (german) {
    const year = Number(german[3].length === 2 ? `20${german[3]}` : german[3]);
    return new Date(year, Number(german[2]) - 1, Number(german[1]));
  }

  return null;
};

const extractBusinessDate = (raw: any): Date | null => {
  const direct = [
    raw?.service_date,
    raw?.appointment_date,
    raw?.appointmentDate,
    raw?.reservation_date,
    raw?.datum,
    raw?.date,
  ].map(parseBusinessDate).find(Boolean);
  if (direct) return direct;

  const description = String(raw?.description ?? raw?.notes ?? raw?.anfrage_text ?? "");
  return parseBusinessDate(description);
};

const isPastBusinessDate = (raw: any) => {
  const businessDate = extractBusinessDate(raw);
  if (!businessDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  businessDate.setHours(0, 0, 0, 0);
  return businessDate < today;
};

const hasActionableLeadData = (raw: any) => {
  const hasContact =
    isMeaningfulText(raw?.email) ||
    isMeaningfulText(raw?.telefon) ||
    isMeaningfulText(raw?.name) ||
    isMeaningfulText(raw?.firma);
  const hasNeed =
    isMeaningfulText(raw?.anlass) ||
    isMeaningfulText(raw?.personen) ||
    isMeaningfulText(raw?.datum) ||
    isMeaningfulText(raw?.anfrage_text) ||
    isMeaningfulText(raw?.zusammenfassung);
  return hasContact && hasNeed;
};

const isOpenRequest = (request: UnifiedRequest) => {
  if (request.sourceTable === "clara_conversations") return false;
  return !CLOSED_STATUSES.has(String(request.status ?? "new").toLowerCase());
};

const isArchivedLike = (request: UnifiedRequest) =>
  Boolean(request.raw?.archived_at || request.raw?.archived || request.raw?.is_archived);

const isLiveDashboardRequest = (request: UnifiedRequest) => {
  if (isArchivedLike(request)) return false;

  if (request.sourceTable === "clara_conversations") {
    return !request.raw?.inquiry_sent && isToday(request.created_at);
  }

  if (!isOpenRequest(request)) return false;
  if (isPastBusinessDate(request.raw)) return false;

  if (request.sourceTable === "tagungs_inquiries") {
    return hasActionableLeadData(request.raw) && ageInDays(request.created_at) <= LEAD_WINDOW_DAYS;
  }

  return isToday(request.created_at) || ageInDays(request.created_at) <= LIVE_WINDOW_DAYS;
};

const countLiveEmailErrors = (list: UnifiedRequest[]) =>
  list.filter((request) =>
    request.sourceTable === "tagungs_inquiries" &&
    request.raw?.email_sent === false &&
    request.raw?.email_error
  ).length;

type DishCounts = { fish: number; meat: number; vegetarian: number; unknown: number };
type KitchenProductionRow = DishCounts & {
  order: UnifiedRequest;
  room: string;
  company: string;
  guestName: string;
  participants: number;
  selected: number;
};

type OverviewTab = "ticker" | "service" | "kitchen" | "leads";

const classifyDishType = (item: any): keyof DishCounts => {
  const text = normalizeLiveText(`${item?.dish_type ?? ""} ${item?.category ?? ""} ${item?.name ?? ""} ${item?.title ?? ""}`);
  if (/(fish|fisch|lachs|zander|forelle|seafood)/.test(text)) return "fish";
  if (/(vegetarian|vegetarisch|veggie|vegan|gemüse|leaf)/.test(text)) return "vegetarian";
  if (/(meat|fleisch|beef|rind|huhn|chicken|schwein|pork|kalb|ente)/.test(text)) return "meat";
  return "unknown";
};

const getDishCounts = (items: unknown): DishCounts => {
  const counts: DishCounts = { fish: 0, meat: 0, vegetarian: 0, unknown: 0 };
  if (!Array.isArray(items)) return counts;
  items.forEach((item: any) => {
    const qty = Number(item?.quantity ?? item?.qty ?? 1) || 0;
    counts[classifyDishType(item)] += qty;
  });
  return counts;
};

const AdminOverview = ({ initialTab = "ticker" }: { initialTab?: OverviewTab }) => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [activeTab, setActiveTab] = useState<OverviewTab>(initialTab);
  const [roles, setRoles] = useState<AdminRole[]>(["admin"]);
  const [filterDept, setFilterDept] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // detail view & deletions state
  const [detail, setDetail] = useState<UnifiedRequest | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'archive'; row?: UnifiedRequest } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    adminSecurity.getRoles().then((nextRoles) => {
      if (mounted && nextRoles.length > 0) setRoles(nextRoles);
    });
    return () => { mounted = false; };
  }, []);

  const canSeeAllTabs = roles.some((role) => role === "admin" || role === "director");
  const allowedTabs = useMemo<OverviewTab[]>(() => {
    if (canSeeAllTabs) return ["ticker", "service", "kitchen", "leads"];
    const tabs: OverviewTab[] = [];
    if (roles.includes("service")) tabs.push("service");
    if (roles.includes("kitchen")) tabs.push("kitchen");
    if (roles.includes("conference")) tabs.push("leads");
    return tabs.length ? tabs : ["ticker"];
  }, [canSeeAllTabs, roles]);

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) setActiveTab(allowedTabs[0]);
  }, [activeTab, allowedTabs]);

  const showTab = (tab: OverviewTab) => allowedTabs.includes(tab);

  const loadAllData = useCallback(async () => {
    try {
      const [
        { data: rOrders },
        { data: rmOrders },
        { data: tInquiries },
        { data: cOrders },
        { data: complaints },
        { data: conversations },
        { data: rooms }
      ] = await Promise.all([
        supabase.from("restaurant_orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("room_orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("tagungs_inquiries").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("conference_orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("clara_conversations").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("conference_rooms").select("id, name")
      ]);

      const roomMap = new Map((rooms || []).map((r: any) => [r.id, r.name]));

      // Load conference order items (for kitchen metrics)
      const { data: cOrderItems } = await supabase.from("conference_order_items").select("*");
      const cItemsMap = new Map<string, any[]>();
      (cOrderItems || []).forEach((it: any) => {
        const arr = cItemsMap.get(it.order_id) || [];
        arr.push(it);
        cItemsMap.set(it.order_id, arr);
      });

      const list: UnifiedRequest[] = [];

      // 1. Restaurant Orders
      (rOrders || []).forEach((r: any) => {
        let colorKey: UnifiedRequest['colorKey'] = "blue";
        if (r.category === "reservation") colorKey = "green";
        else if (r.category === "shop") colorKey = "indigo";

        list.push({
          id: r.id,
          sourceTable: "restaurant_orders",
          created_at: r.created_at,
          read_at: r.read_at ?? null,
          type: r.category,
          colorKey,
          title: r.category === "reservation" ? (r.guest_name || "Reservierung")
                 : r.category === "shop" ? (r.guest_name || "Shop-Kunde")
                 : `${orderCategoryLabel(r.category)} · ${r.guest_name || "Gast"}`,
          subtitle: r.category === "reservation" ? (r.notes || "Tischreservierung")
                    : r.category === "shop" ? itemsLabel(r.items)
                    : [itemsLabel(r.items), r.notes].filter(Boolean).join(" · "),
          meta: r.table_or_room || "",
          status: r.status,
          raw: { ...r, room_name: r.table_or_room }
        });
      });

      // 2. Room Orders
      (rmOrders || []).forEach((r: any) => {
        list.push({
          id: r.id,
          sourceTable: "room_orders",
          created_at: r.created_at,
          read_at: r.read_at ?? null,
          type: "room_order",
          colorKey: "blue",
          title: r.guest_name || `Zimmer ${r.room_number}`,
          subtitle: itemsLabel(r.items),
          meta: `Zi. ${r.room_number}`,
          status: r.status,
          raw: { ...r, room_name: `Zimmer ${r.room_number}` }
        });
      });

      // 3. Seminar Leads
      (tInquiries || []).forEach((r: any) => {
        list.push({
          id: r.id,
          sourceTable: "tagungs_inquiries",
          created_at: r.created_at,
          read_at: r.read_at ?? null,
          type: "lead",
          colorKey: "amber",
          title: r.name || r.firma || "Anonyme Anfrage",
          subtitle: [r.anlass, r.personen && `${r.personen} Pers.`, r.datum].filter(Boolean).join(" · "),
          meta: r.email || "",
          status: r.status,
          raw: r
        });
      });

      // 4. Conference/Kitchen Orders
      (cOrders || []).forEach((r: any) => {
        const orderItems = cItemsMap.get(r.id) || [];
        const roomName = roomMap.get(r.room_id) || "Tagungsraum";
        list.push({
          id: r.id,
          sourceTable: "conference_orders",
          created_at: r.created_at,
          read_at: r.read_at ?? null,
          type: "conference_order",
          colorKey: "orange",
          title: r.guest_name || r.company || "Tagungs-Bestellung",
          subtitle: [r.company, r.meal_type === "lunch" ? "Mittagsmenü" : "Abendmenü", `${r.participants ?? 1} Pers.`, roomName].filter(Boolean).join(" · "),
          meta: r.service_date || "",
          status: r.status,
          raw: { ...r, room_name: roomName, items: orderItems }
        });
      });

      // 5. Complaints/Wellness
      (complaints || []).forEach((r: any) => {
        let colorKey: UnifiedRequest['colorKey'] = "red";
        if (r.category === "beauty") colorKey = "pink";
        else if (r.category === "missing_item") colorKey = "amber";

        list.push({
          id: r.id,
          sourceTable: "complaints",
          created_at: r.created_at,
          read_at: r.read_at ?? null,
          type: r.category,
          colorKey,
          title: r.category === "beauty" ? (r.guest_name || "Beauty-Anfrage")
                 : r.category === "room_issue" ? (r.description || "Zimmer-Problem")
                 : r.category === "missing_item" ? (r.description || "Fehlender Artikel")
                 : (r.guest_name || "Beschwerde"),
          subtitle: r.category === "beauty" ? (r.description || "")
                    : r.category === "room_issue" ? (r.guest_name || "")
                    : r.category === "missing_item" ? (r.guest_name || "")
                    : (r.description || ""),
          meta: r.urgency === "high" ? "DRINGEND" : r.room_or_table || "",
          status: r.status,
          raw: r
        });
      });

      // 6. Clara Conversations
      (conversations || []).forEach((r: any) => {
        const transcript = r.transcript as Array<{ role?: string; content?: string }> | undefined;
        const last = Array.isArray(transcript) && transcript.length ? transcript[transcript.length - 1] : null;
        list.push({
          id: r.id,
          sourceTable: "clara_conversations",
          created_at: r.created_at,
          read_at: null,
          type: "clara_conversation",
          colorKey: "zinc",
          title: r.inquiry_sent ? "Anfrage übermittelt" : "Offenes Gespräch",
          subtitle: last?.content?.slice(0, 80) ?? "",
          meta: `${Array.isArray(transcript) ? transcript.length : 0} Turns`,
          raw: r
        });
      });

      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const liveList = list.filter(isLiveDashboardRequest);
      setRequests(liveList);
    } catch (e) {
      console.error("Error loading dashboard data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();

    // Setup realtime channel subscriptions for dynamic updates
    const chRestaurant = supabase.channel("realtime-dashboard-restaurant_orders").on("postgres_changes", { event: "*", schema: "public", table: "restaurant_orders" }, () => loadAllData()).subscribe();
    const chRoom = supabase.channel("realtime-dashboard-room_orders").on("postgres_changes", { event: "*", schema: "public", table: "room_orders" }, () => loadAllData()).subscribe();
    const chLeads = supabase.channel("realtime-dashboard-tagungs_inquiries").on("postgres_changes", { event: "*", schema: "public", table: "tagungs_inquiries" }, () => loadAllData()).subscribe();
    const chKitchen = supabase.channel("realtime-dashboard-conference_orders").on("postgres_changes", { event: "*", schema: "public", table: "conference_orders" }, () => loadAllData()).subscribe();
    const chComplaints = supabase.channel("realtime-dashboard-complaints").on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => loadAllData()).subscribe();
    const chChats = supabase.channel("realtime-dashboard-clara_conversations").on("postgres_changes", { event: "*", schema: "public", table: "clara_conversations" }, () => loadAllData()).subscribe();

    return () => {
      supabase.removeChannel(chRestaurant);
      supabase.removeChannel(chRoom);
      supabase.removeChannel(chLeads);
      supabase.removeChannel(chKitchen);
      supabase.removeChannel(chComplaints);
      supabase.removeChannel(chChats);
    };
  }, [loadAllData]);

  // Bulk / action helper calls
  const archive = useCallback(async (table: string, ids: string[]) => {
    if (!ids.length) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("archive-request", {
        body: { source_table: table, ids },
      });
      if (error) throw error;
      setRequests(prev => prev.filter(r => !(r.sourceTable === table && ids.includes(r.id))));
      toast.success(`${ids.length} Eintrag/Einträge archiviert`);
    } catch (e) {
      console.error(e);
      toast.error("Archivierung fehlgeschlagen");
    } finally {
      setBusy(false);
      setDetail(null);
      setConfirm(null);
    }
  }, []);

  const remove = useCallback(async (table: string, ids: string[]) => {
    if (!ids.length) return;
    setBusy(true);
    const { error } = await supabase.from(table as never).delete().in("id", ids);
    setBusy(false);
    if (error) { toast.error("Löschen fehlgeschlagen: " + error.message); return; }
    setRequests(prev => prev.filter(r => !(r.sourceTable === table && ids.includes(r.id))));
    toast.success(`${ids.length} Eintrag/Einträge gelöscht`);
    setDetail(null);
    setConfirm(null);
  }, []);

  const updateStatus = async (table: string, id: string, newStatus: string) => {
    setBusy(true);
    const { error } = await supabase.from(table as never).update({ status: newStatus } as never).eq("id", id as never);
    setBusy(false);
    if (error) {
      toast.error("Status konnte nicht geändert werden");
    } else {
      toast.success("Status aktualisiert");
      setRequests(prev => prev
        .map(r => r.sourceTable === table && r.id === id ? { ...r, status: newStatus, raw: { ...r.raw, status: newStatus } } : r)
        .filter(isLiveDashboardRequest)
      );
      if (detail && detail.id === id) {
        setDetail(prev => prev ? { ...prev, status: newStatus, raw: { ...prev.raw, status: newStatus } } : null);
      }
    }
  };

  // Filter lists based on tab + filter chips
  const filteredTicker = useMemo(() => {
    return requests.filter((r) => {
      const query = searchTerm.toLowerCase();
      const textMatch = !query ||
        r.title.toLowerCase().includes(query) ||
        r.subtitle.toLowerCase().includes(query) ||
        r.meta.toLowerCase().includes(query);

      if (!textMatch) return false;

      if (filterDept === 'all') return true;
      if (filterDept === 'food_drinks') return r.colorKey === 'blue';
      if (filterDept === 'leads') return r.sourceTable === 'tagungs_inquiries';
      if (filterDept === 'conference_menu') return r.sourceTable === 'conference_orders';
      if (filterDept === 'reservations') return r.type === 'reservation';
      if (filterDept === 'complaints') return r.colorKey === 'red' || r.type === 'missing_item';
      if (filterDept === 'wellness') return r.type === 'beauty';
      if (filterDept === 'shop') return r.type === 'shop';
      if (filterDept === 'chats') return r.sourceTable === 'clara_conversations';

      return true;
    });
  }, [requests, filterDept, searchTerm]);

  // Tab 2: Kitchen only
  const kitchenOrders = useMemo(() => {
    return requests.filter(r => r.sourceTable === 'conference_orders');
  }, [requests]);

  const serviceOrders = useMemo(() => {
    return requests.filter(r =>
      r.sourceTable === "restaurant_orders" ||
      r.sourceTable === "room_orders" ||
      r.sourceTable === "complaints"
    );
  }, [requests]);

  const kitchenProduction = useMemo(() => {
    const rows: KitchenProductionRow[] = kitchenOrders.map((order) => {
      const counts = getDishCounts(order.raw?.items);
      const participants = Number(order.raw?.participants ?? 0) || 0;
      const selected = counts.fish + counts.meat + counts.vegetarian + counts.unknown;
      return {
        order,
        room: order.raw?.room_name || "Tagungsraum",
        company: order.raw?.company || "Firma offen",
        guestName: order.raw?.guest_name || "Ansprechpartner offen",
        participants,
        selected,
        ...counts,
      };
    });

    const totals = rows.reduce(
      (sum, row) => ({
        rooms: sum.rooms + 1,
        participants: sum.participants + row.participants,
        fish: sum.fish + row.fish,
        meat: sum.meat + row.meat,
        vegetarian: sum.vegetarian + row.vegetarian,
        unknown: sum.unknown + row.unknown + Math.max(row.participants - row.selected, 0),
      }),
      { rooms: 0, participants: 0, fish: 0, meat: 0, vegetarian: 0, unknown: 0 },
    );

    return { rows, totals };
  }, [kitchenOrders]);

  // Tab 3: Leads only
  const leadsList = useMemo(() => {
    return requests.filter(r => r.sourceTable === 'tagungs_inquiries');
  }, [requests]);

  const stats = useMemo(() => {
    const today = requests.filter(r => isToday(r.created_at));
    const open = requests.filter(isOpenRequest);
    const urgent = requests.filter(r =>
      r.colorKey === "red" ||
      String(r.raw?.urgency ?? "").toLowerCase() === "high" ||
      String(r.meta ?? "").toLowerCase().includes("dringend"),
    );
    return {
      all: requests.length,
      today: today.length,
      open: open.length,
      urgent: urgent.length,
      blue: requests.filter(r => r.colorKey === 'blue').length,
      orange: requests.filter(r => r.colorKey === 'orange').length,
      amber: requests.filter(r => r.colorKey === 'amber').length,
      red: requests.filter(r => r.colorKey === 'red').length,
      green: requests.filter(r => r.type === 'reservation').length,
      pink: requests.filter(r => r.type === 'beauty').length,
    };
  }, [requests]);

  const emailErrors = useMemo(() => countLiveEmailErrors(requests), [requests]);




  return (
    <HeidehofAdminLayout title="Zentrales Cockpit – Heidehof">
      <div className="admin-overview pb-10 space-y-5">
        
        {/* Email Warning Alert */}
        {emailErrors > 0 && (
          <div className="admin-alert-critical flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="w-10 h-10 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
              <MailWarning className="w-5 h-5 text-rose-300" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-rose-100">E-Mail-Versand bei aktuellen Leads prüfen</h3>
              <p className="text-xs text-rose-200/80 leading-normal">
                {emailErrors} aktuelle Anfrage(n) konnten nicht per E-Mail zugestellt werden.
                Bitte in den Einstellungen auf "Lovable Emails" umstellen oder die Domain-Verifikation prüfen.
              </p>
            </div>
            <a 
              href="/admin/einstellungen"
              className="w-full sm:w-auto px-4 py-2 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition-all text-center shadow-md active:scale-95 animate-pulse"
            >
              Einstellungen öffnen
            </a>
          </div>
        )}

        {/* Page-Header (slim, kontextspezifisch — die globale KPI-Übersicht liegt jetzt unter /admin) */}
        <AdminPageHeader
          title={
            activeTab === "service" ? "Service-Station" :
            activeTab === "leads"   ? "Tagungs-Anfragen" :
            activeTab === "kitchen" ? "Küchen-Produktion" :
                                      "Live-Vorgänge"
          }
          subtitle={
            activeTab === "service" ? "Komplette Kundenbestellungen aus Restaurant, Bar und Zimmer-Service in Echtzeit." :
            activeTab === "leads"   ? "Eingehende Tagungs- und Seminaranfragen mit Status und Zeitstempel." :
            activeTab === "kitchen" ? "Tagungsmenü-Aufträge mit Personenzahl und Gerichtsverteilung." :
                                      "Alle aktiven Vorgänge — nach Schublade gefiltert."
          }
          breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Live-Betrieb" }]}
        />


        {/* Tab Selection Navigation */}
        <div className="admin-tabs flex border-b border-border bg-card/40 p-1 rounded-2xl border max-w-4xl">
          {showTab("ticker") && <button
            onClick={() => setActiveTab('ticker')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all",
              activeTab === 'ticker' 
                ? "bg-[hsl(var(--apple)/0.86)] text-[hsl(var(--apple-foreground))] shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Inbox className="w-4 h-4" /> Live
          </button>}
          {showTab("service") && <button
            onClick={() => setActiveTab('service')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all",
              activeTab === 'service'
                ? "bg-[hsl(var(--apple)/0.86)] text-[hsl(var(--apple-foreground))] shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Utensils className="w-4 h-4" /> Service
          </button>}
          {showTab("kitchen") && <button
            onClick={() => setActiveTab('kitchen')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all",
              activeTab === 'kitchen' 
                ? "bg-[hsl(var(--apple)/0.86)] text-[hsl(var(--apple-foreground))] shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ChefHat className="w-4 h-4" /> Küche
          </button>}
          {showTab("leads") && <button
            onClick={() => setActiveTab('leads')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all",
              activeTab === 'leads' 
                ? "bg-[hsl(var(--apple)/0.86)] text-[hsl(var(--apple-foreground))] shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <CalendarDays className="w-4 h-4" /> Leads
          </button>}
        </div>

        {/* --- TAB CONTENT 1: LIVE INBOX --- */}
        {activeTab === 'ticker' && (
          <div className="space-y-4">
            {/* search and filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="In allen Kanälen suchen (Firma, Name, Ort, Speise) …" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="h-12 pl-10 rounded-xl"
                />
              </div>
              <button
                onClick={loadAllData}
                className="w-full md:w-auto px-4 py-2 bg-card border border-border text-foreground hover:bg-muted rounded-xl flex items-center justify-center gap-2 text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Aktualisieren
              </button>
            </div>

            {/* Department Filters */}
            <div className="flex flex-wrap gap-1.5 pb-2">
              <FilterChip label="Alle" value="all" current={filterDept} count={stats.all} onClick={setFilterDept} />
              <FilterChip label="Essen & Trinken" value="food_drinks" current={filterDept} count={stats.blue} color="bg-blue-500/15 text-blue-200 border-blue-400/35" onClick={setFilterDept} />
              <FilterChip label="Tagungs-Menüs" value="conference_menu" current={filterDept} count={stats.orange} color="bg-orange-500/15 text-orange-200 border-orange-400/35" onClick={setFilterDept} />
              <FilterChip label="Seminar-Anfragen" value="leads" current={filterDept} count={stats.amber} color="bg-amber-500/15 text-amber-200 border-amber-400/35" onClick={setFilterDept} />
              <FilterChip label="Tischreservierungen" value="reservations" current={filterDept} count={stats.green} color="bg-emerald-500/15 text-emerald-200 border-emerald-400/35" onClick={setFilterDept} />
              <FilterChip label="Beschwerden & Probleme" value="complaints" current={filterDept} count={stats.red} color="bg-rose-500/15 text-rose-200 border-rose-400/35" onClick={setFilterDept} />
              <FilterChip label="Wellness & Beauty" value="wellness" current={filterDept} count={stats.pink} color="bg-pink-500/15 text-pink-200 border-pink-400/35" onClick={setFilterDept} />
              <FilterChip label="Shop & Souvenirs" value="shop" current={filterDept} count={requests.filter(r => r.type === 'shop').length} color="bg-indigo-500/15 text-indigo-200 border-indigo-400/35" onClick={setFilterDept} />
              <FilterChip label="Clara-Chats" value="chats" current={filterDept} count={requests.filter(r => r.sourceTable === 'clara_conversations').length} color="bg-zinc-500/15 text-zinc-200 border-zinc-400/35" onClick={setFilterDept} />
            </div>

            {/* Live Ticker Feed */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredTicker.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-border border-dashed rounded-3xl p-16 text-center text-muted-foreground">
                <Inbox className="w-8 h-8 mb-2 opacity-30 text-muted-foreground" />
                <p className="font-semibold text-sm">Keine neuen Vorgänge</p>
                <p className="text-xs mt-1">Alte oder erledigte Einträge liegen sauber in Verlauf, Archiv und Analyse.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTicker.map((req) => {
                  const style = colorStyles[req.colorKey];
                  const IconComp = req.colorKey === 'blue' ? Utensils 
                    : req.colorKey === 'orange' ? ChefHat
                    : req.colorKey === 'amber' ? CalendarDays
                    : req.colorKey === 'red' ? AlertTriangle
                    : req.colorKey === 'pink' ? Sparkles
                    : req.colorKey === 'green' ? BookOpenCheck
                    : req.colorKey === 'indigo' ? ShoppingBag
                    : MessageCircle;

                  return (
                    <div
                      key={`${req.sourceTable}-${req.id}`}
                      onClick={() => setDetail(req)}
                      className={cn(
                        "rounded-2xl bg-card border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group",
                        style.border, style.bg
                      )}
                    >
                      <div className="p-4 space-y-2">
                        {/* header row */}
                        <div className="flex justify-between items-center">
                          <span className={cn("text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border", style.badge)}>
                            {style.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: de })}
                          </span>
                        </div>

                        {/* Title and details */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-[hsl(var(--apple))] transition-colors flex items-center gap-1.5">
                            <IconComp className={cn("w-4 h-4 shrink-0", style.text)} />
                            {req.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {req.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium flex items-center gap-1 text-[10px]">
                          {req.meta && `Ort: ${req.meta}`}
                        </span>
                        
                        <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirm({ kind: 'archive', row: req }); }}
                            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            title="Archivieren"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirm({ kind: 'delete', row: req }); }}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 dark:hover:bg-rose-950/40"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB CONTENT 2: SERVICE-STATION --- */}
        {activeTab === 'service' && (
          <div className="space-y-4">
            <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Service-Station</p>
                  <h3 className="text-lg font-bold text-foreground mt-1">Komplette Kundenbestellungen</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                    Der Service sieht immer den ganzen Vorgang des Gastes: Speisen, Getränke, Zimmer- oder Tischort, Sonderwünsche, Uhrzeit und Status. Bar und Küche können daraus eigene Produktionsansichten bekommen.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <KitchenTotal label="Offen" value={serviceOrders.length} />
                  <KitchenTotal label="Bestellungen" value={serviceOrders.filter((r) => r.sourceTable === "restaurant_orders" || r.sourceTable === "room_orders").length} tone="text-blue-200" />
                  <KitchenTotal label="Probleme" value={serviceOrders.filter((r) => r.sourceTable === "complaints").length} tone="text-rose-200" />
                </div>
              </div>

              {serviceOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                  <Utensils className="w-10 h-10 mb-2 opacity-30 text-[hsl(var(--apple))]" />
                  <p className="font-semibold text-sm">Keine neuen Kundenbestellungen</p>
                  <p className="text-xs mt-1">Restaurant, Bar, Zimmer-Service und Beschwerden sind aktuell sauber.</p>
                </div>
              ) : (
                <div className="grid xl:grid-cols-2 gap-4 p-4">
                  {serviceOrders.map((req) => (
                    <ServiceRow
                      key={`${req.sourceTable}-${req.id}`}
                      row={req}
                      onOpen={() => setDetail(req)}
                      onArchive={() => setConfirm({ kind: "archive", row: req })}
                      onDelete={() => setConfirm({ kind: "delete", row: req })}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* --- TAB CONTENT 3: KÜCHEN-MONITOR (TAGUNGSMENÜ) --- */}
        {activeTab === 'kitchen' && (
          <div className="space-y-6">
            <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Bankett-Produktion</p>
                  <h3 className="text-lg font-bold text-foreground mt-1">Küchenzettel nach Raum</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                    Für jeden Tagungsraum: Firma, Servicezeit, Personen und Hauptgang-Aufteilung. So sieht die Küche sofort, was wohin geliefert wird.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 min-w-0">
                  <KitchenTotal label="Räume" value={kitchenProduction.totals.rooms} />
                  <KitchenTotal label="Personen" value={kitchenProduction.totals.participants} />
                  <KitchenTotal label="Fisch" value={kitchenProduction.totals.fish} tone="text-sky-300" />
                  <KitchenTotal label="Fleisch" value={kitchenProduction.totals.meat} tone="text-rose-300" />
                  <KitchenTotal label="Vegetarisch" value={kitchenProduction.totals.vegetarian} tone="text-emerald-300" />
                </div>
              </div>

              {kitchenProduction.rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                  <ChefHat className="w-10 h-10 mb-2 opacity-30 text-[hsl(var(--apple))]" />
                  <p className="font-semibold text-sm">Keine Küchenbestellungen</p>
                  <p className="text-xs mt-1">Hier erscheinen nur offene Tagungsmenü-Belege für die Küche.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/70 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold border-b border-border">
                        <th className="p-4">Raum & Firma</th>
                        <th className="p-4">Service</th>
                        <th className="p-4 text-center">Personen</th>
                        <th className="p-4 text-center">Fisch</th>
                        <th className="p-4 text-center">Fleisch</th>
                        <th className="p-4 text-center">Vegetarisch</th>
                        <th className="p-4 text-center">Offen</th>
                        <th className="p-4">Sonderwünsche</th>
                        <th className="p-4 text-right">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {kitchenProduction.rows.map((row) => {
                        const meta = KITCHEN_STATUS_META[row.order.status || "new"] || KITCHEN_STATUS_META.new;
                        const StatusIcon = meta.icon;
                        const unassigned = Math.max(row.participants - row.selected, 0) + row.unknown;
                        return (
                          <tr key={row.order.id} className="hover:bg-muted/35 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-foreground text-sm">{row.room}</div>
                              <div className="text-muted-foreground mt-0.5">{row.company} · {row.guestName}</div>
                              <Badge variant="outline" className={cn("mt-2 gap-1 font-medium text-[10px]", meta.cls)}>
                                <StatusIcon className="h-3 w-3" /> {meta.label}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-foreground">{formatGermanDate(row.order.raw?.service_date)}</div>
                              <div className="text-muted-foreground mt-0.5">{formatMeal(row.order.raw?.meal_type)}</div>
                            </td>
                            <td className="p-4 text-center text-lg font-bold text-foreground tabular-nums">{row.participants}</td>
                            <td className="p-4 text-center"><KitchenCount icon={Fish} value={row.fish} tone="text-sky-300" /></td>
                            <td className="p-4 text-center"><KitchenCount icon={Beef} value={row.meat} tone="text-rose-300" /></td>
                            <td className="p-4 text-center"><KitchenCount icon={Leaf} value={row.vegetarian} tone="text-emerald-300" /></td>
                            <td className="p-4 text-center">
                              <span className={cn("font-bold tabular-nums", unassigned > 0 ? "text-amber-300" : "text-muted-foreground")}>{unassigned}</span>
                            </td>
                            <td className="p-4 max-w-[220px] text-muted-foreground">
                              <span className="line-clamp-2">{row.order.raw?.notes || "Keine"}</span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                {row.order.status === "new" && (
                                  <Button size="sm" className="bg-[hsl(var(--apple))] text-[hsl(var(--apple-foreground))]" onClick={() => updateStatus("conference_orders", row.order.id, "confirmed")}>Bestätigen</Button>
                                )}
                                {row.order.status === "confirmed" && (
                                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => updateStatus("conference_orders", row.order.id, "in_kitchen")}>Starten</Button>
                                )}
                                {row.order.status === "in_kitchen" && (
                                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => updateStatus("conference_orders", row.order.id, "completed")}>Geliefert</Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => setDetail(row.order)}>Details</Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={ClipboardList} label="Belege" value={kitchenOrders.length} />
              <StatCard icon={Users} label="Personen gesamt" value={kitchenProduction.totals.participants} />
              <StatCard icon={Clock} label="Neue Belege" value={kitchenOrders.filter(o => o.status === 'new').length} color="text-amber-500" />
              <StatCard icon={ChefHat} label="In Zubereitung" value={kitchenOrders.filter(o => o.status === 'in_kitchen').length} color="text-blue-500" />
            </div>

            {/* List Board of Kitchen Orders */}
            <div className="space-y-4">
              {kitchenOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-border border-dashed rounded-3xl p-16 text-center text-muted-foreground bg-card">
                  <ChefHat className="w-10 h-10 mb-2 opacity-30 text-[hsl(var(--apple))]" />
                  <p className="font-semibold text-sm">Keine Küchenbestellungen</p>
                  <p className="text-xs mt-1">Hier erscheinen Bestellungen, die via Clara an die Küche übermittelt wurden.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kitchenOrders.map((o) => {
                    const fish = (o.raw.items || []).filter((i: any) => i.dish_type === "fish").reduce((s: number, i: any) => s + (i.quantity || 0), 0);
                    const meat = (o.raw.items || []).filter((i: any) => i.dish_type === "meat").reduce((s: number, i: any) => s + (i.quantity || 0), 0);
                    const veg = (o.raw.items || []).filter((i: any) => i.dish_type === "vegetarian").reduce((s: number, i: any) => s + (i.quantity || 0), 0);
                    const meta = KITCHEN_STATUS_META[o.status || "new"] || KITCHEN_STATUS_META.new;
                    const StatusIcon = meta.icon;

                    return (
                      <Card key={o.id} className="border-border hover:shadow-md transition-shadow">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold font-sans text-lg text-foreground truncate">{o.raw.room_name}</span>
                                <Badge variant="outline" className={cn("gap-1 font-medium text-xs", meta.cls)}>
                                  <StatusIcon className="h-3 w-3" /> {meta.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Ansprechpartner: <span className="text-foreground font-semibold">{o.raw.guest_name}</span>
                                {o.raw.company && ` (${o.raw.company})`}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                                {o.raw.meal_type === 'lunch' ? 'Mittagsmenü' : 'Abendmenü'}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                                Service: {formatGermanDate(o.raw.service_date)}
                              </p>
                            </div>
                          </div>

                          {/* Room Spec & Guest counts */}
                          <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-xl border border-border/60 text-center text-xs">
                            <div>
                              <span className="text-muted-foreground block uppercase tracking-wider text-[9px]">Gäste</span>
                              <span className="font-bold text-foreground text-sm flex items-center justify-center gap-1 mt-0.5"><Users className="w-3.5 h-3.5 shrink-0" /> {o.raw.participants}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground block uppercase tracking-wider text-[9px] text-left ml-2">Menüauswahl</span>
                              <div className="flex flex-wrap gap-1.5 mt-1 justify-start ml-2">
                                {fish > 0 && <Chip icon={Fish} label={`${fish}x Fisch`} cls="bg-sky-50 text-sky-800 border-sky-200" />}
                                {meat > 0 && <Chip icon={Beef} label={`${meat}x Fleisch`} cls="bg-rose-50 text-rose-800 border-rose-200" />}
                                {veg > 0 && <Chip icon={Leaf} label={`${veg}x Vegetarisch`} cls="bg-emerald-50 text-emerald-800 border-emerald-200" />}
                                {fish + meat + veg === 0 && <span className="text-[10px] text-muted-foreground">Keine Hauptgang-Aufteilung</span>}
                              </div>
                            </div>
                          </div>

                          {/* Kitchen Notes */}
                          {o.raw.notes && (
                            <div className="p-3 bg-rose-50/30 dark:bg-rose-950/10 rounded-xl border border-rose-100/50 dark:border-rose-900/30 text-xs">
                              <span className="font-semibold text-rose-800 dark:text-rose-300 block mb-0.5">Allergien & Sonderwünsche:</span>
                              <p className="text-foreground leading-relaxed font-medium">{o.raw.notes}</p>
                            </div>
                          )}

                          {/* Control actions */}
                          <div className="flex items-center justify-between border-t border-border pt-4">
                            <span className="text-[10px] text-muted-foreground font-medium">
                              Eingang: {format(new Date(o.created_at), 'dd.MM. HH:mm', { locale: de })} Uhr
                            </span>

                            <div className="flex gap-2">
                              {o.status === "new" && (
                                <Button size="sm" className="bg-[hsl(var(--apple))] text-white hover:bg-[hsl(var(--apple))/0.8]" onClick={() => updateStatus("conference_orders", o.id, "confirmed")}>Bestätigen</Button>
                              )}
                              {o.status === "confirmed" && (
                                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => updateStatus("conference_orders", o.id, "in_kitchen")}>In die Küche</Button>
                              )}
                              {o.status === "in_kitchen" && (
                                <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => updateStatus("conference_orders", o.id, "completed")}>Als geliefert markieren</Button>
                              )}
                              {o.status !== "cancelled" && o.status !== "completed" && (
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => updateStatus("conference_orders", o.id, "cancelled")}>Stornieren</Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => setDetail(o)}>Ansehen</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT 3: SEMINAR LEADS --- */}
        {activeTab === 'leads' && (
          <div className="space-y-4 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-foreground">Seminarraum-Anfragen (Leads)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Strukturierte KI-erfasste Veranstaltungsanfragen für Räume, Verpflegung und Technik.</p>
              </div>
              <Badge variant="outline" className="font-semibold text-xs py-1 px-2.5">
                {leadsList.length} Anfragen
              </Badge>
            </div>

            {leadsList.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
                <CalendarDays className="w-8 h-8 mb-2 opacity-30 text-muted-foreground" />
                <p className="font-semibold text-sm">Keine Leads vorhanden</p>
                <p className="text-xs mt-0.5">Es wurden bisher keine Seminarraumanfragen erfasst.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted text-muted-foreground uppercase tracking-wider text-[10px] font-semibold border-b border-border">
                      <th className="p-4">Datum / Eingang</th>
                      <th className="p-4">Name / Firma</th>
                      <th className="p-4">Anlass</th>
                      <th className="p-4 text-center">Gäste</th>
                      <th className="p-4">Wunschzeitraum</th>
                      <th className="p-4">Verpflegung</th>
                      <th className="p-4">E-Mail-Status</th>
                      <th className="p-4 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leadsList.map((lead) => (
                      <tr 
                        key={lead.id} 
                        className="hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() => setDetail(lead)}
                      >
                        <td className="p-4 font-medium text-muted-foreground">
                          {format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-foreground text-sm">{lead.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{lead.meta}</div>
                        </td>
                        <td className="p-4 font-medium text-foreground">{lead.raw.anlass || "—"}</td>
                        <td className="p-4 text-center font-bold text-foreground">{lead.raw.personen || "—"}</td>
                        <td className="p-4">
                          <div className="font-medium text-foreground">{lead.raw.datum || "—"}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Dauer: {lead.raw.dauer || "—"}</div>
                        </td>
                        <td className="p-4 truncate max-w-[120px] text-muted-foreground">{lead.raw.verpflegung || "—"}</td>
                        <td className="p-4">
                          {lead.raw.email_sent ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 gap-1 py-0.5">
                              <Check className="w-3 h-3" /> Versendet
                            </Badge>
                          ) : lead.raw.email_error ? (
                            <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200 gap-1 py-0.5 animate-pulse" title={lead.raw.email_error}>
                              <AlertTriangle className="w-3 h-3" /> Fehler
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200 py-0.5">
                              Ausstehend
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setDetail(lead)}
                              className="p-1.5 bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-foreground font-semibold"
                            >
                              Ansehen
                            </button>
                            <button
                              onClick={() => setConfirm({ kind: 'archive', row: lead })}
                              className="p-1.5 bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-600"
                              title="Archivieren"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirm({ kind: 'delete', row: lead })}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600"
                              title="Löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- DETAIL DIALOG MODAL --- */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="admin-detail-dialog max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-sans text-xl font-bold flex items-center gap-2">
              {detail && (
                <span className={cn("w-3 h-3 rounded-full shrink-0", 
                  detail.colorKey === 'blue' ? 'bg-blue-500' :
                  detail.colorKey === 'orange' ? 'bg-orange-500' :
                  detail.colorKey === 'amber' ? 'bg-amber-500' :
                  detail.colorKey === 'red' ? 'bg-rose-500' :
                  detail.colorKey === 'pink' ? 'bg-pink-500' :
                  detail.colorKey === 'green' ? 'bg-emerald-500' :
                  detail.colorKey === 'indigo' ? 'bg-indigo-500' : 'bg-zinc-400'
                )} />
              )}
              {detail?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Eingegangen: {detail && format(new Date(detail.created_at), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr · Bereich: {formatSource(detail?.sourceTable)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            {detail && <ProfessionalDetail table={detail.sourceTable} row={detail} />}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4 mt-2 gap-2 flex-wrap">
            {/* Quick Status workflow actions (inside detail view) */}
            <div className="flex gap-1.5">
              {detail && detail.sourceTable === 'conference_orders' && (
                <>
                  {detail.status === "new" && (
                    <Button size="sm" className="bg-[hsl(var(--apple))] text-white" onClick={() => updateStatus("conference_orders", detail.id, "confirmed")} disabled={busy}>Bestätigen</Button>
                  )}
                  {detail.status === "confirmed" && (
                    <Button size="sm" className="bg-blue-600 text-white" onClick={() => updateStatus("conference_orders", detail.id, "in_kitchen")} disabled={busy}>Küche starten</Button>
                  )}
                  {detail.status === "in_kitchen" && (
                    <Button size="sm" className="bg-emerald-600 text-white" onClick={() => updateStatus("conference_orders", detail.id, "completed")} disabled={busy}>Ausgeben</Button>
                  )}
                  {detail.status !== "cancelled" && detail.status !== "completed" && (
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => updateStatus("conference_orders", detail.id, "cancelled")} disabled={busy}>Stornieren</Button>
                  )}
                </>
              )}

              {detail && (detail.sourceTable === 'room_orders' || (detail.sourceTable === 'restaurant_orders' && detail.type !== 'reservation')) && (
                <>
                  {(detail.status === "new" || detail.status === "pending") && (
                    <Button size="sm" className="bg-[hsl(var(--apple))] text-white" onClick={() => updateStatus(detail.sourceTable, detail.id, "in_progress")} disabled={busy}>Annehmen</Button>
                  )}
                  {detail.status === "in_progress" && (
                    <Button size="sm" className="bg-emerald-600 text-white" onClick={() => updateStatus(detail.sourceTable, detail.id, "completed")} disabled={busy}>Fertig markieren</Button>
                  )}
                  {detail.status !== "cancelled" && detail.status !== "completed" && (
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => updateStatus(detail.sourceTable, detail.id, "cancelled")} disabled={busy}>Stornieren</Button>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => detail && setConfirm({ kind: 'delete', row: detail })}
                className="px-3 py-1.5 text-xs rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 flex items-center gap-1 font-semibold"
                disabled={busy}
              >
                <Trash2 className="w-3.5 h-3.5" /> Löschen
              </button>
              {detail?.sourceTable !== 'clara_conversations' && (
                <button
                  onClick={() => detail && setConfirm({ kind: 'archive', row: detail })}
                  className="admin-primary-button px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 font-semibold"
                  disabled={busy}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                  Archivieren & Schließen
                </button>
              )}
              <button
                onClick={() => setDetail(null)}
                className="admin-secondary-button text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRM DIALOG MODAL --- */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {confirm?.kind === "delete" && "Eintrag wirklich löschen?"}
              {confirm?.kind === "archive" && "Eintrag archivieren?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirm?.kind === "delete" && "Dieser Beleg wird endgültig aus der Datenbank entfernt."}
              {confirm?.kind === "archive" && "Der Eintrag wandert in das Analyse-Archiv und verschwindet aus dem Live-Cockpit. Bitte nur archivieren, wenn der Vorgang wirklich erledigt ist."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                if (confirm.kind === "delete" && confirm.row) remove(confirm.row.sourceTable, [confirm.row.id]);
                if (confirm.kind === "archive" && confirm.row) archive(confirm.row.sourceTable, [confirm.row.id]);
              }}
              className={cn(
                "text-primary-foreground",
                confirm?.kind === "archive" ? "bg-zinc-800 hover:bg-zinc-700" : "bg-destructive hover:bg-destructive/90",
              )}
            >
              {confirm?.kind === "archive" ? "Archivieren" : "Endgültig löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </HeidehofAdminLayout>
  );
};

// Internal sub-components to render detail boxes beautifully
const ProfessionalDetail = ({ table, row }: { table: string; row: UnifiedRequest }) => {
  const sections = buildDetailSections(table, row.raw);
  return (
    <div className="admin-detail-sections space-y-3 pr-2 custom-scrollbar">
      {sections.map((section) => (
        <section key={section.title} className="admin-detail-section overflow-hidden">
          <h4 className="admin-detail-section-title px-3 py-2 text-xs uppercase tracking-[0.18em] font-bold">
            {section.title}
          </h4>
          <div className="admin-detail-lines">
            {section.lines.map((line) => {
              const value = renderDetailValue(line);
              return (
                <div key={`${section.title}-${line.label}`} className="admin-detail-line grid grid-cols-3 gap-3 px-3 py-2 items-start">
                  <span className="text-xs font-semibold uppercase tracking-wider">{line.label}</span>
                  <span className="col-span-2 text-sm font-semibold whitespace-pre-wrap break-words">
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

// Filter chip helper
function FilterChip({
  label, value, current, count, color = "bg-muted text-muted-foreground border-border", onClick
}: {
  label: string; value: string; current: string; count: number; color?: string; onClick: (v: string) => void;
}) {
  const isActive = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 active:scale-95",
        isActive 
          ? "bg-[hsl(var(--apple)/0.9)] text-[hsl(var(--apple-foreground))] border-[hsl(var(--apple)/0.45)] font-bold shadow-sm"
          : color
      )}
    >
      {label}
      <span className={cn(
        "px-1.5 py-0.5 rounded-full text-[10px] font-bold", 
        isActive ? "bg-black/20 text-[hsl(var(--apple-foreground))]" : "bg-muted-foreground/15 text-muted-foreground"
      )}>
        {count}
      </span>
    </button>
  );
}

// KPI stat helper
function StatCard({ icon: Icon, label, value, color = "text-[hsl(var(--apple))]" }: { icon: any; label: string; value: number | string; color?: string }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{label}</span>
          <Icon className={`h-4.5 w-4.5 ${color}`} />
        </div>
        <div className="text-2xl font-extrabold text-foreground mt-1 tabular-nums tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function KitchenTotal({ label, value, tone = "text-foreground" }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/35 px-3 py-2 min-w-[92px]">
      <span className="block text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">{label}</span>
      <span className={cn("block text-xl font-extrabold tabular-nums leading-tight mt-0.5", tone)}>{value}</span>
    </div>
  );
}

function KitchenCount({ icon: Icon, value, tone }: { icon: any; value: number; tone: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center gap-1.5 font-bold tabular-nums", tone)}>
      <Icon className="h-4 w-4" />
      {value}
    </span>
  );
}

function ServiceRow({
  row,
  onOpen,
  onArchive,
  onDelete,
}: {
  row: UnifiedRequest;
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const style = colorStyles[row.colorKey];
  const category = row.sourceTable === "restaurant_orders" ? orderCategoryLabel(row.raw?.category) : formatSource(row.sourceTable);
  const positions = row.sourceTable === "restaurant_orders" || row.sourceTable === "room_orders"
    ? itemsLabel(row.raw?.items)
    : row.raw?.description ?? row.subtitle;
  const guest = row.raw?.guest_name || row.raw?.guest_type || "Gast";
  const place = row.raw?.table_or_room || row.raw?.room_number || row.raw?.room_or_table || row.meta || "Ort offen";
  return (
    <article className={cn("rounded-2xl border border-border bg-muted/20 p-4 border-l-[5px]", style.border)}>
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={cn("inline-flex text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border", style.badge)}>
              {category}
            </span>
            <h5 className="text-sm font-bold text-foreground mt-2 truncate">
              {guest} · {place}
            </h5>
            <p className="text-sm text-foreground mt-2 whitespace-pre-line line-clamp-3">
              {positions || "Keine Positionen hinterlegt"}
            </p>
            {row.raw?.notes && (
              <p className="text-xs text-amber-200 mt-2 line-clamp-2">
                Sonderwunsch: {String(row.raw.notes)}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">
              Eingegangen {formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: de })} · Status: {row.status || "neu"}
            </p>
          </div>
          {String(row.raw?.urgency ?? "").toLowerCase() === "high" && (
            <Badge variant="outline" className="bg-rose-500/15 text-rose-200 border-rose-400/35 shrink-0">Dringend</Badge>
          )}
        </div>
      </button>
      <div className="flex justify-end gap-2 mt-3">
        <Button size="sm" variant="ghost" onClick={onOpen}>Details</Button>
        <Button size="sm" variant="outline" onClick={onArchive}>
          <Archive className="w-3.5 h-3.5 mr-1" /> Archiv
        </Button>
        <Button size="sm" variant="outline" className="text-rose-300 hover:text-rose-200" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Löschen
        </Button>
      </div>
    </article>
  );
}

// Visual Chip helper
function Chip({ icon: Icon, label, cls }: { icon: any; label: string; cls: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border", cls)}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

export default AdminOverview;
