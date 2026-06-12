import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export interface TourStep {
  /** CSS selector of the element to highlight. If missing, the step is centered. */
  selector?: string;
  title: string;
  body: string;
  /** Preferred placement when there is room. */
  placement?: "top" | "bottom" | "left" | "right";
}

interface TourProps {
  /** Stable id used in profiles.onboarding_state to remember completion. */
  tourId: string;
  steps: TourStep[];
  /** Force open even if the tour was completed before. */
  open?: boolean;
  onClose?: () => void;
}

/**
 * Lightweight onboarding tour:
 *  - dim background with spotlight on the target
 *  - tooltip card with prev / next / skip
 *  - persists completion in profiles.onboarding_state for the current user
 */
export const Tour = ({ tourId, steps, open: controlledOpen, onClose }: TourProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Decide whether to auto-open: only if user has not completed it yet.
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
      setIndex(0);
      return;
    }
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_state")
        .eq("user_id", user.id)
        .maybeSingle();
      const state = ((data as { onboarding_state?: Record<string, boolean> } | null)?.onboarding_state) ?? {};
      if (mounted && !state[tourId]) {
        setOpen(true);
        setIndex(0);
      }
    })();
    return () => { mounted = false; };
  }, [tourId, controlledOpen]);

  const step = steps[index];

  // Track target element rect
  useEffect(() => {
    if (!open || !step) return;
    const update = () => {
      if (!step.selector) { setRect(null); return; }
      const el = document.querySelector<HTMLElement>(step.selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        // wait next frame to capture post-scroll rect
        requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
      } else {
        setRect(null);
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, step]);

  const finish = useCallback(async () => {
    setOpen(false);
    onClose?.();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_state")
        .eq("user_id", user.id)
        .maybeSingle();
      const state = ((data as { onboarding_state?: Record<string, boolean> } | null)?.onboarding_state) ?? {};
      await supabase
        .from("profiles")
        .update({ onboarding_state: { ...state, [tourId]: true } } as never)
        .eq("user_id", user.id);
    } catch {/* ignore */}
  }, [tourId, onClose]);

  if (!open || !step) return null;

  const padding = 8;
  const spotlight = rect
    ? {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    : null;

  // Tooltip position
  const tooltipStyle: React.CSSProperties = (() => {
    if (!rect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const placement = step.placement ?? (rect.top > 200 ? "top" : "bottom");
    const base: React.CSSProperties = { maxWidth: 360 };
    if (placement === "top") {
      return { ...base, top: rect.top - 16, left: rect.left + rect.width / 2, transform: "translate(-50%, -100%)" };
    }
    if (placement === "bottom") {
      return { ...base, top: rect.bottom + 16, left: rect.left + rect.width / 2, transform: "translate(-50%, 0)" };
    }
    if (placement === "left") {
      return { ...base, top: rect.top + rect.height / 2, left: rect.left - 16, transform: "translate(-100%, -50%)" };
    }
    return { ...base, top: rect.top + rect.height / 2, left: rect.right + 16, transform: "translate(0, -50%)" };
  })();

  return createPortal(
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* dim layer with cut-out via box-shadow */}
      {spotlight ? (
        <div
          className="absolute pointer-events-none rounded-lg ring-2 ring-primary"
          style={{
            ...spotlight,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            transition: "all 0.25s ease",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      <div
        className={cn(
          "absolute bg-background border border-border shadow-2xl rounded-xl p-4",
          "min-w-[260px]",
        )}
        style={tooltipStyle}
      >
        <button
          type="button"
          onClick={finish}
          aria-label="Tour schließen"
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-xs text-muted-foreground mb-1">
          Schritt {index + 1} / {steps.length}
        </div>
        <h3 className="font-semibold mb-1 pr-6">{step.title}</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{step.body}</p>
        <div className="flex items-center justify-between gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
          </Button>
          {index < steps.length - 1 ? (
            <Button size="sm" onClick={() => setIndex((i) => i + 1)}>
              Weiter <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={finish}>Fertig</Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Tour;
