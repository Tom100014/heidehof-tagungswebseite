import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Calendar, Copy, FileText, Inbox, Loader2, Mail, MailX, Phone, RefreshCw, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Tour } from "@/components/admin/help/Tour";
import { HelpHint } from "@/components/admin/help/HelpHint";
import { adminSecurity } from "@/utils/admin-security";
import { useConfirm } from "@/components/admin/ConfirmDialog";

type InquiryStatus = "neu" | "in_bearbeitung" | "angebot_gesendet" | "gewonnen" | "abgesagt";

const STATUS_META: Record<InquiryStatus, { label: string; className: string }> = {
  neu:               { label: "Neu",            className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  in_bearbeitung:    { label: "In Bearbeitung", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  angebot_gesendet:  { label: "Angebot raus",   className: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  gewonnen:          { label: "Gewonnen",       className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  abgesagt:          { label: "Abgesagt",       className: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

type Inquiry = {
  id: string;
  created_at: string;
  firma?: string;
  name?: string;
  email?: string;
  telefon?: string;
  anlass?: string;
  personen?: string;
  datum?: string;
  raumvorschlag?: string;
  pauschalvorschlag?: string;
  zusammenfassung?: string;
  anfrage_text?: string;
  angebot_text?: string;
  angebot_generated_at?: string;
  email_sent: boolean;
  email_error?: string;
  status?: InquiryStatus;
  guest_notified_at?: string | null;
  conversation?: Array<{ role: string; content: string }>;
};

export default function AdminInbox() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const confirmDialog = useConfirm();

  const generateOffer = async (id: string) => {
    setGenerating(id);
    try {
      const { data, error } = await supabase.functions.invoke("clara-generate-offer", {
        body: { id },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Fehler");
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, anfrage_text: data.anfrage_text, angebot_text: data.angebot_text, angebot_generated_at: new Date().toISOString() }
            : it,
        ),
      );
      toast.success("Anfrage & Angebot erstellt");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generierung fehlgeschlagen");
    } finally {
      setGenerating(null);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert`);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tagungs_inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Fehler beim Laden");
    else setItems((data as unknown as Inquiry[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Realtime: live-Updates für neue/geänderte Anfragen
    const channel = supabase
      .channel("admin-inbox-inquiries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tagungs_inquiries" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as Inquiry;
            setItems((prev) => [row, ...prev.filter((i) => i.id !== row.id)]);
            toast.success(`Neue Anfrage: ${row.firma || row.name || "Unbekannt"}`, { duration: 6000 });
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as Inquiry;
            setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, ...row } : i)));
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as { id: string };
            setItems((prev) => prev.filter((i) => i.id !== row.id));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: InquiryStatus) => {
    const previous = items.find((i) => i.id === id)?.status;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    const { error } = await supabase
      .from("tagungs_inquiries")
      .update({ status, status_changed_at: new Date().toISOString() } as never)
      .eq("id", id);
    if (error) {
      // rollback
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: previous } : i)));
      return toast.error("Status konnte nicht gespeichert werden");
    }
    void adminSecurity.logAction({
      action: "inquiry.status_change",
      entity: "tagungs_inquiries",
      entityId: id,
      diff: { from: previous, to: status },
    });

    // Auto-Mail an Gast
    try {
      const { error: mailErr } = await supabase.functions.invoke("send-inquiry-status-email", {
        body: { id, status },
      });
      if (mailErr) throw mailErr;
      toast.success(`Status: ${STATUS_META[status].label} · Gast informiert`);
    } catch (e) {
      toast.warning(`Status gespeichert, aber E-Mail an Gast fehlgeschlagen`);
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  };

  const remove = async (id: string) => {
    const ok = await confirmDialog({
      title: "Anfrage löschen?",
      description: "Die Anfrage wird unwiderruflich aus dem Posteingang entfernt.",
      destructive: true,
      confirmLabel: "Löschen",
    });
    if (!ok) return;
    const { error } = await supabase.from("tagungs_inquiries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((current) => current.filter((item) => item.id !== id));
    void adminSecurity.logAction({ action: "inquiry.delete", entity: "tagungs_inquiries", entityId: id });
    toast.success("Anfrage gelöscht");
  };

  return (
    <HeidehofAdminLayout title="Tagungsanfragen von Clara">
      <Tour
        tourId="inbox.v1"
        steps={[
          { title: "Willkommen im Posteingang", body: "Hier landen alle Tagungsanfragen von Clara — neue Einträge erscheinen live ohne Neuladen." },
          { selector: "[data-tour='inbox-status']", title: "Status setzen", body: "Wähle einen Status: der Gast bekommt automatisch eine passende E-Mail. Alle Änderungen werden im Aktivitäts-Protokoll festgehalten.", placement: "bottom" },
          { selector: "[data-tour='inbox-refresh']", title: "Manuell aktualisieren", body: "Falls nötig, kannst du die Liste auch manuell neu laden.", placement: "bottom" },
        ]}
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          {items.length} Anfragen insgesamt · live aktualisiert
          <HelpHint title="So funktioniert die Inbox">
            Neue Anfragen erscheinen sofort. Setze den Status pro Anfrage — der Gast wird dann automatisch per E-Mail informiert.
          </HelpHint>
        </p>
        <Button data-tour="inbox-refresh" variant="outline" onClick={load} className="border-gold/30 text-gold">
          <RefreshCw className="w-4 h-4 mr-2" /> Aktualisieren
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Lädt Anfragen…
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-gold/20 bg-card/40">
          <Inbox className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Noch keine Anfragen eingegangen.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const status = (it.status ?? "neu") as InquiryStatus;
            return (
            <Card key={it.id} className="border-gold/20 bg-card/40 overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
                <button className="text-left flex-1 min-w-0" onClick={() => setOpen(open === it.id ? null : it.id)}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-serif text-lg truncate">{it.firma || it.name || "Anfrage"}</h3>
                    <Badge className={`text-xs ${STATUS_META[status].className}`}>{STATUS_META[status].label}</Badge>
                    {it.email_sent ? (
                      <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-xs"><Mail className="w-3 h-3 mr-1" /> versendet</Badge>
                    ) : (
                      <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-xs"><MailX className="w-3 h-3 mr-1" /> nicht versendet</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {it.anlass && <span><Calendar className="w-3 h-3 inline mr-1" />{it.anlass}</span>}
                    {it.personen && <span><Users className="w-3 h-3 inline mr-1" />{it.personen}</span>}
                    {it.datum && <span>{it.datum}</span>}
                  </p>
                </button>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleString("de-DE")}</div>
                  <div data-tour="inbox-status">
                    <Select value={status} onValueChange={(v) => updateStatus(it.id, v as InquiryStatus)}>
                      <SelectTrigger className="h-8 text-xs w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_META) as InquiryStatus[]).map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{STATUS_META[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {open === it.id && (
                <div className="px-5 pb-5 border-t border-gold/10 pt-5 space-y-4 text-sm">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2"><Building className="w-4 h-4 text-gold" /> {it.firma || "-"}</div>
                    <div>{it.name || "-"}</div>
                    <a href={it.email ? `mailto:${it.email}` : undefined} className="flex items-center gap-2 text-gold hover:underline"><Mail className="w-4 h-4" />{it.email || "-"}</a>
                    <a href={it.telefon ? `tel:${it.telefon}` : undefined} className="flex items-center gap-2 hover:text-gold"><Phone className="w-4 h-4" />{it.telefon || "-"}</a>
                  </div>

                  {it.zusammenfassung && (
                    <div className="bg-gold/5 border-l-2 border-gold p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-gold mb-1">Zusammenfassung</p>
                      <p className="whitespace-pre-wrap">{it.zusammenfassung}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div><strong className="text-foreground">Empfohlener Raum:</strong> {it.raumvorschlag || "-"}</div>
                    <div><strong className="text-foreground">Pauschale:</strong> {it.pauschalvorschlag || "-"}</div>
                  </div>

                  

                  {it.conversation?.length ? (
                    <details className="rounded-xl border border-gold/15 bg-background/50 p-3">
                      <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-gold">Gesprächsverlauf anzeigen</summary>
                      <div className="mt-3 space-y-2 text-xs">
                        {it.conversation.map((m, idx) => (
                          <div key={idx} className="rounded-lg bg-card/60 p-2">
                            <strong className="text-gold">{m.role === "user" ? "Gast" : "Clara"}:</strong>{" "}
                            <span className="whitespace-pre-wrap">{m.content}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}

                  {/* Anfrage- & Angebotstexte */}
                  <div className="rounded-xl border border-apple-bright/30 bg-apple-bright/5 p-4 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-apple-bright flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Anfrage & Angebot
                      </p>
                      <Button
                        size="sm"
                        onClick={() => generateOffer(it.id)}
                        disabled={generating === it.id}
                        className="bg-apple-bright text-background hover:bg-apple-bright/90"
                      >
                        {generating === it.id ? (
                          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generiere…</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            {it.angebot_text ? "Neu generieren" : "Anfrage & Angebot erstellen"}
                          </>
                        )}
                      </Button>
                    </div>

                    {it.anfrage_text && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Anfrage-Zusammenfassung</p>
                          <Button size="sm" variant="ghost" onClick={() => copyText(it.anfrage_text!, "Anfrage")}>
                            <Copy className="w-3 h-3 mr-1" /> Kopieren
                          </Button>
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none bg-background/50 rounded-lg p-3 text-xs">
                          <ReactMarkdown>{it.anfrage_text}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {it.angebot_text && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Angebots-Entwurf</p>
                          <Button size="sm" variant="ghost" onClick={() => copyText(it.angebot_text!, "Angebot")}>
                            <Copy className="w-3 h-3 mr-1" /> Kopieren
                          </Button>
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none bg-background/50 rounded-lg p-3 text-xs">
                          <ReactMarkdown>{it.angebot_text}</ReactMarkdown>
                        </div>
                        {it.angebot_generated_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Erstellt {new Date(it.angebot_generated_at).toLocaleString("de-DE")}
                          </p>
                        )}
                      </div>
                    )}

                    {!it.angebot_text && !it.anfrage_text && (
                      <p className="text-xs text-muted-foreground">
                        Klicken Sie oben, um aus den Gesprächsdaten automatisch eine professionelle Anfrage-Zusammenfassung und einen Angebots-Entwurf zu erstellen.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="ghost" size="sm" onClick={() => remove(it.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4 mr-1.5" /> Löschen
                    </Button>
                  </div>
                </div>
              )}
            </Card>
            );
          })}
        </div>
      )}
    </HeidehofAdminLayout>
  );
}
