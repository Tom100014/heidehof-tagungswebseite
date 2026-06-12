import { Sparkles, ArrowRight, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ClaraInquiryContext } from "@/lib/clara/inquiry-context";
import { openClaraBubble } from "./ClaraFloatingBubble";
import { useAssistantMode, triggerWebCall } from "@/hooks/use-assistant-mode";
import { useActiveAssistant, openMaximilianWidget } from "@/hooks/use-active-assistant";
import type { MouseEvent } from "react";

interface AskClaraButtonProps {
  context: ClaraInquiryContext;
  variant?: "pill" | "block";
  label?: string;
  className?: string;
  stopPropagation?: boolean;
}

/**
 * Glas-Pill im Rolls-Royce-Stil.
 * Routing nach aktivem Assistenten:
 *  - elevenlabs → öffnet Maximilian-Widget, Label "Mit Maximilian sprechen"
 *  - clara (Standard) → öffnet Clara-Bubble, Label "Mit Clara anfragen"
 *  - phone_only (Admin-Modus) → startet Telefonanruf
 */
export const AskClaraButton = ({
  context,
  variant = "pill",
  label,
  className,
  stopPropagation = true,
}: AskClaraButtonProps) => {
  const { mode } = useAssistantMode();
  const { assistant } = useActiveAssistant();

  const isPhone = mode === "phone_only";
  const isMaximilian = assistant === "elevenlabs";

  const text = isPhone
    ? "Jetzt sprechen"
    : isMaximilian
      ? "Mit Maximilian sprechen"
      : (label ?? "Mit Clara anfragen").replace(/\bMax\b/g, "Clara");

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) e.stopPropagation();
    if (isPhone) {
      triggerWebCall(context, "button");
    } else if (isMaximilian) {
      openMaximilianWidget();
    } else {
      openClaraBubble(context);
    }
  };

  const base =
    "group inline-flex items-center justify-center rounded-full " +
    "border border-[hsl(38_35%_82%/0.32)] hover:border-[hsl(38_45%_88%/0.65)] " +
    "bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_30px_-14px_rgba(0,0,0,0.7)] " +
    "transition-all duration-300 active:scale-[0.98] " +
    "text-white/95 uppercase tracking-[0.22em] font-medium";

  const Icon = isPhone || isMaximilian ? Mic : Sparkles;

  if (variant === "block") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={text}
        className={cn(base, "gap-3 px-7 py-3.5 text-[12px]", className)}
      >
        <Icon className="w-3.5 h-3.5 text-[hsl(38_55%_72%)]" strokeWidth={1.5} />
        <span>{text}</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={text}
      className={cn(base, "gap-2 px-4 py-2 text-[11px]", className)}
    >
      <Icon className="w-3 h-3 text-[hsl(38_55%_72%)]" strokeWidth={1.5} />
      <span>{text}</span>
      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
    </button>
  );
};

export default AskClaraButton;
