import { Card } from "@/components/ui/card";

interface Step { stage: string; label: string; count: number }

export function FunnelChart({ steps }: { steps: Step[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <Card className="p-5 bg-card/60 backdrop-blur-md border-border/60">
      <h3 className="font-serif text-lg mb-4">Conversion-Funnel</h3>
      <div className="space-y-2">
        {steps.map((s, i) => {
          const pct = Math.round((s.count / max) * 100);
          const prev = i > 0 ? steps[i - 1].count : null;
          const drop = prev && prev > 0 ? Math.round((1 - s.count / prev) * 100) : null;
          return (
            <div key={s.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{s.label}</span>
                <span className="font-mono text-muted-foreground">
                  {s.count}
                  {drop !== null && drop > 0 && <span className="ml-2 text-rose-400/80 text-xs">−{drop}%</span>}
                </span>
              </div>
              <div className="h-7 rounded-md bg-muted/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500/70 to-amber-300/70 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
