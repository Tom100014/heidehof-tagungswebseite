import { useState, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpHintProps {
  title: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Inline help indicator: renders a small "?" icon that opens a popover
 * with explanatory text. Use next to admin form labels and complex controls.
 */
export const HelpHint = ({ title, children, className, size = "sm" }: HelpHintProps) => {
  const [open, setOpen] = useState(false);
  const px = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Hilfe: ${title}`}
          className={cn(
            "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors",
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <HelpCircle className={px} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="max-w-xs text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-semibold mb-1">{title}</div>
        <div className="text-muted-foreground text-xs whitespace-pre-line">{children}</div>
      </PopoverContent>
    </Popover>
  );
};

export default HelpHint;
