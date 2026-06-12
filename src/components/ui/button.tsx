
import React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Buttons NEVER use a white background — text disappears on light pages.
 * Default = anthracite (neutral-900) with white text.
 * For brand accent on apple-green admin areas, use variant="apple".
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 hover:scale-[1.01] active:scale-[0.99]",
  {
    variants: {
      variant: {
        // Ghost outline primary — transparent with ivory border
        default:
          "bg-transparent text-foreground border border-foreground/40 hover:bg-foreground/5 hover:border-foreground/70",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Subtle grey-glossy — replaces the previous near-white outline
        outline:
          "border border-neutral-300/80 text-neutral-900 bg-gradient-to-b from-neutral-100 to-neutral-200 hover:from-neutral-200 hover:to-neutral-300 hover:border-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
        secondary:
          "text-neutral-900 bg-gradient-to-b from-neutral-200 to-neutral-300 hover:from-neutral-300 hover:to-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
        // Ghost: soft grey-glossy hover instead of harsh white
        ghost:
          "bg-transparent text-slate-50 hover:bg-gradient-to-b hover:from-neutral-100 hover:to-neutral-200 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
        link: "text-neutral-900 underline-offset-4 hover:underline",
        gold: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm",
        // GLASS — premium frosted pill (Rolls-Royce reference). Use everywhere on public site.
        glass:
          "rounded-full px-6 min-h-[44px] text-[12px] font-medium uppercase tracking-[0.18em] text-white/95 border border-white/15 bg-white/[0.04] backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_-12px_rgba(0,0,0,0.6)]",
        // GLASS-PRIMARY — same frosted base, gold edge for the single primary CTA per page.
        "glass-primary":
          "rounded-full px-6 min-h-[44px] text-[12px] font-medium uppercase tracking-[0.18em] text-white border border-[hsl(38_45%_75%/0.55)] bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.10] hover:border-[hsl(38_55%_82%/0.85)] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_30px_-12px_rgba(0,0,0,0.7)]",
        apple:
          "bg-[hsl(var(--apple))] text-[hsl(var(--apple-foreground))] hover:bg-[hsl(var(--apple-bright))] shadow-sm",
      },
      size: {
        default: "min-h-[44px] px-4 py-2.5",
        sm: "h-8 rounded-md px-2.5 py-1 text-xs",
        lg: "min-h-[52px] rounded-md px-6 py-3 text-base",
        xl: "min-h-[56px] rounded-md px-8 py-3.5 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
