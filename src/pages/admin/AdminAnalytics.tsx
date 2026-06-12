import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { BarChart3, TrendingUp, Users, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";

type Range = 7 | 30 | 90 | 365;

interface Totals { orders: number; participants: number; fish: number; meat: number; veg: number; perRoom: Record<string, number>; perDay: Record<string, number>; }

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>(30);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [rooms, setRooms] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const from = format(subDays(new Date(), range), "yyyy-MM-dd");
      const to = format(new Date(), "yyyy-MM-dd");
      const [{ data: orders }, { data: rs }] = await Promise.all([
        supabase.from("conference_orders").select("id, room_id, participants, service_date").gte("service_date", from).lte("service_date", to),
        supabase.from("conference_rooms").select("id,name"),
      ]);
      const roomMap: Record<string, string> = {};
      (rs ?? []).forEach((r: any) => { roomMap[r.id] = r.name; });
      setRooms(roomMap);
      const ids = (orders ?? []).map((o: any) => o.id);
      const { data: items } = ids.length ? await supabase.from("conference_order_items")
        .select("order_id, dish_type, quantity").in("order_id", ids).eq("course", "main") : { data: [] };
      const orderToRoom = new Map((orders ?? []).map((o: any) => [o.id, o.room_id]));
      const t: Totals = { orders: orders?.length ?? 0, participants: 0, fish: 0, meat: 0, veg: 0, perRoom: {}, perDay: {} };
      for (const o of orders ?? []) {
        t.participants += o.participants ?? 0;
        t.perRoom[o.room_id] = (t.perRoom[o.room_id] ?? 0) + (o.participants ?? 0);
        t.perDay[o.service_date] = (t.perDay[o.service_date] ?? 0) + (o.participants ?? 0);
      }
      for (const it of items ?? []) {
        if (it.dish_type === "fish") t.fish += it.quantity;
        if (it.dish_type === "meat") t.meat += it.quantity;
        if (it.dish_type === "vegetarian") t.veg += it.quantity;
      }
      setTotals(t);
    })();
  }, [range]);

  return (
    <HeidehofAdminLayout title="Analytics">
      <div className="luxe-bg -m-8 p-6 md:p-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8 reveal">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-amber-300/80 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Insights</div>
              <h1 className="font-display text-5xl gold-text mt-2">Analytics</h1>
              <div className="gold-divider mt-6" />
            </div>
            <div className="inline-flex rounded-full border border-amber-300/25 bg-stone-900/40 p-1">
              {([7,30,90,365] as Range[]).map(d => (
                <button key={d} onClick={() => setRange(d)} className={`px-4 py-1.5 rounded-full text-xs ${range===d?"bg-amber-300 text-stone-900":"text-amber-200/70"}`}>
                  {d===7?"Woche":d===30?"Monat":d===90?"Quartal":"Jahr"}
                </button>
              ))}
            </div>
          </div>

          {totals && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
                <Kpi icon={TrendingUp} label="Bestellungen" value={totals.orders} />
                <Kpi icon={Users} label="Personen" value={totals.participants} />
                <Kpi icon={Utensils} label="🐟 Fisch" value={totals.fish} />
                <Kpi icon={Utensils} label="🥩 Fleisch" value={totals.meat} />
                <Kpi icon={Utensils} label="🌿 Veg." value={totals.veg} />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-3xl p-7">
                  <h3 className="font-display text-2xl text-amber-50 mb-4">Personen pro Raum</h3>
                  {Object.entries(totals.perRoom).sort((a,b)=>b[1]-a[1]).map(([id,v]) => {
                    const max = Math.max(...Object.values(totals.perRoom), 1);
                    return (
                      <div key={id} className="mb-3">
                        <div className="flex justify-between text-sm text-amber-100/80"><span>{rooms[id] ?? id}</span><span className="gold-text">{v}</span></div>
                        <div className="h-2 mt-1 bg-stone-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300" style={{width:`${(v/max)*100}%`}} />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(totals.perRoom).length===0 && <p className="text-amber-100/50 text-sm">Keine Daten.</p>}
                </div>

                <div className="glass-card rounded-3xl p-7">
                  <h3 className="font-display text-2xl text-amber-50 mb-4">Aktivität pro Tag</h3>
                  <div className="flex items-end gap-1 h-48">
                    {Object.entries(totals.perDay).sort().slice(-30).map(([d,v]) => {
                      const max = Math.max(...Object.values(totals.perDay), 1);
                      return <div key={d} className="flex-1 bg-amber-300/60 hover:bg-amber-300 rounded-t transition" style={{height:`${(v/max)*100}%`}} title={`${d}: ${v}`} />;
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </HeidehofAdminLayout>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 text-amber-300/80 text-xs uppercase tracking-[0.25em]"><Icon className="w-4 h-4" />{label}</div>
      <div className="font-display text-4xl gold-text mt-2">{value}</div>
    </div>
  );
}
