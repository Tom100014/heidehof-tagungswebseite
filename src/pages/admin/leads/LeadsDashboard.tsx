import { useLeadKpis } from "@/hooks/useLeadKpis";
import { useLeadActivities } from "@/hooks/useLeadActivities";
import { KpiGrid } from "@/components/admin/leads/KpiGrid";
import { FunnelChart } from "@/components/admin/leads/FunnelChart";
import { ActivityFeed } from "@/components/admin/leads/ActivityFeed";
import { Card } from "@/components/ui/card";
import {
  Users, UserPlus, Mail, MailOpen, MousePointerClick, MessageSquareReply,
  Target, Trophy, TrendingUp, Percent, Send, Building2,
} from "lucide-react";

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function LeadsDashboard() {
  const { data, loading } = useLeadKpis();
  const { items: activities, loading: actLoading } = useLeadActivities({ limit: 15 });

  const kpis = [
    { label: "Leads gesamt", value: data.leadsTotal, icon: Users, hint: `+${data.leadsNew7d} in 7 Tagen` },
    { label: "Neue Leads (30 T.)", value: data.leadsNew30d, icon: UserPlus },
    { label: "Kontaktiert", value: data.contacted, icon: Mail },
    { label: "Qualifiziert", value: data.qualified, icon: Target, accent: "gold" as const },
    { label: "E-Mails versendet", value: data.emailsSent, icon: Send },
    { label: "Öffnungsrate", value: `${data.openRate}%`, icon: MailOpen, hint: `${data.emailsOpened} geöffnet` },
    { label: "Klickrate", value: `${data.clickRate}%`, icon: MousePointerClick, hint: `${data.emailsClicked} Klicks` },
    { label: "Antwortrate", value: `${data.replyRate}%`, icon: MessageSquareReply, hint: `${data.emailsReplied} Antworten`, accent: "success" as const },
    { label: "Pipeline-Wert", value: eur(data.pipelineValue), icon: TrendingUp, hint: `${data.pipelineCount} Deals`, accent: "gold" as const },
    { label: "Gewonnen", value: data.won, icon: Trophy, accent: "success" as const },
    { label: "Verloren", value: data.lost, icon: Percent, accent: "danger" as const },
    { label: "Conversion-Rate", value: `${data.conversionRate}%`, icon: Percent, hint: "Lead → Gewonnen" },
  ];

  return (
    <div className="space-y-6">
      <KpiGrid items={kpis} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelChart steps={data.funnel} />
        <ActivityFeed items={activities} loading={actLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 bg-card/60 backdrop-blur-md border-border/60">
          <h3 className="font-serif text-lg mb-3">Performance je Kampagne</h3>
          {data.byCampaign.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Kampagnen.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border/40">
                  <tr><th className="text-left p-2">Kampagne</th><th className="text-right p-2">Leads</th><th className="text-right p-2">Versendet</th></tr>
                </thead>
                <tbody>
                  {data.byCampaign.map((c) => (
                    <tr key={c.name} className="border-b border-border/20">
                      <td className="p-2">{c.name}</td>
                      <td className="p-2 text-right font-mono">{c.leads}</td>
                      <td className="p-2 text-right font-mono">{c.sent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5 bg-card/60 backdrop-blur-md border-border/60">
          <h3 className="font-serif text-lg mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />Top-Branchen
          </h3>
          {data.byIndustry.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Daten.</p>
          ) : (
            <div className="space-y-2">
              {data.byIndustry.map((b) => {
                const max = Math.max(...data.byIndustry.map((x) => x.count));
                const pct = Math.round((b.count / max) * 100);
                return (
                  <div key={b.industry}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="truncate">{b.industry}</span>
                      <span className="font-mono text-muted-foreground">{b.count}</span>
                    </div>
                    <div className="h-2 rounded bg-muted/30 overflow-hidden">
                      <div className="h-full bg-amber-500/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
