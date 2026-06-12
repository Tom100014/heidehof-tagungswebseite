
import React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-md border-[3px] border-gold/80 bg-background/80 backdrop-blur-md text-slate-100 placeholder:text-gold/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50 focus-visible:border-gold focus-visible:shadow-[0_0_24px_rgba(217,181,103,0.5)] disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all duration-300",
          "h-16 text-[18px] px-6 py-4 leading-relaxed",
          "md:h-12 md:text-base md:px-4 md:py-3",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
