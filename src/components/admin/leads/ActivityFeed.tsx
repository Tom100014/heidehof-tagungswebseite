import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, StickyNote, RefreshCw, Sparkles, GitBranch, TrendingUp, Activity } from "lucide-react";
import type { LeadActivity } from "@/hooks/useLeadActivities";

const ICONS: Record<string, any> = {
  email: Mail, call: Phone, note: StickyNote,
  status_change: RefreshCw, stage_change: GitBranch,
  enrichment: Sparkles, score_change: TrendingUp, system: Activity,
};

function describe(a: LeadActivity): string {
  const p = a.payload || {};
  switch (a.type) {
    case "stage_change": return `Stage: ${p.from} → ${p.to}`;
    case "status_change": return `Status: ${p.from} → ${p.to}`;
    case "email": return p.subject || p.action || "E-Mail-Aktivität";
    case "note": return p.text || "Notiz";
    case "score_change": return `Score ${p.from ?? "?"} → ${p.to ?? "?"}`;
    case "enrichment": return `Anreicherung: ${p.source || "—"}`;
    default: return a.type;
  }
}

export function ActivityFeed({ items, loading }: { items: LeadActivity[]; loading?: boolean }) {
  if (loading) {
    return (
      <Card className="p-5 bg-card/60 backdrop-blur-md border-border/60">
        <h3 className="font-serif text-lg mb-3">Aktivitätsverlauf</h3>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}
      </Card>
    );
  }
  return (
    <Card className="p-5 bg-card/60 backdrop-blur-md border-border/60">
      <h3 className="font-serif text-lg mb-3">Aktivitätsverlauf</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Aktivitäten.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const Icon = ICONS[a.type] || Activity;
            return (
              <li key={a.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{describe(a)}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.lead?.company ? `${a.lead.company} · ` : ""}
                    {new Date(a.occurred_at).toLocaleString("de-DE")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
