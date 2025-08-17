import React from "react";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface DayOfWeekTabsProps {
  centeredDate: Date;
  onDateSelect: (date: Date) => void;
}

const DayOfWeekTabs = ({ centeredDate, onDateSelect }: DayOfWeekTabsProps) => {
  // Generate the seven days around the centered date
  // Only show current and future days, no past days
  const generateTabDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Start from today and go forward 6 more days (total 7 days)
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      days.push(date);
    }
    return days;
  };

  const tabDays = generateTabDays();

  return (
    <div className="mb-4">
      <div className="grid grid-cols-7 gap-1 bg-muted/50 rounded-lg p-1 border border-border/50">
        {tabDays.map((date, index) => {
          const isCentered = date.getTime() === centeredDate.getTime(); // Highlight the selected date
          const isPast = date < new Date() && date.getDate() !== new Date().getDate(); // Check if it's a past date (but not today)
          const dayName = format(date, "EEE"); // Short weekday name (Sun, Mon, etc.)
          const dayOfMonth = format(date, "d"); // Day of the month (1, 2, 3, etc.)
          
          return (
            <Button
              key={date.toString()}
              variant={isCentered ? "default" : "ghost"}
              size="sm"
              onClick={() => onDateSelect(date)}
              disabled={isPast}
              className={cn(
                "h-12 text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center",
                isCentered 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : isPast
                  ? "opacity-50 cursor-not-allowed text-muted-foreground"
                  : "hover:bg-muted hover:text-foreground text-muted-foreground"
              )}
            >
              <span className="text-xs opacity-80">{dayName}</span>
              <span className="text-lg font-bold">{dayOfMonth}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default DayOfWeekTabs;
