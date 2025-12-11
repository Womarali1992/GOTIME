import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, GraduationCap } from "lucide-react";
import { format, addDays, subDays } from "date-fns";

interface CoachHeaderProps {
  currentDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  viewDays: number;
  onViewDaysChange: (days: number) => void;
  coachName: string;
}

const CoachHeader = ({
  currentDate,
  onPreviousDay,
  onNextDay,
  onToday,
  viewDays,
  onViewDaysChange,
  coachName
}: CoachHeaderProps) => {
  // Check if previous navigation is disabled
  const isPreviousDisabled = React.useMemo(() => {
    const previousDate = subDays(currentDate, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return previousDate < today;
  }, [currentDate]);

  return (
    <>
      {/* Top Bar - View Toggle Buttons */}
      <div className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex flex-row items-center justify-between py-0.5 sm:py-1 px-2 sm:px-4">
          {/* Left: Coach indicator */}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">{coachName}</span>
          </div>

          {/* Right: View Toggle Buttons */}
          <div className="flex items-center">
            <div className="bg-muted/50 rounded-lg flex-none shrink-0 flex items-center space-x-0.5 p-0.5">
              <Button
                variant={viewDays === 1 ? "default" : "ghost"}
                onClick={() => onViewDaysChange(1)}
                className="!h-6 sm:!h-7 px-1 sm:px-1.5 py-0 sm:py-0.5 text-xs min-h-0 min-w-0"
              >
                1D
              </Button>
              <Button
                variant={viewDays === 3 ? "default" : "ghost"}
                onClick={() => onViewDaysChange(3)}
                className="!h-6 sm:!h-7 px-1 sm:px-1.5 py-0 sm:py-0.5 text-xs min-h-0 min-w-0"
              >
                3D
              </Button>
              <Button
                variant={viewDays === 7 ? "default" : "ghost"}
                onClick={() => onViewDaysChange(7)}
                className="!h-6 sm:!h-7 px-1 sm:px-1.5 py-0 sm:py-0.5 text-xs min-h-0 min-w-0"
              >
                1W
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation Section */}
      <div className="px-2 sm:px-3 py-3 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b border-border/30">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousDay}
            disabled={isPreviousDisabled}
            className="text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>

          <div className="text-center cursor-pointer hover:opacity-70 transition-opacity" onClick={onToday}>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              {format(currentDate, "EEEE, MMMM d, yyyy")}
            </h2>
            <p className="text-xs text-muted-foreground">Click to go to today</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextDay}
            className="text-xs"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default CoachHeader;
