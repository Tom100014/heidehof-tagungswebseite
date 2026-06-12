import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Eye, Trash2, Check, Loader2, Inbox as InboxIcon, RefreshCw, Archive, Mail, MailWarning,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface RequestRow {
  id: string;
  created_at: string;
  read_at: string | null;
  primary: string;
  secondary?: string;
  meta?: string;
  raw: Record<string, unknown>;
}

export interface CategoryRequestBoxProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  blinkColor?: string;
  table: string;
  filter?: { column: string; value: string | number | boolean | Array<string | number | boolean> };
  selectColumns?: string;
  mapper: (row: Record<string, unknown>) => RequestRow;
  realtimeEvent?: boolean;
  emptyHint?: string;
}

const DEFAULT_BLINK = "#dc2626";

const CATEGORY_LABELS: Record<string, string> = {
  fine_dining: "Essen / Fine Dining",
  bar_max: "Getränke / Bar Mäx",
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

const buildDetailSections = (table: string, row: RequestRow): DetailSection[] => {
  const r = row.raw;
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

const ProfessionalDetail = ({ table, row }: { table: string; row: RequestRow }) => {
  const sections = buildDetailSections(table, row);
  return (
    <div className="admin-detail-sections space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      {sections.map((section) => (
        <section key={section.title} className="admin-detail-section overflow-hidden">
          <h4 className="admin-detail-section-title px-3 py-2 text-xs uppercase tracking-[0.18em] font-semibold">
            {section.title}
          </h4>
          <div className="admin-detail-lines">
            {section.lines.map((line) => {
              const value = renderDetailValue(line);
              return (
                <div key={`${section.title}-${line.label}`} className="admin-detail-line grid grid-cols-3 gap-3 px-3 py-2 items-start">
                  <span className="text-xs font-medium uppercase tracking-wider">{line.label}</span>
                  <span className="col-span-2 text-sm font-medium whitespace-pre-wrap break-words">
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

export function CategoryRequestBox({
  title, subtitle, icon: Icon, accentClass, blinkColor = DEFAULT_BLINK,
  table, filter, selectColumns = "*", mapper, realtimeEvent = true, emptyHint,
}: CategoryRequestBoxProps) {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<RequestRow | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "delete" | "delete-all" | "archive-all"; row?: RequestRow } | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    let q = supabase.from(table as never).select(selectColumns).order("created_at", { ascending: false }).limit(50);
    if (filter) {
      q = Array.isArray(filter.value)
        ? q.in(filter.column, filter.value as never)
        : q.eq(filter.column, filter.value as never);
    }
    const { data, error } = await q;
    if (error) {
      console.error(`[${table}] load failed`, error);
      setRows([]);
    } else {
      setRows((data as Record<string, unknown>[]).map(mapper));
    }
    setLoading(false);
    setRefreshing(false);
  }, [table, selectColumns, filter, mapper]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!realtimeEvent) return;
    const channel = supabase
      .channel(`box-${table}-${filter?.value ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table, filter?.value, realtimeEvent, load]);

  const visible = rows; // all rows are "new" since read items get archived & removed
  const hasUnread = visible.length > 0;

  const archive = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("archive-request", {
        body: { source_table: table, ids },
      });
      if (error) throw error;
      setRows(prev => prev.filter(r => !ids.includes(r.id)));
      toast.success(`${ids.length} archiviert`);
    } catch (e) {
      console.error(e);
      toast.error("Archivierung fehlgeschlagen");
    } finally {
      setBusy(false);
      setDetail(null);
      setConfirm(null);
    }
  }, [table]);

  const remove = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    setBusy(true);
    const { error } = await supabase.from(table as never).delete().in("id", ids);
    setBusy(false);
    if (error) { toast.error("Löschen fehlgeschlagen: " + error.message); return; }
    setRows(prev => prev.filter(r => !ids.includes(r.id)));
    toast.success(`${ids.length} gelöscht`);
    setConfirm(null);
    setDetail(null);
  }, [table]);

  return (
    <div
      className={cn(
        "admin-request-card rounded-xl overflow-hidden flex flex-col transition-all relative",
        hasUnread ? "border-transparent" : "border-border",
      )}
      style={hasUnread ? {
        boxShadow: `0 0 0 2px ${blinkColor}, 0 4px 16px -8px ${blinkColor}55`,
        animation: "boxBlink 2s ease-in-out infinite",
      } : undefined}
    >
      <style>{`@keyframes boxBlink {
        0%, 100% { box-shadow: 0 0 0 2px ${blinkColor}, 0 4px 16px -8px ${blinkColor}55; }
        50% { box-shadow: 0 0 0 3px ${blinkColor}aa, 0 6px 20px -6px ${blinkColor}; }
      }`}</style>

      {/* Header */}
      <div className="admin-request-header flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("admin-request-icon w-8 h-8 rounded-lg flex items-center justify-center shrink-0", accentClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-[14px] leading-tight truncate">{title}</h3>
            {subtitle && <p className="text-xs truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasUnread && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full text-primary-foreground"
              style={{ backgroundColor: blinkColor }}
            >
              {visible.length}
            </span>
          )}
          <button
            onClick={load}
            className="admin-icon-button p-1 rounded"
            title="Aktualisieren"
            aria-label="Aktualisieren"
          >
            <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* List - compact */}
      <div className="admin-request-list flex-1 min-h-[132px] max-h-[240px] overflow-y-auto">
        {loading ? (
          <div className="space-y-1.5 p-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="admin-empty-state flex flex-col items-center justify-center h-full text-center text-xs py-5">
            <InboxIcon className="w-5 h-5 mb-1 opacity-30" />
            <p>{emptyHint ?? "Keine Einträge"}</p>
          </div>
        ) : (
          <ul className="admin-request-rows">
            {visible.slice(0, 4).map(row => (
              <li
                key={row.id}
                className="admin-request-row px-2.5 py-2 transition-colors flex items-start gap-2 group"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse"
                  style={{ backgroundColor: blinkColor }}
                />
                <button
                  onClick={() => setDetail(row)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="admin-request-primary text-[12px] font-semibold truncate leading-tight">{row.primary}</p>
                  {row.secondary && <p className="admin-request-secondary text-xs truncate">{row.secondary}</p>}
                  <div className="admin-request-meta flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    <span>{format(new Date(row.created_at), "dd.MM.yyyy", { locale: de })}</span>
                    <span>{format(new Date(row.created_at), "HH:mm", { locale: de })} Uhr</span>
                    {row.meta && <span className="truncate max-w-[11rem]">{row.meta}</span>}
                    {row.raw.email_sent === true && (
                      <span className="flex items-center gap-0.5 text-[8px] px-1 rounded">
                        <Mail className="w-2 h-2" /> Versand
                      </span>
                    )}
                    {row.raw.email_sent === false && row.raw.email_error && (
                      <span className="flex items-center gap-0.5 text-[8px] text-rose-300 bg-rose-500/15 px-1 rounded">
                        <MailWarning className="w-2 h-2" /> Fehler
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); archive([row.id]); }}
                    className="admin-row-action p-1 rounded"
                    title="Archivieren"
                    aria-label="Archivieren"
                    disabled={busy}
                  >
                    <Archive className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirm({ kind: "delete", row }); }}
                    className="admin-row-action admin-row-action-danger p-1 rounded"
                    title="Löschen"
                    aria-label="Löschen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer / bulk actions */}
      <div className="admin-request-footer flex items-center justify-between px-2.5 py-2 text-xs">
        <span>{visible.length} neu</span>
        {hasUnread && (
          <div className="flex gap-1">
            <button
              onClick={() => setConfirm({ kind: "archive-all" })}
              disabled={busy}
              className="admin-footer-action px-1.5 py-0.5 rounded font-medium"
            >
              Alle archivieren
            </button>
            <button
              onClick={() => setConfirm({ kind: "delete-all" })}
              disabled={busy}
              className="admin-footer-action-danger px-1.5 py-0.5 rounded font-medium"
            >
              Alle löschen
            </button>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="admin-detail-dialog max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">{detail?.primary}</DialogTitle>
            <DialogDescription className="text-xs">
              Eingang: {detail && format(new Date(detail.created_at), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <ProfessionalDetail table={table} row={detail} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => detail && setConfirm({ kind: "delete", row: detail })}
              className="px-3 py-1.5 text-sm rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1"
              disabled={busy}
            >
              <Trash2 className="w-3.5 h-3.5" /> Löschen
            </button>
            <button
              onClick={() => detail && archive([detail.id])}
              className="admin-primary-button px-3 py-1.5 text-sm rounded-lg flex items-center gap-1"
              disabled={busy}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              Archivieren & schließen
            </button>
            <button
              onClick={() => setDetail(null)}
              className="admin-secondary-button text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              Schließen
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {confirm?.kind === "delete" && "Eintrag wirklich löschen?"}
              {confirm?.kind === "delete-all" && `Alle ${visible.length} Einträge löschen?`}
              {confirm?.kind === "archive-all" && `Alle ${visible.length} Einträge archivieren?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirm?.kind === "delete" && "Wird endgültig aus der Datenbank entfernt."}
              {confirm?.kind === "delete-all" && "Alle aktuellen Einträge dieser Kategorie werden endgültig aus der Datenbank entfernt. Nicht wiederherstellbar."}
              {confirm?.kind === "archive-all" && "Alle Einträge wandern in die Analyse-Datenbank und verschwinden aus diesem Container."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                if (confirm.kind === "delete" && confirm.row) remove([confirm.row.id]);
                else if (confirm.kind === "delete-all") remove(visible.map(r => r.id));
                else if (confirm.kind === "archive-all") archive(visible.map(r => r.id));
              }}
              className={cn(
                "text-primary-foreground",
                confirm?.kind === "archive-all" ? "bg-zinc-600 hover:bg-zinc-700" : "bg-destructive hover:bg-destructive/90",
              )}
            >
              {confirm?.kind === "archive-all" ? "Archivieren" : "Endgültig löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
