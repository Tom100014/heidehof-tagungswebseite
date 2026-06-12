import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export type ResourceKind = "staff" | "facility";

interface Props {
  resourceKind: ResourceKind;
  resourceId: string;
}

/**
 * Generischer Verfügbarkeits-Editor.
 * - staff    -> public.beauty_shifts (Spalten: staff_id, weekday, start_time, end_time, valid_from, valid_to)
 * - facility -> public.beauty_facility_availability (Spalten: facility_id, weekday, start_time, end_time, repeat_weekly, repeat_until)
 */
export function AvailabilityEditor({ resourceKind, resourceId }: Props) {
  const table = resourceKind === "staff" ? "beauty_shifts" : "beauty_facility_availability";
  const fk = resourceKind === "staff" ? "staff_id" : "facility_id";

  const [rows, setRows] = useState<any[]>([]);
  const [weekday, setWeekday] = useState<string>("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [repeatWeekly, setRepeatWeekly] = useState(true);
  const [until, setUntil] = useState<string>("");

  const load = async () => {
    const { data } = await supabase
      .from(table as any)
      .select("*")
      .eq(fk, resourceId)
      .order("weekday")
      .order("start_time");
    setRows((data as any) ?? []);
  };
  useEffect(() => { void load(); }, [resourceId]);

  const add = async () => {
    const payload: any = { [fk]: resourceId, weekday: Number(weekday), start_time: start, end_time: end };
    if (resourceKind === "facility") {
      payload.repeat_weekly = repeatWeekly;
      if (until) payload.repeat_until = until;
    } else if (until) {
      payload.valid_to = until;
    }
    const { error } = await supabase.from(table as any).insert(payload);
    if (error) toast.error(error.message); else { toast.success("Verfügbarkeit gespeichert"); void load(); }
  };

  const remove = async (id: string) => {
    await supabase.from(table as any).delete().eq("id", id);
    void load();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
        <div>
          <Label className="text-xs">Wochentag</Label>
          <Select value={weekday} onValueChange={setWeekday}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Von</Label>
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)}/>
        </div>
        <div>
          <Label className="text-xs">Bis</Label>
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)}/>
        </div>
        {resourceKind === "facility" && (
          <div className="flex items-center gap-2 pt-5">
            <input id={`rep-${resourceId}`} type="checkbox" checked={repeatWeekly}
              onChange={(e) => setRepeatWeekly(e.target.checked)} />
            <Label htmlFor={`rep-${resourceId}`} className="text-xs">wöchentlich</Label>
          </div>
        )}
        <div>
          <Label className="text-xs">{resourceKind === "facility" ? "Bis-Datum" : "Gültig bis"}</Label>
          <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)}/>
        </div>
        <Button onClick={add}><Plus className="h-4 w-4 mr-1"/>Hinzu</Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Noch keine Verfügbarkeiten hinterlegt.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between text-sm border-b border-border/40 py-1">
              <span>
                {WEEKDAYS[r.weekday]} · {String(r.start_time).slice(0,5)} – {String(r.end_time).slice(0,5)}
                {r.repeat_until ? ` · bis ${r.repeat_until}` : r.valid_to ? ` · bis ${r.valid_to}` : ""}
                {resourceKind === "facility" && r.repeat_weekly === false ? " · einmalig" : ""}
              </span>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive"/>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
