import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { UpsellSuggestion } from "@/lib/upselling/suggestions";
import { cn } from "@/lib/utils";

interface UpsellPromptProps {
  suggestions: UpsellSuggestion[];
  onAccept?: (s: UpsellSuggestion) => void;
  variant?: "stacked" | "inline";
  className?: string;
}

export function UpsellPrompt({ suggestions, onAccept, variant = "stacked", className }: UpsellPromptProps) {
  if (!suggestions.length) return null;

  return (
    <div className={cn(variant === "stacked" ? "space-y-2" : "flex gap-2 flex-wrap", className)}>
      {suggestions.map((s) => {
        const inner = (
          <div className="flex items-start gap-3 flex-1">
            <Sparkles className="h-4 w-4 mt-0.5 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 shrink-0">
              {s.cta} <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        );

        const wrapperClass =
          "block rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition px-3 py-2.5 text-left w-full";

        if (s.href && !onAccept) {
          return (
            <Link key={s.id} to={s.href} className={wrapperClass}>
              {inner}
            </Link>
          );
        }
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onAccept?.(s)}
            className={wrapperClass}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
