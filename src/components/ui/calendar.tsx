
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-lg font-semibold text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 pointer-events-auto bg-transparent text-gold hover:bg-white/10 border-none"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1 mt-4",
        head_row: "flex",
        head_cell:
          "text-white/70 rounded-md w-10 font-medium text-sm uppercase",
        row: "flex w-full mt-2",
        cell: "h-10 w-10 text-center text-base p-0 relative pointer-events-auto [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal text-white aria-selected:opacity-100 hover:bg-white/10 hover:text-white pointer-events-auto rounded-lg"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "!bg-gold !text-black hover:!bg-gold/90 hover:!text-black focus:!bg-gold focus:!text-black font-semibold rounded-full",
        day_today: "bg-white/20 text-white font-bold rounded-full",
        day_outside:
          "day-outside text-slate-600 opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-slate-700 opacity-40 pointer-events-none",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
