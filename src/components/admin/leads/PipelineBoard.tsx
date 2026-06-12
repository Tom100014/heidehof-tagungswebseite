import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGES, type Deal, type DealStage } from "@/hooks/useLeadPipeline";
import { DealCard } from "./DealCard";

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function Column({
  stage, label, tone, deals, onOpen,
}: { stage: DealStage; label: string; tone: string; deals: Deal[]; onOpen: (d: Deal) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const sum = deals.reduce((s, d) => s + Number(d.estimated_value || 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border ${tone} transition-colors ${isOver ? "ring-2 ring-amber-400/60" : ""}`}
    >
      <div className="p-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{label}</h4>
          <span className="text-xs font-mono opacity-70">{deals.length}</span>
        </div>
        {sum > 0 && <p className="text-xs text-amber-400 font-semibold mt-0.5">{eur(sum)}</p>}
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto">
        {deals.map((d) => <DealCard key={d.id} deal={d} onOpen={onOpen} />)}
        {deals.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 opacity-60">leer</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  deals: Deal[];
  loading: boolean;
  onMove: (dealId: string, stage: DealStage) => void | Promise<void>;
  onOpen: (d: Deal) => void;
}

export function PipelineBoard({ deals, loading, onMove, onOpen }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const newStage = over.id as DealStage;
    const dealId = String(active.id);
    const current = deals.find((d) => d.id === dealId);
    if (!current || current.stage === newStage) return;
    void onMove(dealId, newStage);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {STAGES.map((s) => <Card key={s.id} className="p-3"><Skeleton className="h-64 w-full" /></Card>)}
      </div>
    );
  }

  const byStage: Record<DealStage, Deal[]> = STAGES.reduce((acc, s) => {
    acc[s.id] = deals.filter((d) => d.stage === s.id);
    return acc;
  }, {} as Record<DealStage, Deal[]>);

  return (
    <DndContext sensors={sensors} onDragEnd={handleEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        {STAGES.map((s) => (
          <Column key={s.id} stage={s.id} label={s.label} tone={s.tone} deals={byStage[s.id]} onOpen={onOpen} />
        ))}
      </div>
    </DndContext>
  );
}
