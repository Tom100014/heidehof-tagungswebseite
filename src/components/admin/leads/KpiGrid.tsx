import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface Kpi {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: "default" | "gold" | "success" | "warn" | "danger";
}

const accentMap: Record<NonNullable<Kpi["accent"]>, string> = {
  default: "text-foreground",
  gold: "text-amber-400",
  success: "text-emerald-400",
  warn: "text-amber-400",
  danger: "text-rose-400",
};

export function KpiGrid({ items, loading }: { items: Kpi[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value, hint, icon: Icon, accent = "default" }) => (
        <Card key={label} className="p-4 flex items-start gap-3 bg-card/60 backdrop-blur-md border-border/60">
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <Icon className={`w-5 h-5 ${accentMap[accent]}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className={`text-2xl font-semibold ${accentMap[accent]}`}>{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-0.5 truncate">{hint}</p>}
          </div>
        </Card>
      ))}
    </div>
  );
}
