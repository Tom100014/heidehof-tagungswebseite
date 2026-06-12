import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const WEEKDAYS = [
  { value: 1, label: "Mo" }, { value: 2, label: "Di" }, { value: 3, label: "Mi" },
  { value: 4, label: "Do" }, { value: 5, label: "Fr" }, { value: 6, label: "Sa" }, { value: 7, label: "So" },
];

const LeadsAutomation = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [rows, setRows] = useState<Record<string, any>>({});

  const load = async () => {
    const [c, a] = await Promise.all([
      supabase.from("lead_campaigns").select("id, name").order("name"),
      supabase.from("lead_automation").select("*"),
    ]);
    setCampaigns(c.data || []);
    const map: Record<string, any> = {};
    (c.data || []).forEach((cc) => {
      const existing = (a.data || []).find((x: any) => x.campaign_id === cc.id);
      map[cc.id] = existing || { campaign_id: cc.id, is_active: false, send_hour_start: 9, send_hour_end: 18, daily_cap: 25, weekdays: [1,2,3,4,5] };
    });
    setRows(map);
  };
  useEffect(() => { void load(); }, []);

  const save = async (id: string) => {
    const r = rows[id];
    const { error } = await supabase.from("lead_automation").upsert(r, { onConflict: "campaign_id" });
    if (error) return toast.error(error.message);
    toast.success("Gespeichert");
  };

  const toggleDay = (id: string, day: number) => {
    const r = rows[id]; const days = new Set<number>(r.weekdays || []);
    days.has(day) ? days.delete(day) : days.add(day);
    setRows({ ...rows, [id]: { ...r, weekdays: Array.from(days).sort() } });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Stündlicher Cron sendet freigegebene Entwürfe automatisch — innerhalb des Zeitfensters, an erlaubten Wochentagen, bis zum Tageslimit.</p>
      {campaigns.map((c) => {
        const r = rows[c.id]; if (!r) return null;
        return (
          <Card key={c.id} className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{c.name}</h3>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Aktiv</Label>
                <Switch checked={!!r.is_active} onCheckedChange={(v) => setRows({ ...rows, [c.id]: { ...r, is_active: v } })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label>Start (Stunde)</Label><Input type="number" min={0} max={23} value={r.send_hour_start} onChange={(e) => setRows({ ...rows, [c.id]: { ...r, send_hour_start: Number(e.target.value) } })} /></div>
              <div><Label>Ende (Stunde)</Label><Input type="number" min={0} max={23} value={r.send_hour_end} onChange={(e) => setRows({ ...rows, [c.id]: { ...r, send_hour_end: Number(e.target.value) } })} /></div>
              <div><Label>Tageslimit</Label><Input type="number" min={1} max={500} value={r.daily_cap} onChange={(e) => setRows({ ...rows, [c.id]: { ...r, daily_cap: Number(e.target.value) } })} /></div>
            </div>
            <div>
              <Label>Wochentage</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {WEEKDAYS.map((d) => (
                  <button key={d.value} type="button" onClick={() => toggleDay(c.id, d.value)}
                    className={`px-3 py-1.5 rounded text-sm ${r.weekdays?.includes(d.value) ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            {r.last_run_at && <p className="text-xs text-muted-foreground">Letzter Lauf: {new Date(r.last_run_at).toLocaleString("de-DE")} · {r.last_run_stats?.sent ?? 0} versendet</p>}
            <Button onClick={() => save(c.id)}>Speichern</Button>
          </Card>
        );
      })}
      {campaigns.length === 0 && <p className="text-sm text-muted-foreground">Erstelle zuerst eine Kampagne.</p>}
    </div>
  );
};

export default LeadsAutomation;
