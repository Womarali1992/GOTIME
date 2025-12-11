import * as React from "react";
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
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-xl font-bold text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-10 w-10 p-0 rounded-lg calendar-nav-button"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-2",
        head_row: "flex w-full mb-2",
        head_cell:
          "text-primary rounded-md w-full font-bold text-sm uppercase flex-1 text-center",
        row: "flex w-full mt-2",
        cell: "flex-1 h-12 w-full text-center p-0.5 relative focus-within:relative focus-within:z-20",
        day: cn(
          "h-12 w-full p-0 font-semibold text-base aria-selected:opacity-100 flex items-center justify-center rounded-lg calendar-day"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "calendar-day-selected",
        day_today: "calendar-day-today",
        day_outside:
          "day-outside text-muted-foreground opacity-40 aria-selected:bg-muted/30 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-30",
        day_range_middle:
          "aria-selected:bg-muted/30 aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-5 w-5" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-5 w-5" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
