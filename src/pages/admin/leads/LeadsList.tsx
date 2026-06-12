import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Pencil, Trash2, Sparkles, Mail, Send,
  Eye, RefreshCw, CheckCircle2, X, Search, Loader2,
} from "lucide-react";

// Glasiger dunkler Button-Stil – auf der Seite wiederverwendet.
const GLASS_BTN =
  "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium " +
  "bg-transparent text-foreground border border-border/60 backdrop-blur-sm " +
    "shadow-sm hover:bg-muted/40 hover:border-border " +
  "transition-all disabled:opacity-50 disabled:cursor-not-allowed";
const GLASS_BTN_SM = GLASS_BTN.replace("px-3 py-2 text-sm", "px-2.5 py-1.5 text-xs");
const GLASS_BTN_DANGER =
  "inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium " +
    "bg-transparent text-red-600 border border-red-400/50 " +
    "hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50";

interface Lead {
  id: string;
  campaign_id: string | null;
  company: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  postal_code: string | null;
  industry: string | null;
  status: string;
  source: string | null;
  unsubscribed: boolean;
  last_sent_at: string | null;
  created_at: string;
}
interface Campaign { id: string; name: string }
interface Draft {
  id: string; lead_id: string; campaign_id: string | null;
  subject: string; body_html: string; body_text: string; status: string;
  sent_at: string | null; error_message: string | null;
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  new:         { label: "Neu",            cls: "bg-neutral-200 text-neutral-800" },
  ready:       { label: "Bereit",         cls: "bg-blue-100 text-blue-800" },
  imported:    { label: "Importiert",     cls: "bg-blue-100 text-blue-800" },
  needs_email: { label: "Ohne E-Mail",    cls: "bg-amber-100 text-amber-800" },
  contacted:   { label: "Kontaktiert",    cls: "bg-zinc-100 text-zinc-800" },
  send_error:  { label: "Sendefehler",    cls: "bg-red-100 text-red-800" },
};

