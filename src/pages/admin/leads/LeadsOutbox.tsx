import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wand2, CheckCircle2, X, Send, Upload, Trash2, FileText, Eye } from "lucide-react";

interface Draft {
  id: string;
  lead_id: string;
  campaign_id: string | null;
  subject: string;
  body_html: string;
  body_text: string;
  status: string;
  images: any[];
  attachments: any[];
  error_message: string | null;
  created_at: string;
  lead: { company: string; contact_name: string | null; email: string | null; city: string | null };
}

const LeadsOutbox = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("lead_email_drafts")
      .select("*, lead:leads(company, contact_name, email, city)")
      .in("status", ["draft", "approved", "error"])
      .order("created_at", { ascending: true });
    setDrafts((data as any) || []);
    if (!activeId && data?.length) setActiveId((data[0] as any).id);
  };
  useEffect(() => { void load(); }, []);

  const active = useMemo(() => drafts.find((d) => d.id === activeId), [drafts, activeId]);

  const updateActive = (patch: Partial<Draft>) => {
    setDrafts(drafts.map((d) => (d.id === activeId ? { ...d, ...patch } : d)));
  };

  const callDraft = async (action: string, extra: any = {}) => {
    if (!active) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("lead-draft", { body: { action, draftId: active.id, ...extra } });
    setBusy(false);
    if (error || !data?.ok) { toast.error(data?.error || error?.message || "Fehler"); return null; }
    return data;
  };

  const save = async () => {
    if (!active) return;
    await callDraft("update", { subject: active.subject, body_html: active.body_html, body_text: active.body_text, images: active.images, attachments: active.attachments });
    toast.success("Gespeichert");
    await load();
  };
  const regen = async () => {
    const data = await callDraft("regenerate");
    if (data?.draft) { updateActive(data.draft); toast.success("Neuer Entwurf von KI"); }
  };
  const approve = async () => { if (await callDraft("approve")) { toast.success("Freigegeben"); await load(); } };
  const discard = async () => { if (await callDraft("discard")) { toast.success("Verworfen"); await load(); } };
  const sendNow = async () => { if (await callDraft("send_now")) { toast.success("Versendet"); await load(); } };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !active) return;
    const path = `drafts/${active.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("lead-assets").upload(path, file, { contentType: file.type });
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("lead-assets").getPublicUrl(path);
    updateActive({ images: [...(active.images || []), { url: pub.publicUrl, alt: file.name, path }] });
  };

  const uploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !active) return;
    const path = `drafts/${active.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("lead-assets").upload(path, file, { contentType: file.type });
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("lead-assets").getPublicUrl(path);
    updateActive({ attachments: [...(active.attachments || []), { url: pub.publicUrl, name: file.name, path }] });
  };

  const previewHtml = active
    ? `<div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;color:#1A1A1A;line-height:1.6;background:#fff">
        <div style="background:#1A1A1A;color:#F5EFE3;padding:22px;text-align:center;letter-spacing:.18em">HEIDEHOF</div>
        <div style="border:1px solid #E5DCC7;border-top:0;padding:28px">
          ${active.body_html}
          ${(active.images || []).map((i: any) => `<img src="${i.url}" style="max-width:100%;border-radius:8px;margin:12px 0" />`).join("")}
          ${(active.attachments || []).length ? `<p style="margin:18px 0 0;font-size:13px"><strong>Anhang:</strong> ${active.attachments.map((a: any) => `<a href="${a.url}">${a.name}</a>`).join(", ")}</p>` : ""}
        </div>
      </div>`
    : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="p-3 h-fit max-h-[calc(100vh-220px)] overflow-y-auto">
        <h2 className="font-semibold mb-2">Warteschlange ({drafts.length})</h2>
        <ul className="space-y-1">
          {drafts.map((d) => (
            <li key={d.id}>
              <button onClick={() => setActiveId(d.id)}
                className={`w-full text-left rounded p-2 text-sm transition-colors ${activeId === d.id ? "bg-foreground text-background" : "hover:bg-muted"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{d.lead?.company}</p>
                  <Badge variant="outline" className="text-xs">{d.status}</Badge>
                </div>
                <p className="text-xs opacity-70 truncate">{d.lead?.email}</p>
              </button>
            </li>
          ))}
          {drafts.length === 0 && <p className="text-sm text-muted-foreground p-2">Keine Entwürfe. Erzeuge welche unter „Kampagnen".</p>}
        </ul>
      </Card>

      {active ? (
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">An</p>
                <p className="font-medium">{active.lead?.company} · {active.lead?.email}</p>
              </div>
              <Badge>{active.status}</Badge>
            </div>
            {active.error_message && <p className="text-sm text-destructive">⚠ {active.error_message}</p>}

            <div><Label>Betreff</Label><Input value={active.subject || ""} onChange={(e) => updateActive({ subject: e.target.value })} /></div>
            <div><Label>HTML-Body</Label><Textarea rows={10} className="font-mono text-xs" value={active.body_html || ""} onChange={(e) => updateActive({ body_html: e.target.value })} /></div>
            <div><Label>Plaintext-Variante</Label><Textarea rows={4} value={active.body_text || ""} onChange={(e) => updateActive({ body_text: e.target.value })} /></div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Bilder ({active.images?.length || 0})</Label>
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <Button variant="outline" size="sm" asChild><span><Upload className="w-3 h-3 mr-1" /> Bild</span></Button>
                  <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(active.images || []).map((img: any, i: number) => (
                    <div key={i} className="relative group">
                      <img src={img.url} alt="" className="w-full h-16 object-cover rounded" />
                      <button onClick={() => updateActive({ images: active.images.filter((_: any, j: number) => j !== i) })} className="absolute top-0 right-0 bg-background/90 rounded p-0.5 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>PDF-Anhang ({active.attachments?.length || 0})</Label>
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <Button variant="outline" size="sm" asChild><span><FileText className="w-3 h-3 mr-1" /> PDF</span></Button>
                  <input type="file" accept="application/pdf" className="hidden" onChange={uploadPdf} />
                </label>
                <ul className="mt-2 space-y-1">
                  {(active.attachments || []).map((a: any, i: number) => (
                    <li key={i} className="text-xs flex items-center justify-between gap-2 p-1 bg-muted rounded">
                      <a href={a.url} target="_blank" rel="noreferrer" className="underline truncate">{a.name}</a>
                      <button onClick={() => updateActive({ attachments: active.attachments.filter((_: any, j: number) => j !== i) })}><X className="w-3 h-3" /></button>
                    </li>
                  ))}
                </ul>
                {(active.attachments || []).slice(0, 1).map((a: any, i: number) => (
                  <iframe key={i} src={a.url} className="w-full h-48 mt-2 border rounded" title="PDF-Vorschau" />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-neutral-900/80 text-white border border-white/10 backdrop-blur-md shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:bg-neutral-800/90 transition-all disabled:opacity-50">Speichern</button>
              <button onClick={regen} disabled={busy} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-neutral-900/40 text-white border border-white/10 backdrop-blur-md hover:bg-neutral-900/70 transition-all disabled:opacity-50"><Wand2 className="w-4 h-4" /> KI neu generieren</button>
              <button onClick={approve} disabled={busy} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-neutral-900/40 text-white border border-white/10 backdrop-blur-md hover:bg-neutral-900/70 transition-all disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> Freigeben</button>
              <button onClick={sendNow} disabled={busy} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-neutral-900/80 text-white border border-white/10 backdrop-blur-md shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:bg-neutral-800/90 transition-all disabled:opacity-50"><Send className="w-4 h-4" /> Jetzt senden</button>
              <button onClick={discard} disabled={busy} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-red-950/70 text-red-100 border border-red-500/30 backdrop-blur-md hover:bg-red-900/80 transition-all disabled:opacity-50"><X className="w-4 h-4" /> Verwerfen</button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Eye className="w-4 h-4" /> Vorschau wie beim Empfänger</h3>
            <div className="border rounded overflow-hidden bg-white">
              <iframe srcDoc={previewHtml} className="w-full h-[500px]" title="E-Mail-Vorschau" />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-10 text-center text-muted-foreground">Wähle links einen Entwurf.</Card>
      )}
    </div>
  );
};

export default LeadsOutbox;
