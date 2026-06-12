import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Users } from "lucide-react";
import type { Deal } from "@/hooks/useLeadPipeline";

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function scoreTone(score: number) {
  if (score >= 70) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (score >= 40) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

export function DealCard({ deal, onOpen }: { deal: Deal; onOpen: (d: Deal) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { stage: deal.stage },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  const score = deal.lead?.lead_score ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Allow click without drag
        if (!isDragging) {
          e.stopPropagation();
          onOpen(deal);
        }
      }}
      className="group cursor-grab active:cursor-grabbing rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm p-3 hover:border-amber-500/40 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate text-foreground">{deal.lead?.company || "—"}</p>
          {deal.lead?.contact_name && (
            <p className="text-xs text-muted-foreground truncate">{deal.lead.contact_name}</p>
          )}
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0 ${scoreTone(score)}`}>
          {score}
        </span>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        {deal.estimated_value > 0 && (
          <p className="text-amber-400 font-semibold text-sm">{eur(Number(deal.estimated_value))}</p>
        )}
        {deal.event_type && (
          <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" />{deal.event_type}</div>
        )}
        {deal.expected_persons && (
          <div className="flex items-center gap-1.5"><Users className="w-3 h-3" />{deal.expected_persons} Pers.</div>
        )}
        {deal.expected_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {new Date(deal.expected_date).toLocaleDateString("de-DE")}
          </div>
        )}
      </div>
      {deal.probability !== undefined && (
        <div className="mt-2">
          <Badge variant="outline" className="text-[10px]">{deal.probability}% Wahrsch.</Badge>
        </div>
      )}
    </div>
  );
}
