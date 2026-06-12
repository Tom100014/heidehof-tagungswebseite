
import React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border-[3px] border-gold/80 bg-background/80 backdrop-blur-md text-slate-50 placeholder:text-gold/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50 focus-visible:border-gold focus-visible:shadow-[0_0_24px_rgba(217,181,103,0.5)] disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all duration-300 resize-none",
          "min-h-[800px] text-[18px] px-6 py-5 leading-[1.8]",
          "md:min-h-[500px] md:text-base md:px-4 md:py-3",
          "overflow-y-auto touch-action-manipulation [-webkit-overflow-scrolling:touch] scroll-smooth max-h-[75vh]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
