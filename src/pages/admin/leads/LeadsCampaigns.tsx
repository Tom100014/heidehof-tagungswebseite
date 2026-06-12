import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Plus, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GLASS_BTN =
  "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium " +
  "bg-neutral-900/80 text-white border border-white/10 backdrop-blur-md " +
  "shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:bg-neutral-800/90 hover:border-white/20 " +
  "transition-all disabled:opacity-50 disabled:cursor-not-allowed";

interface Campaign {
  id: string;
  name: string;
  status: string;
  daily_cap: number;
  stats: any;
  filters: any;
  created_at: string;
}

const LeadsCampaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [active, setActive] = useState<Campaign | null>(null);
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState(25);
  const [count, setCount] = useState(15);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("lead_campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) || []);
    if (!active && data?.length) setActive(data[0] as Campaign);
  };

  useEffect(() => { void load(); }, []);

  const createCampaign = async () => {
    if (!name.trim()) return toast.error("Name fehlt");
    const { data, error } = await supabase.from("lead_campaigns").insert({ name: name.trim() }).select("*").single();
    if (error) return toast.error(error.message);
    setName(""); setActive(data as Campaign); await load();
    toast.success("Kampagne erstellt");
  };

  const search = async () => {
    if (!active) return;
    if (!industry || !city) return toast.error("Branche und Stadt erforderlich");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("lead-agent", {
      body: { action: "search", campaignId: active.id, industry, city, radius, count },
    });
    setBusy(false);
    if (error || !data?.ok) return toast.error(data?.error || error?.message || "Fehler");
    toast.success(`${data.inserted} Leads gefunden`);
    await load();
  };

  const generateDrafts = async () => {
    if (!active) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("lead-agent", {
      body: { action: "generate_drafts", campaignId: active.id },
    });
    setBusy(false);
    if (error || !data?.ok) return toast.error(data?.error || error?.message || "Fehler");
    toast.success(`${data.created} Entwürfe erstellt – jetzt im Versand-Center prüfen`);
    navigate("/admin/leads/outbox");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="p-4 space-y-3 h-fit">
        <h2 className="font-semibold">Kampagnen</h2>
        <div className="flex gap-2">
          <Input placeholder="Neue Kampagne" value={name} onChange={(e) => setName(e.target.value)} />
          <button onClick={createCampaign} className={GLASS_BTN} aria-label="Neu"><Plus className="w-4 h-4" /></button>
        </div>
        <ul className="space-y-1">
          {campaigns.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActive(c)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm transition-all backdrop-blur-md border ${active?.id === c.id ? "bg-neutral-900/85 text-white border-white/15" : "bg-neutral-900/15 border-white/5 hover:bg-neutral-900/40 hover:text-white"}`}
              >
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs opacity-70">{c.status} · {c.stats?.sent ?? 0} gesendet</p>
              </button>
            </li>
          ))}
          {campaigns.length === 0 && <p className="text-sm text-muted-foreground">Keine Kampagnen.</p>}
        </ul>
      </Card>

      {active ? (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Leads suchen – {active.name}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Branche</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Zahnarzt, Bauunternehmen…" /></div>
              <div><Label>Stadt / PLZ</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div><Label>Umkreis (km)</Label><Input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} /></div>
              <div><Label>Anzahl Leads</Label><Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} /></div>
            </div>
            <button onClick={search} disabled={busy} className={`${GLASS_BTN} w-full`}>
              <Sparkles className="w-4 h-4" /> {busy ? "Sucht…" : "Suche starten"}
            </button>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Wand2 className="w-5 h-5" /> KI-Entwürfe erzeugen</h3>
            <p className="text-sm text-muted-foreground">Erzeugt für jeden Lead mit E-Mail einen personalisierten Mail-Entwurf. Anschließend kannst du sie unter „Leads“ einzeln prüfen, anpassen und versenden.</p>
            <button onClick={generateDrafts} disabled={busy} className={GLASS_BTN}>{busy ? "Erzeuge…" : "Entwürfe für alle Leads erzeugen"}</button>
          </Card>
        </div>
      ) : (
        <Card className="p-10 text-center text-muted-foreground">Wähle oder erstelle links eine Kampagne.</Card>
      )}
    </div>
  );
};

export default LeadsCampaigns;
