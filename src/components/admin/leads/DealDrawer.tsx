import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { STAGES, type Deal, type DealStage } from "@/hooks/useLeadPipeline";
import { useLeadActivities } from "@/hooks/useLeadActivities";
import { ActivityFeed } from "./ActivityFeed";
import { Trash2, Save, FileText } from "lucide-react";

interface Props {
  deal: Deal | null;
  onClose: () => void;
  onSaved: () => void;
}

const EVENT_TYPES = ["Tagung", "Seminar", "Workshop", "Firmenfeier", "Klausur", "Sonstiges"];

export function DealDrawer({ deal, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Deal | null>(deal);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { items, reload } = useLeadActivities({ leadId: deal?.lead_id, limit: 30 });

  useEffect(() => setForm(deal), [deal]);

  if (!deal || !form) return null;

  const save = async () => {
    setBusy(true);
    const { error } = await (supabase as any).from("pipeline_deals").update({
      stage: form.stage,
      estimated_value: form.estimated_value,
      event_type: form.event_type,
      expected_persons: form.expected_persons,
      expected_date: form.expected_date,
      probability: form.probability,
      notes: form.notes,
    }).eq("id", form.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Deal gespeichert");
    onSaved();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await (supabase as any).from("lead_activities").insert({
      lead_id: form.lead_id,
      deal_id: form.id,
      type: "note",
      payload: { text: note.trim() },
    });
    setNote("");
    await reload();
  };

  const removeDeal = async () => {
    if (!confirm("Deal löschen?")) return;
    setBusy(true);
    const { error } = await (supabase as any).from("pipeline_deals").delete().eq("id", form.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Deal gelöscht");
    onClose();
    onSaved();
  };

  const toInquiry = async () => {
    setBusy(true);
    const { error } = await supabase.from("tagungs_inquiries").insert({
      contact_name: form.lead?.contact_name || "—",
      contact_company: form.lead?.company || "—",
      contact_email: form.lead?.email || null,
      participants: form.expected_persons || null,
      event_date: form.expected_date || null,
      message: `Aus Lead-Pipeline übernommen. Deal-ID: ${form.id}\n\n${form.notes || ""}`,
      status: "neu",
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Tagungs-Anfrage erstellt");
  };

  return (
    <Sheet open={!!deal} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">{form.lead?.company || "Deal"}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2 text-sm">
          {form.lead?.contact_name && <p>{form.lead.contact_name}</p>}
          {form.lead?.email && <p className="font-mono text-xs text-muted-foreground">{form.lead.email}</p>}
          {form.lead?.city && <p className="text-muted-foreground">{form.lead.city}</p>}
          <div className="flex gap-2 flex-wrap">
            {form.lead?.industry && <Badge variant="outline">{form.lead.industry}</Badge>}
            {form.lead?.lead_score !== undefined && <Badge variant="outline">Score {form.lead.lead_score}</Badge>}
            {form.lead?.status && <Badge variant="secondary">{form.lead.status}</Badge>}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Stage</Label>
            <Select value={form.stage} onValueChange={(v: DealStage) => setForm({ ...form, stage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Event-Typ</Label>
            <Select value={form.event_type || ""} onValueChange={(v) => setForm({ ...form, event_type: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Erwarteter Wert (€)</Label>
            <Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Wahrscheinlichkeit (%)</Label>
            <Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Personen</Label>
            <Input type="number" value={form.expected_persons || ""} onChange={(e) => setForm({ ...form, expected_persons: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <Label>Datum</Label>
            <Input type="date" value={form.expected_date || ""} onChange={(e) => setForm({ ...form, expected_date: e.target.value || null })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notizen</Label>
            <Textarea rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={save} disabled={busy}><Save className="w-4 h-4 mr-2" />Speichern</Button>
          <Button variant="outline" onClick={toInquiry} disabled={busy}><FileText className="w-4 h-4 mr-2" />Zu Tagungs-Anfrage</Button>
          <div className="flex-1" />
          <Button variant="destructive" onClick={removeDeal} disabled={busy}><Trash2 className="w-4 h-4 mr-2" />Löschen</Button>
        </div>

        <div className="mt-6 space-y-2">
          <Label>Notiz hinzufügen</Label>
          <div className="flex gap-2">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Kurze Notiz, Anruf-Ergebnis…" />
            <Button onClick={addNote} disabled={!note.trim()}>+</Button>
          </div>
        </div>

        <div className="mt-6">
          <ActivityFeed items={items} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
