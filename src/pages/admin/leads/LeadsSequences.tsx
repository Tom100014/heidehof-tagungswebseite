import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Trash2, ArrowUp, ArrowDown, Workflow, UserPlus, Loader2, Save,
} from "lucide-react";

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  campaign_id: string | null;
  is_active: boolean;
}
interface Step {
  id: string;
  sequence_id: string;
  step_order: number;
  wait_days: number;
  template_key: string | null;
  subject: string | null;
  body_html: string | null;
  use_ai: boolean;
}
interface Campaign { id: string; name: string }

const LeadsSequences = () => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stepsBySeq, setStepsBySeq] = useState<Record<string, Step[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [enrollFor, setEnrollFor] = useState<Sequence | null>(null);
  const [enrollCount, setEnrollCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [seqRes, stepRes, campRes] = await Promise.all([
      (supabase as any).from("email_sequences").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("sequence_steps").select("*").order("step_order", { ascending: true }),
      supabase.from("lead_campaigns").select("id,name").order("created_at", { ascending: false }),
    ]);
    setSequences((seqRes.data as Sequence[]) || []);
    setCampaigns((campRes.data as Campaign[]) || []);
    const map: Record<string, Step[]> = {};
    for (const s of (stepRes.data as Step[]) || []) {
      (map[s.sequence_id] ||= []).push(s);
    }
    setStepsBySeq(map);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createSequence = async () => {
    if (!newName.trim()) return;
    const { error } = await (supabase as any).from("email_sequences").insert({ name: newName.trim() });
    if (error) return toast.error(error.message);
    setNewName("");
    await load();
  };

  const updateSeq = async (id: string, patch: Partial<Sequence>) => {
    const { error } = await (supabase as any).from("email_sequences").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  };

  const deleteSeq = async (id: string) => {
    if (!confirm("Sequenz löschen? Alle Schritte werden ebenfalls entfernt.")) return;
    const { error } = await (supabase as any).from("email_sequences").delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  };

  const addStep = async (seq: Sequence) => {
    const steps = stepsBySeq[seq.id] || [];
    const next = steps.length + 1;
    const { error } = await (supabase as any).from("sequence_steps").insert({
      sequence_id: seq.id,
      step_order: next,
      wait_days: next === 1 ? 0 : 3,
      template_key: `follow_up_${Math.min(next, 3)}`,
      use_ai: true,
    });
    if (error) toast.error(error.message);
    else await load();
  };

  const updateStep = async (id: string, patch: Partial<Step>) => {
    const { error } = await (supabase as any).from("sequence_steps").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const deleteStep = async (id: string) => {
    if (!confirm("Schritt löschen?")) return;
    const { error } = await (supabase as any).from("sequence_steps").delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  };

  const moveStep = async (step: Step, dir: -1 | 1) => {
    const list = (stepsBySeq[step.sequence_id] || []).sort((a, b) => a.step_order - b.step_order);
    const idx = list.findIndex((s) => s.id === step.id);
    const swap = list[idx + dir];
    if (!swap) return;
    await Promise.all([
      (supabase as any).from("sequence_steps").update({ step_order: swap.step_order }).eq("id", step.id),
      (supabase as any).from("sequence_steps").update({ step_order: step.step_order }).eq("id", swap.id),
    ]);
    await load();
  };

  const previewEnrollmentCount = useCallback(async (seq: Sequence) => {
    if (!seq.campaign_id) { setEnrollCount(0); return; }
    const { count } = await supabase
      .from("leads")
      .select("id", { head: true, count: "exact" })
      .eq("campaign_id", seq.campaign_id)
      .eq("unsubscribed", false)
      .eq("do_not_contact", false)
      .is("replied_at", null)
      .is("enrolled_sequence_id", null)
      .not("email", "is", null);
    setEnrollCount(count ?? 0);
  }, []);

  const enrollLeads = async () => {
    if (!enrollFor || !enrollFor.campaign_id) return;
    setBusy(true);
    const { data: targets, error: selErr } = await supabase
      .from("leads")
      .select("id")
      .eq("campaign_id", enrollFor.campaign_id)
      .eq("unsubscribed", false)
      .eq("do_not_contact", false)
      .is("replied_at", null)
      .is("enrolled_sequence_id", null)
      .not("email", "is", null);
    if (selErr) { setBusy(false); return toast.error(selErr.message); }
    const ids = (targets || []).map((t: any) => t.id);
    if (!ids.length) { setBusy(false); toast.info("Keine passenden Leads"); return; }
    const { error } = await supabase
      .from("leads")
      .update({
        enrolled_sequence_id: enrollFor.id,
        enrolled_step: 0,
        enrolled_at: new Date().toISOString(),
      } as any)
      .in("id", ids);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} Leads eingeschrieben`);
    setEnrollFor(null);
    setEnrollCount(null);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Lade Sequenzen…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/60 backdrop-blur-md border-border flex flex-wrap items-center gap-2">
        <Workflow className="w-4 h-4 text-muted-foreground" />
        <Input
          className="flex-1 min-w-[240px]"
          placeholder="Name der neuen Sequenz…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button onClick={createSequence}><Plus className="w-4 h-4 mr-1" /> Sequenz anlegen</Button>
      </Card>

      {sequences.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          Noch keine Sequenz. Lege oben eine an, füge Schritte hinzu und schreibe Leads ein.
        </Card>
      )}

      {sequences.map((seq) => {
        const steps = (stepsBySeq[seq.id] || []).sort((a, b) => a.step_order - b.step_order);
        return (
          <Card key={seq.id} className="bg-card border-border overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border bg-muted/20">
              <Input
                className="font-semibold w-auto min-w-[240px] bg-transparent border-transparent text-base focus:border-border"
                defaultValue={seq.name}
                onBlur={(e) => e.target.value !== seq.name && updateSeq(seq.id, { name: e.target.value })}
              />
              <Select
                value={seq.campaign_id ?? "none"}
                onValueChange={(v) => updateSeq(seq.id, { campaign_id: v === "none" ? null : v })}
              >
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Kampagne" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— keine Kampagne —</SelectItem>
                  {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={seq.is_active} onCheckedChange={(v) => updateSeq(seq.id, { is_active: v })} />
                <span className="text-xs text-muted-foreground">{seq.is_active ? "aktiv" : "pausiert"}</span>
              </div>
              <Badge variant="outline">{steps.length} Schritt{steps.length === 1 ? "" : "e"}</Badge>
              <div className="flex-1" />
              <Button
                variant="outline" size="sm"
                disabled={!seq.campaign_id}
                onClick={() => { setEnrollFor(seq); void previewEnrollmentCount(seq); }}
              >
                <UserPlus className="w-4 h-4 mr-1" /> Leads einschreiben
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteSeq(seq.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-3">
              {steps.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Schritte. Lege den ersten an.</p>
              )}

              {steps.map((step, i) => (
                <div key={step.id} className="border border-border rounded-md p-3 space-y-3 bg-background/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{i + 1}</Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => moveStep(step, -1)}>
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={i === steps.length - 1} onClick={() => moveStep(step, 1)}>
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Warte (Tage)</Label>
                      <Input
                        type="number" min={0} className="w-20"
                        defaultValue={step.wait_days}
                        onBlur={(e) => updateStep(step.id, { wait_days: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Template-Key</Label>
                      <Input
                        className="w-44" defaultValue={step.template_key ?? ""}
                        onBlur={(e) => updateStep(step.id, { template_key: e.target.value || null })}
                        placeholder="follow_up_1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={step.use_ai}
                        onCheckedChange={(v) => updateStep(step.id, { use_ai: v })}
                      />
                      <span className="text-xs text-muted-foreground">KI personalisiert</span>
                    </div>
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => deleteStep(step.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {!step.use_ai && (
                    <div className="grid gap-2">
                      <Input
                        placeholder="Betreff"
                        defaultValue={step.subject ?? ""}
                        onBlur={(e) => updateStep(step.id, { subject: e.target.value || null })}
                      />
                      <Textarea
                        rows={4} placeholder="<p>HTML-Body … {{name}}</p>"
                        defaultValue={step.body_html ?? ""}
                        onBlur={(e) => updateStep(step.id, { body_html: e.target.value || null })}
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={() => addStep(seq)}>
                <Plus className="w-4 h-4 mr-1" /> Schritt hinzufügen
              </Button>
            </div>
          </Card>
        );
      })}

      <Dialog open={!!enrollFor} onOpenChange={(o) => { if (!o) { setEnrollFor(null); setEnrollCount(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Leads in „{enrollFor?.name}" einschreiben</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Alle qualifizierten Leads dieser Kampagne werden in die Sequenz eingeschrieben:</p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>Kampagne der Sequenz</li>
              <li>E-Mail vorhanden</li>
              <li>nicht abgemeldet, nicht „do not contact", nicht bereits geantwortet</li>
              <li>noch nicht eingeschrieben</li>
            </ul>
            <p className="pt-2">
              <strong>{enrollCount ?? "…"}</strong> passende Leads gefunden.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollFor(null)}>Abbrechen</Button>
            <Button onClick={enrollLeads} disabled={busy || !enrollCount}>
              {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Einschreiben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsSequences;
