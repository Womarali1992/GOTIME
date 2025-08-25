import React from "react";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dataService } from "@/lib/services/data-service";

interface DayOfWeekTabsProps {
  centeredDate: Date;
  onDateSelect: (date: Date) => void;
  weekOffset?: number;
  onWeekChange?: (offset: number) => void;
}

const DayOfWeekTabs = ({ centeredDate, onDateSelect, weekOffset = 0, onWeekChange }: DayOfWeekTabsProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Generate the seven days for the current week view
  const generateTabDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = addDays(today, dataService.getTimeSlotVisibilityDays() - 1);
    
    // Calculate the start of the week based on today + weekOffset
    const baseDate = addDays(today, weekOffset * 7);
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 }); // Sunday start
    
    // Generate 7 days starting from the week start, but only include days within the visibility period
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      if (date <= maxDate) {
        days.push(date);
      }
    }
    return days;
  };

  const tabDays = generateTabDays();

  const handlePrevDay = () => {
    const prevDate = addDays(centeredDate, -1);
    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);
    if (prevDate >= todayLocal) {
      onDateSelect(prevDate);
      if (onWeekChange) {
        const baseStart = startOfWeek(todayLocal, { weekStartsOn: 0 });
        const prevStart = startOfWeek(prevDate, { weekStartsOn: 0 });
        const diffWeeks = Math.round((prevStart.getTime() - baseStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        onWeekChange(diffWeeks);
      }
    }
  };

  const handleNextDay = () => {
    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);
    const maxVisibleDate = addDays(todayLocal, dataService.getTimeSlotVisibilityDays() - 1);
    const nextDate = addDays(centeredDate, 1);
    if (nextDate <= maxVisibleDate) {
      onDateSelect(nextDate);
      if (onWeekChange) {
        const baseStart = startOfWeek(todayLocal, { weekStartsOn: 0 });
        const nextStart = startOfWeek(nextDate, { weekStartsOn: 0 });
        const diffWeeks = Math.round((nextStart.getTime() - baseStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        onWeekChange(diffWeeks);
      }
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = addDays(today, dataService.getTimeSlotVisibilityDays() - 1);
  const prevDay = addDays(centeredDate, -1);
  const nextDay = addDays(centeredDate, 1);
  const canGoPrev = prevDay >= today;
  const canGoNext = nextDay <= maxDate;

  return (
    <div className="mb-3 sm:mb-4 space-y-3">


      {/* Enhanced Day Tabs */}
      <div className="bg-gradient-to-br from-white to-gray-50/80 dark:from-slate-900 dark:to-slate-800/80 rounded-xl border border-border/50 shadow-lg backdrop-blur-sm p-4 relative">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            aria-label="Previous day"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-6 w-6 p-0"
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <div className="grid grid-cols-7 gap-3 w-full px-8">
          {tabDays.map((date, index) => {
            const isCentered = date.getTime() === centeredDate.getTime();
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const dayName = format(date, "EEE");
            const dayOfMonth = format(date, "d");
            
            // Define green-to-blue gradient colors for each day of the week
            const dayColors = [
              // Sunday - Green
              {
                selected: "from-green-500 to-green-600",
                shadow: "shadow-green-500/25",
                ring: "ring-green-400",
                hover: "hover:from-green-50 hover:to-green-100",
                hoverBorder: "hover:border-green-200 dark:hover:border-green-800",
                textLight: "text-green-100",
                textAccent: "text-green-600 dark:text-green-400",
                textAccentHover: "group-hover:text-green-600 dark:group-hover:text-green-400",
                textDark: "text-green-700 dark:text-green-300",
                textDarkHover: "group-hover:text-green-700 dark:group-hover:text-green-300",
                todayDot: "bg-green-500"
              },
              // Monday - Green-Teal
              {
                selected: "from-emerald-500 to-teal-600",
                shadow: "shadow-emerald-500/25",
                ring: "ring-emerald-400",
                hover: "hover:from-emerald-50 hover:to-teal-100",
                hoverBorder: "hover:border-emerald-200 dark:hover:border-emerald-800",
                textLight: "text-emerald-100",
                textAccent: "text-emerald-600 dark:text-emerald-400",
                textAccentHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
                textDark: "text-emerald-700 dark:text-emerald-300",
                textDarkHover: "group-hover:text-emerald-700 dark:group-hover:text-emerald-300",
                todayDot: "bg-emerald-500"
              },
              // Tuesday - Teal
              {
                selected: "from-teal-500 to-teal-600",
                shadow: "shadow-teal-500/25",
                ring: "ring-teal-400",
                hover: "hover:from-teal-50 hover:to-teal-100",
                hoverBorder: "hover:border-teal-200 dark:hover:border-teal-800",
                textLight: "text-teal-100",
                textAccent: "text-teal-600 dark:text-teal-400",
                textAccentHover: "group-hover:text-teal-600 dark:group-hover:text-teal-400",
                textDark: "text-teal-700 dark:text-teal-300",
                textDarkHover: "group-hover:text-teal-700 dark:group-hover:text-teal-300",
                todayDot: "bg-teal-500"
              },
              // Wednesday - Cyan
              {
                selected: "from-cyan-500 to-cyan-600",
                shadow: "shadow-cyan-500/25",
                ring: "ring-cyan-400",
                hover: "hover:from-cyan-50 hover:to-cyan-100",
                hoverBorder: "hover:border-cyan-200 dark:hover:border-cyan-800",
                textLight: "text-cyan-100",
                textAccent: "text-cyan-600 dark:text-cyan-400",
                textAccentHover: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
                textDark: "text-cyan-700 dark:text-cyan-300",
                textDarkHover: "group-hover:text-cyan-700 dark:group-hover:text-cyan-300",
                todayDot: "bg-cyan-500"
              },
              // Thursday - Sky Blue
              {
                selected: "from-sky-500 to-sky-600",
                shadow: "shadow-sky-500/25",
                ring: "ring-sky-400",
                hover: "hover:from-sky-50 hover:to-sky-100",
                hoverBorder: "hover:border-sky-200 dark:hover:border-sky-800",
                textLight: "text-sky-100",
                textAccent: "text-sky-600 dark:text-sky-400",
                textAccentHover: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
                textDark: "text-sky-700 dark:text-sky-300",
                textDarkHover: "group-hover:text-sky-700 dark:group-hover:text-sky-300",
                todayDot: "bg-sky-500"
              },
              // Friday - Blue
              {
                selected: "from-blue-500 to-blue-600",
                shadow: "shadow-blue-500/25",
                ring: "ring-blue-400",
                hover: "hover:from-blue-50 hover:to-blue-100",
                hoverBorder: "hover:border-blue-200 dark:hover:border-blue-800",
                textLight: "text-blue-100",
                textAccent: "text-blue-600 dark:text-blue-400",
                textAccentHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
                textDark: "text-blue-700 dark:text-blue-300",
                textDarkHover: "group-hover:text-blue-700 dark:group-hover:text-blue-300",
                todayDot: "bg-blue-500"
              },
              // Saturday - Indigo Blue
              {
                selected: "from-indigo-500 to-indigo-600",
                shadow: "shadow-indigo-500/25",
                ring: "ring-indigo-400",
                hover: "hover:from-indigo-50 hover:to-indigo-100",
                hoverBorder: "hover:border-indigo-200 dark:hover:border-indigo-800",
                textLight: "text-indigo-100",
                textAccent: "text-indigo-600 dark:text-indigo-400",
                textAccentHover: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
                textDark: "text-indigo-700 dark:text-indigo-300",
                textDarkHover: "group-hover:text-indigo-700 dark:group-hover:text-indigo-300",
                todayDot: "bg-indigo-500"
              }
            ];

            const colors = dayColors[index];
            
            return (
              <Button
                key={date.toString()}
                variant="ghost"
                size="sm"
                onClick={() => onDateSelect(date)}
                disabled={isPast && !isToday}
                className={cn(
                  "relative h-14 sm:h-16 flex flex-col items-center justify-center rounded-xl transition-all duration-200 group border-0",
                  isCentered 
                    ? `bg-gradient-to-br ${colors.selected} text-white shadow-lg ${colors.shadow} scale-105 font-bold`
                    : isPast && !isToday
                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                    : `bg-white/80 dark:bg-slate-800/80 hover:bg-gradient-to-br ${colors.hover} dark:hover:from-slate-700 dark:hover:to-slate-600 text-foreground hover:shadow-md hover:scale-102 border border-border/30 ${colors.hoverBorder}`,
                  isToday && !isCentered && `ring-2 ${colors.ring} ring-offset-2 ring-offset-transparent`
                )}
              >
                <span className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isCentered 
                    ? colors.textLight 
                    : isToday 
                    ? `${colors.textAccent} font-semibold` 
                    : `text-muted-foreground ${colors.textAccentHover}`
                )}>
                  {dayName}
                </span>
                <span className={cn(
                  "text-lg sm:text-xl font-bold transition-all duration-200 leading-none mt-0.5",
                  isCentered 
                    ? "text-white" 
                    : isToday 
                    ? colors.textDark 
                    : `text-foreground ${colors.textDarkHover}`
                )}>
                  {dayOfMonth}
                </span>
                {isToday && (
                  <div className={cn(
                    "absolute -bottom-1 w-2 h-2 rounded-full transition-all duration-200",
                    isCentered ? colors.textLight.replace('text-', 'bg-').replace('-100', '-200') : `${colors.todayDot} shadow-sm`
                  )} />
                )}
              </Button>
            );
          })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            aria-label="Next day"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-6 w-6 p-0"
            disabled={!canGoNext}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DayOfWeekTabs;