const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({}); // by lead_id (latest)
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Lead | null>(null);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [previewDraft, setPreviewDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [leadsRes, campRes, draftsRes] = await Promise.all([
      supabase.from("leads").select("*").order("industry", { ascending: true }).order("created_at", { ascending: false }).limit(1000),
      supabase.from("lead_campaigns").select("id,name").order("created_at", { ascending: false }),
      supabase.from("lead_email_drafts").select("id,lead_id,campaign_id,subject,body_html,body_text,status,sent_at,error_message").order("created_at", { ascending: false }),
    ]);
    setLeads((leadsRes.data as Lead[]) || []);
    setCampaigns((campRes.data as Campaign[]) || []);
    const map: Record<string, Draft> = {};
    for (const d of (draftsRes.data || []) as Draft[]) {
      if (!map[d.lead_id]) map[d.lead_id] = d; // latest per lead
    }
    setDrafts(map);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (campaignFilter !== "all" && l.campaign_id !== campaignFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.company, l.email, l.city, l.industry, l.contact_name, l.website]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [leads, query, statusFilter, campaignFilter]);

  // Branchen-Gruppierung
  const grouped = useMemo(() => {
    const g: Record<string, Lead[]> = {};
    for (const l of filtered) {
      const key = l.industry?.trim() || "Ohne Branche";
      (g[key] ||= []).push(l);
    }
    return Object.entries(g).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleGroup = (key: string, ids: string[]) => {
    const next = new Set(selected);
    const allIn = ids.every((id) => next.has(id));
    ids.forEach((id) => allIn ? next.delete(id) : next.add(id));
    setSelected(next);
  };
  const toggleCollapse = (key: string) => {
    const next = new Set(collapsed);
    next.has(key) ? next.delete(key) : next.add(key);
    setCollapsed(next);
  };
  const selectAll = () => setSelected(new Set(filtered.map((l) => l.id)));
  const clearSelection = () => setSelected(new Set());

  // ====== Aktionen ======
  const saveLead = async () => {
    if (!editing) return;
    setBusy(true);
    const { id, created_at, last_sent_at, ...patch } = editing;
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Lead aktualisiert");
    setEditing(null);
    await load();
  };

  const deleteLeads = async (ids: string[]) => {
    if (!ids.length) return;
    if (!confirm(`${ids.length} Lead${ids.length > 1 ? "s" : ""} wirklich löschen?`)) return;
    setBusy(true);
    const { error } = await supabase.from("leads").delete().in("id", ids);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} gelöscht`);
    clearSelection();
    await load();
  };

  const generateDraftsFor = async (ids: string[]) => {
    if (!ids.length) return toast.error("Keine Auswahl");
    const sample = leads.find((l) => ids.includes(l.id));
    const campaignId = sample?.campaign_id;
    if (!campaignId) return toast.error("Leads brauchen eine Kampagne (in Bearbeiten setzen).");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("lead-agent", {
      body: { action: "generate_drafts", campaignId, leadIds: ids },
    });
    setBusy(false);
    if (error || !data?.ok) return toast.error(data?.error || error?.message || "Fehler");
    toast.success(`${data.created} KI-Entwurf/Entwürfe erzeugt`);
    await load();
  };

  const openPreview = async (lead: Lead) => {
    setPreviewLead(lead);
    setPreviewDraft(drafts[lead.id] ?? null);
  };

  const callDraft = async (action: string, payload: Record<string, unknown> = {}) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("lead-draft", { body: { action, ...payload } });
    setBusy(false);
    if (error || !data?.ok) { toast.error(data?.error || error?.message || "Fehler"); return null; }
    return data;
  };

  const regenPreview = async () => {
    if (!previewDraft) return;
    const r = await callDraft("regenerate", { draftId: previewDraft.id });
    if (r?.draft) setPreviewDraft(r.draft);
  };
  const savePreview = async () => {
    if (!previewDraft) return;
    const r = await callDraft("update", {
      draftId: previewDraft.id, subject: previewDraft.subject,
      body_html: previewDraft.body_html, body_text: previewDraft.body_text,
    });
    if (r) toast.success("Gespeichert");
  };
  const sendPreview = async () => {
    if (!previewDraft) return;
    const r = await callDraft("send_now", { draftId: previewDraft.id });
    if (r) { toast.success("Versendet"); setPreviewLead(null); await load(); }
  };

  const sendBulk = async (ids: string[]) => {
    const draftIds = ids.map((id) => drafts[id]?.id).filter(Boolean);
    if (!draftIds.length) return toast.error("Keine Entwürfe für Auswahl. Erst „KI-Mail erzeugen“.");
    if (!confirm(`${draftIds.length} E-Mail(s) jetzt versenden?`)) return;
    const r = await callDraft("send_bulk", { draftIds });
    if (r) {
      toast.success(`${r.sent}/${r.attempted} versendet`);
      if (r.errors?.length) toast.warning(r.errors.slice(0, 2).join(" · "));
      clearSelection();
      await load();
    }
  };

  // ====== Render ======
  const selectedArr = Array.from(selected);
  const selectedWithDraft = selectedArr.filter((id) => drafts[id]);

  return (
    <div className="space-y-4">
      {/* Filter- & Aktionsleiste */}
      <Card className="p-3 flex flex-wrap items-center gap-2 bg-card/60 backdrop-blur-md border-white/10">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input className="pl-9" placeholder="Suche Firma, Stadt, Branche, E-Mail…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {Object.entries(statusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Kampagne" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kampagnen</SelectItem>
            {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={() => void load()} className={GLASS_BTN_SM}><RefreshCw className="w-3.5 h-3.5" /> Aktualisieren</button>
      </Card>

      {/* Auswahl-Toolbar */}
      {selected.size > 0 && (
        <Card className="p-3 flex flex-wrap items-center gap-2 bg-neutral-900/85 backdrop-blur-md border-white/10 text-white">
          <span className="text-sm">{selected.size} ausgewählt</span>
          <button onClick={selectAll} className={GLASS_BTN_SM}>Alle ({filtered.length})</button>
          <button onClick={clearSelection} className={GLASS_BTN_SM}><X className="w-3.5 h-3.5" /> Auswahl leeren</button>
          <div className="flex-1" />
          <button onClick={() => void generateDraftsFor(selectedArr)} disabled={busy} className={GLASS_BTN_SM}>
            <Sparkles className="w-3.5 h-3.5" /> KI-Mail für Auswahl erzeugen
          </button>
          <button onClick={() => void sendBulk(selectedArr)} disabled={busy || !selectedWithDraft.length} className={GLASS_BTN_SM}>
            <Send className="w-3.5 h-3.5" /> Senden ({selectedWithDraft.length})
          </button>
          <button onClick={() => void deleteLeads(selectedArr)} disabled={busy} className={GLASS_BTN_DANGER}>
            <Trash2 className="w-3.5 h-3.5" /> Löschen
          </button>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Lade Leads…</div>
      )}

      {!loading && grouped.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">Keine Leads gefunden.</Card>
      )}

      {/* Branchen-Gruppen */}
      {grouped.map(([industry, items]) => {
        const ids = items.map((l) => l.id);
        const allSelected = ids.every((id) => selected.has(id));
        const someSelected = ids.some((id) => selected.has(id));
        const isCollapsed = collapsed.has(industry);
        return (
          <Card key={industry} className="overflow-hidden bg-card/60 backdrop-blur-md border-white/10">
            <div className="flex items-center gap-3 p-3 bg-muted/30 border-b border-white/10">
              <button onClick={() => toggleCollapse(industry)} className="text-muted-foreground hover:text-foreground">
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <Checkbox checked={allSelected} onCheckedChange={() => toggleGroup(industry, ids)}
                className={someSelected && !allSelected ? "data-[state=unchecked]:bg-foreground/30" : ""} />
              <h3 className="font-serif text-lg">{industry}</h3>
              <Badge variant="outline" className="ml-1">{items.length}</Badge>
              <div className="flex-1" />
              <button onClick={() => void generateDraftsFor(ids)} disabled={busy} className={GLASS_BTN_SM}>
                <Sparkles className="w-3.5 h-3.5" /> KI für alle
              </button>
              <button onClick={() => void sendBulk(ids)} disabled={busy} className={GLASS_BTN_SM}>
                <Send className="w-3.5 h-3.5" /> Senden
              </button>
            </div>

            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground bg-muted/20">
                    <tr className="text-left">
                      <th className="p-2 w-8"></th>
                      <th className="p-2">Firma</th>
                      <th className="p-2">Kontakt</th>
                      <th className="p-2">E-Mail</th>
                      <th className="p-2">Stadt</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">KI-Mail</th>
                      <th className="p-2 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((l) => {
                      const draft = drafts[l.id];
                      const sLabel = statusLabel[l.status] || { label: l.status, cls: "bg-neutral-200 text-neutral-800" };
                      return (
                        <tr key={l.id} className="border-t border-white/5 hover:bg-muted/20">
                          <td className="p-2">
                            <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggleSelect(l.id)} />
                          </td>
                          <td className="p-2">
                            <p className="font-medium">{l.company}</p>
                            {l.website && <a href={l.website} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">{l.website.replace(/^https?:\/\//, "")}</a>}
                          </td>
                          <td className="p-2">{l.contact_name || <span className="text-muted-foreground">—</span>}</td>
                          <td className="p-2 font-mono text-xs">
                            {l.email
                              ? <a href={`mailto:${l.email}`} className="hover:underline">{l.email}</a>
                              : <span className="text-amber-600">fehlt</span>}
                          </td>
                          <td className="p-2">{l.city || "—"}</td>
                          <td className="p-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sLabel.cls}`}>{sLabel.label}</span>
                            {l.last_sent_at && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                gesendet {new Date(l.last_sent_at).toLocaleDateString("de-DE")}
                              </p>
                            )}
                          </td>
                          <td className="p-2">
                            {draft
                              ? <Badge variant={draft.status === "sent" ? "default" : draft.status === "error" ? "destructive" : "outline"} className="text-xs">{draft.status}</Badge>
                              : <span className="text-xs text-muted-foreground">–</span>}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-end gap-1.5">
                              {draft && (
                                <button onClick={() => openPreview(l)} className={GLASS_BTN_SM} title="Vorschau & senden">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!draft && l.email && (
                                <button onClick={() => void generateDraftsFor([l.id])} disabled={busy} className={GLASS_BTN_SM} title="KI-Mail erzeugen">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => setEditing({ ...l })} className={GLASS_BTN_SM} title="Bearbeiten">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => void deleteLeads([l.id])} className={GLASS_BTN_DANGER} title="Löschen">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}

      {/* ====== Bearbeiten-Dialog ====== */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Lead bearbeiten</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><Label>Firma</Label><Input value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} /></div>
              <div><Label>Ansprechperson</Label><Input value={editing.contact_name || ""} onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })} /></div>
              <div><Label>E-Mail</Label><Input value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>Telefon</Label><Input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
              <div><Label>Website</Label><Input value={editing.website || ""} onChange={(e) => setEditing({ ...editing, website: e.target.value })} /></div>
              <div><Label>Stadt</Label><Input value={editing.city || ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></div>
              <div><Label>PLZ</Label><Input value={editing.postal_code || ""} onChange={(e) => setEditing({ ...editing, postal_code: e.target.value })} /></div>
              <div><Label>Branche</Label><Input value={editing.industry || ""} onChange={(e) => setEditing({ ...editing, industry: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kampagne</Label>
                <Select value={editing.campaign_id ?? ""} onValueChange={(v) => setEditing({ ...editing, campaign_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Abbrechen</Button>
            <button onClick={saveLead} disabled={busy} className={GLASS_BTN}><CheckCircle2 className="w-4 h-4" /> Speichern</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Preview/Senden-Dialog ====== */}
      <Dialog open={!!previewLead} onOpenChange={(o) => !o && setPreviewLead(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-Mail an {previewLead?.company} <span className="text-xs text-muted-foreground">({previewLead?.email})</span>
            </DialogTitle>
          </DialogHeader>
          {previewDraft ? (
            <div className="flex-1 min-h-0 grid md:grid-cols-2 overflow-hidden">
              <div className="p-4 overflow-y-auto space-y-3 border-r">
                <div><Label>Betreff</Label><Input value={previewDraft.subject} onChange={(e) => setPreviewDraft({ ...previewDraft, subject: e.target.value })} /></div>
                <div><Label>HTML</Label><Textarea rows={10} className="font-mono text-xs" value={previewDraft.body_html} onChange={(e) => setPreviewDraft({ ...previewDraft, body_html: e.target.value })} /></div>
                <div><Label>Plaintext</Label><Textarea rows={4} value={previewDraft.body_text} onChange={(e) => setPreviewDraft({ ...previewDraft, body_text: e.target.value })} /></div>
                {previewDraft.error_message && <p className="text-xs text-destructive">⚠ {previewDraft.error_message}</p>}
                <p className="text-xs text-muted-foreground">Status: {previewDraft.status}{previewDraft.sent_at ? ` · gesendet ${new Date(previewDraft.sent_at).toLocaleString("de-DE")}` : ""}</p>
              </div>
              <div className="p-4 overflow-y-auto bg-muted/20">
                <p className="text-xs text-muted-foreground mb-2">Vorschau wie beim Empfänger</p>
                <div className="bg-white rounded shadow-sm overflow-hidden">
                  <iframe
                    srcDoc={`<div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;color:#1A1A1A;line-height:1.6;background:#fff"><div style="background:#1A1A1A;color:#F5EFE3;padding:22px;text-align:center;letter-spacing:.18em">HEIDEHOF</div><div style="border:1px solid #E5DCC7;border-top:0;padding:28px"><h2 style="font-family:Georgia,serif;margin:0 0 12px">${previewDraft.subject || ""}</h2>${previewDraft.body_html || ""}</div></div>`}
                    className="w-full h-[60vh] border-0" title="Vorschau"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Kein Entwurf – bitte „KI-Mail erzeugen“ klicken.</div>
          )}
          <DialogFooter className="p-3 border-t shrink-0 gap-2">
            <Button variant="ghost" onClick={() => setPreviewLead(null)}>Schließen</Button>
            {previewDraft && (
              <>
                <button onClick={regenPreview} disabled={busy} className={GLASS_BTN_SM}><RefreshCw className="w-3.5 h-3.5" /> KI neu</button>
                <button onClick={savePreview} disabled={busy} className={GLASS_BTN_SM}><CheckCircle2 className="w-3.5 h-3.5" /> Speichern</button>
                <button onClick={sendPreview} disabled={busy} className={GLASS_BTN}><Send className="w-4 h-4" /> Jetzt senden</button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsList;
