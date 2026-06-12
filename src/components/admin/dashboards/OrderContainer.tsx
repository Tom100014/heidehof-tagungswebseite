import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export type ContainerTone = "new" | "active" | "done" | "urgent";

const TONES: Record<ContainerTone, string> = {
  new: "border-rose-500/70 bg-rose-500/10 shadow-[0_0_24px_-6px_rgba(244,63,94,0.55)] animate-[pulse_2.4s_ease-in-out_infinite]",
  urgent: "border-rose-600 bg-rose-600/15 shadow-[0_0_32px_-4px_rgba(220,38,38,0.7)] animate-[pulse_1.6s_ease-in-out_infinite]",
  active: "border-amber-500/60 bg-amber-500/5",
  done: "border-emerald-500/40 bg-emerald-500/5 opacity-70",
};

export interface OrderAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "destructive";
}

interface OrderContainerProps {
  tone?: ContainerTone;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  location?: string;
  guestName?: string;
  createdAt: string | Date;
  badges?: { label: string; tone?: "default" | "warning" | "danger" | "success" }[];
  warning?: string;
  children?: ReactNode;
  actions?: OrderAction[];
  upsell?: string;
}

const badgeTone = {
  default: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  danger: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

export function OrderContainer({
  tone = "new",
  icon,
  title,
  subtitle,
  location,
  guestName,
  createdAt,
  badges = [],
  warning,
  children,
  actions = [],
  upsell,
}: OrderContainerProps) {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className={cn(
        "rounded-2xl border-2 p-5 text-foreground backdrop-blur-sm",
        TONES[tone]
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="text-2xl shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight truncate">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums bg-background/40 px-2 py-1 rounded-md border border-border/40">
            <Clock className="h-3 w-3" />
            {format(date, "HH:mm", { locale: de })}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {format(date, "EEE, dd.MM.", { locale: de })}
          </div>
        </div>
      </div>

      {/* Meta row */}
      {(location || guestName || badges.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {location && (
            <Badge variant="outline" className="gap-1 bg-background/40">
              <MapPin className="h-3 w-3" /> {location}
            </Badge>
          )}
          {guestName && (
            <Badge variant="outline" className="gap-1 bg-background/40">
              <User className="h-3 w-3" /> {guestName}
            </Badge>
          )}
          {badges.map((b, i) => (
            <Badge key={i} className={cn("border", badgeTone[b.tone ?? "default"])}>
              {b.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Body */}
      {children && (
        <div className="rounded-lg bg-background/40 border border-border/30 p-3 text-sm mb-3">
          {children}
        </div>
      )}

      {/* Warning */}
      {warning && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 mb-3 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {/* Upsell */}
      {upsell && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 mb-3 text-sm text-amber-200">
          <span className="text-base">💡</span>
          <span>{upsell}</span>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((a, i) => (
            <Button
              key={i}
              size="sm"
              variant={a.variant ?? "default"}
              onClick={a.onClick}
              className="font-semibold"
            >
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
