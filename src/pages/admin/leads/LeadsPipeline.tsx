import { useState } from "react";
import { useLeadPipeline, type Deal, STAGES } from "@/hooks/useLeadPipeline";
import { PipelineBoard } from "@/components/admin/leads/PipelineBoard";
import { DealDrawer } from "@/components/admin/leads/DealDrawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, TrendingUp, Target, Trophy } from "lucide-react";

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function LeadsPipeline() {
  const { deals, loading, reload, updateStage } = useLeadPipeline();
  const [open, setOpen] = useState<Deal | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [value, setValue] = useState(0);
  const [eventType, setEventType] = useState("Tagung");
  const [persons, setPersons] = useState<number | "">("");
  const [leads, setLeads] = useState<{ id: string; company: string }[]>([]);

  const loadLeads = async () => {
    const { data } = await supabase.from("leads").select("id,company").order("company");
    setLeads((data as any) || []);
  };

  const create = async () => {
    if (!leadId) return toast.error("Lead auswählen");
    const { error } = await (supabase as any).from("pipeline_deals").insert({
      lead_id: leadId,
      estimated_value: value,
      event_type: eventType,
      expected_persons: persons || null,
      stage: "lead",
    });
    if (error) return toast.error(error.message);
    toast.success("Deal angelegt");
    setCreateOpen(false);
    setLeadId(""); setValue(0); setPersons("");
    await reload();
  };

  const totalValue = deals.filter((d) => !["won", "lost"].includes(d.stage))
    .reduce((s, d) => s + Number(d.estimated_value || 0), 0);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((s, d) => s + Number(d.estimated_value || 0), 0);
  const activeCount = deals.filter((d) => !["won", "lost"].includes(d.stage)).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 flex items-center gap-3 bg-card/60 backdrop-blur-md border-border/60">
          <Target className="w-8 h-8 text-amber-400" />
          <div>
            <p className="text-xs text-muted-foreground">Aktive Deals</p>
            <p className="text-2xl font-semibold">{activeCount}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 bg-card/60 backdrop-blur-md border-border/60">
          <TrendingUp className="w-8 h-8 text-amber-400" />
          <div>
            <p className="text-xs text-muted-foreground">Pipeline-Wert</p>
            <p className="text-2xl font-semibold text-amber-400">{eur(totalValue)}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 bg-card/60 backdrop-blur-md border-border/60">
          <Trophy className="w-8 h-8 text-emerald-400" />
          <div>
            <p className="text-xs text-muted-foreground">Gewonnen (Umsatz)</p>
            <p className="text-2xl font-semibold text-emerald-400">{eur(wonValue)}</p>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Sales-Pipeline</h2>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (o) void loadLeads(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Neuer Deal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Deal anlegen</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Lead</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger><SelectValue placeholder="Lead wählen…" /></SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.company}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Event-Typ</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Tagung", "Seminar", "Workshop", "Firmenfeier", "Klausur", "Sonstiges"].map((t) =>
                      <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Wert (€)</Label>
                  <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Personen</Label>
                  <Input type="number" value={persons} onChange={(e) => setPersons(e.target.value ? Number(e.target.value) : "")} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
              <Button onClick={create}>Anlegen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <PipelineBoard deals={deals} loading={loading} onMove={updateStage} onOpen={setOpen} />

      <DealDrawer deal={open} onClose={() => setOpen(null)} onSaved={reload} />

      {!loading && deals.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          Noch keine Deals in der Pipeline.<br />
          Lege einen ersten Deal an oder erstelle Deals direkt aus der Lead-Liste.
        </Card>
      )}
    </div>
  );
}
