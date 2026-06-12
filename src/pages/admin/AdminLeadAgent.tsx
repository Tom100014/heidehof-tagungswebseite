import { useEffect, useMemo, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Plus, RefreshCw, Send, Sparkles, Trash2, Upload, Users } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  mode: string;
  filters: Record<string, unknown>;
  template_key: string;
  daily_cap: number;
  status: string;
  stats: { sent?: number; opened?: number; clicked?: number; replied?: number };
}
interface Lead {
  id: string;
  campaign_id: string | null;
  company: string;
  contact_name: string | null;
  email: string | null;
  city: string | null;
  industry: string | null;
  status: string;
  source: string | null;
  website?: string | null;
  phone?: string | null;
}

export default function AdminLeadAgent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [newName, setNewName] = useState("");
  const [searchIndustry, setSearchIndustry] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchRadius, setSearchRadius] = useState(25);
  const [searchCount, setSearchCount] = useState(50);
  const [isSearching, setIsSearching] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const campaignLeads = useMemo(
    () => (activeCampaign ? leads.filter((lead) => lead.campaign_id === activeCampaign.id) : leads),
    [activeCampaign, leads],
  );

  const load = async () => {
    const { data: c } = await supabase
      .from("lead_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    setCampaigns((c as Campaign[]) || []);
    const { data: l } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLeads((l as Lead[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createCampaign = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("lead_campaigns").insert({
      name: newName.trim(),
      template_key: "lead-outreach",
      status: "draft",
    });
    if (error) return toast.error(error.message);
    setNewName("");
    load();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Kampagne löschen?")) return;
    await supabase.from("lead_campaigns").delete().eq("id", id);
    load();
  };

  const runSearch = async () => {
    if (!activeCampaign) return toast.error("Kampagne wählen");
    if (!searchIndustry.trim() || !searchCity.trim()) return toast.error("Branche und Stadt angeben");
    setIsSearching(true);
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; inserted?: number; error?: string }>("lead-agent", {
      body: {
        action: "search",
        campaignId: activeCampaign.id,
        industry: searchIndustry.trim(),
        city: searchCity.trim(),
        radius: searchRadius,
        count: searchCount,
      },
    });
    setIsSearching(false);
    if (error) return toast.error(error.message);
    if (!data?.ok) return toast.error(data?.error ?? "Lead-Suche fehlgeschlagen");
    toast.success(`${data.inserted ?? 0} Leads gefunden und gespeichert`);
    load();
  };

  const startCampaign = async () => {
    if (!activeCampaign) return toast.error("Kampagne wählen");
    setIsStarting(true);
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; sent?: number; attempted?: number; errors?: string[]; error?: string }>("lead-agent", {
      body: { action: "start_campaign", campaignId: activeCampaign.id },
    });
    setIsStarting(false);
    if (error) return toast.error(error.message);
    if (!data?.ok) return toast.error(data?.error ?? "Kampagne konnte nicht gestartet werden");
    if (data.errors?.length) toast.warning(`${data.sent ?? 0}/${data.attempted ?? 0} E-Mails versendet`, { description: data.errors.slice(0, 2).join(" · ") });
    else toast.success(`${data.sent ?? 0} E-Mails versendet`);
    load();
  };

  const handleUpload = async (file: File) => {
    if (!activeCampaign) return toast.error("Kampagne wählen");
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const header = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((l) => {
      const cols = l.split(/[,;]/);
      const o: Record<string, string> = {};
      header.forEach((h, i) => (o[h] = (cols[i] ?? "").trim()));
      return o;
    });
    const payload = rows
      .map((r) => ({
        campaign_id: activeCampaign.id,
        company: r.company ?? r.firma ?? "",
        contact_name: r.contact ?? r.name ?? null,
        email: r.email ?? null,
        phone: r.phone ?? r.telefon ?? null,
        website: r.website ?? null,
        city: r.city ?? r.stadt ?? null,
        industry: r.industry ?? r.branche ?? null,
        source: "upload",
      }))
      .filter((p) => p.company);
    if (!payload.length) return toast.error("Keine gültigen Zeilen gefunden");
    const { error } = await supabase.from("leads").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(`${payload.length} Leads importiert`);
    load();
  };

  return (
    <HeidehofAdminLayout title="Lead-Agent">
      <div className="space-y-5 max-w-[1400px]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Automatisiertes B2B-Outreach</p>
          <h2 className="font-serif text-2xl text-foreground mt-1">Tagungsgäste finden &amp; ansprechen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Suche Firmen im Umkreis oder importiere eine Liste. Personalisierte Erst- & Follow-Up-Mails werden automatisch versendet.
          </p>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Kampagnen</TabsTrigger>
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <Card className="bg-card border-border p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Kampagnenname"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Button onClick={createCampaign}>
                  <Plus className="w-4 h-4 mr-1" /> Neue Kampagne
                </Button>
              </div>
            </Card>

            {campaigns.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Noch keine Kampagne.</p>
              </Card>
            ) : (
              campaigns.map((c) => (
                <Card
                  key={c.id}
                  className={`bg-card border-border p-4 cursor-pointer transition-all hover:border-primary/30 ${
                    activeCampaign?.id === c.id ? "ring-2 ring-primary border-primary/40" : ""
                  }`}
                  onClick={() => setActiveCampaign(c)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg text-foreground">{c.name}</h3>
                        <Badge variant="outline">{c.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Vorlage: <code className="text-foreground/70">{c.template_key}</code> · max {c.daily_cap}/Tag
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-right text-muted-foreground">
                        <div>Versendet: <span className="text-foreground font-medium">{c.stats?.sent ?? 0}</span></div>
                        <div>Geöffnet: <span className="text-foreground font-medium">{c.stats?.opened ?? 0}</span></div>
                        <div>Antworten: <span className="text-foreground font-medium">{c.stats?.replied ?? 0}</span></div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCampaign(c.id);
                        }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}

            {activeCampaign && (
              <Card className="bg-muted/30 border-border p-4 space-y-4">
                <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Aktionen für „{activeCampaign.name}"
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-card p-4 rounded-lg border border-border space-y-2">
                    <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" /> Firmen suchen
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Branche</Label>
                        <Input
                          value={searchIndustry}
                          onChange={(e) => setSearchIndustry(e.target.value)}
                          placeholder="z.B. IT-Beratung"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Stadt / PLZ</Label>
                        <Input
                          value={searchCity}
                          onChange={(e) => setSearchCity(e.target.value)}
                          placeholder="Ingolstadt"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Umkreis (km)</Label>
                        <Input
                          type="number"
                          value={searchRadius}
                          onChange={(e) => setSearchRadius(Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Anzahl Leads</Label>
                        <Input
                          type="number"
                          value={searchCount}
                          onChange={(e) => setSearchCount(Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button onClick={runSearch} disabled={isSearching} className="w-full mt-2">
                      {isSearching ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                      {isSearching ? "Suche läuft …" : "Suche starten"}
                    </Button>
                  </div>

                  <div className="bg-card p-4 rounded-lg border border-border space-y-2">
                    <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                      <Upload className="w-4 h-4 text-muted-foreground" /> Liste hochladen (CSV)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Spalten: company, contact, email, phone, website, city, industry
                    </p>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                      }}
                      className="text-xs text-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-border file:text-xs file:bg-muted file:text-foreground hover:file:bg-muted/80"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-2">
                  <div className="bg-card rounded-lg border border-border p-3">
                    <p className="text-2xl font-bold text-foreground">{campaignLeads.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Leads in Kampagne</p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-3">
                    <p className="text-2xl font-bold text-foreground">{campaignLeads.filter((lead) => Boolean(lead.email)).length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">mit E-Mail</p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-3">
                    <p className="text-2xl font-bold text-foreground">{campaignLeads.filter((lead) => lead.status === "contacted").length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">kontaktiert</p>
                  </div>
                </div>

                <Button onClick={startCampaign} disabled={isStarting} className="w-full">
                  {isStarting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                  {isStarting ? "Kampagne startet …" : "Kampagne starten"}
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leads">
            <Card className="bg-card border-border">
              {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">Noch keine Leads.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Firma</th>
                      <th className="text-left px-4 py-3 font-medium">Kontakt</th>
                      <th className="text-left px-4 py-3 font-medium">E-Mail</th>
                      <th className="text-left px-4 py-3 font-medium">Stadt</th>
                      <th className="text-left px-4 py-3 font-medium">Branche</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leads.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{l.company}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.contact_name ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.email ? <a className="inline-flex items-center gap-1 hover:text-foreground hover:underline" href={`mailto:${l.email}`}><Mail className="w-3 h-3" />{l.email}</a> : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.city ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.industry ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{l.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </Card>
            <Button variant="outline" onClick={load} className="mt-3">
              <RefreshCw className="w-4 h-4 mr-1" /> Aktualisieren
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </HeidehofAdminLayout>
  );
}
