import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { TimeSlot, Court, Coach } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useDataService } from "@/hooks/use-data-service";
import CoachHeader from "./CoachHeader";

interface CoachSchedulerViewProps {
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
  selectedCoach: Coach;
}

// Memoized TimeSlotBlock component
const TimeSlotBlock = React.memo(({
  court,
  day,
  block,
  isTimeSlotInPast,
  handleTimeSlotClick,
  isMobile,
  selectedCoach,
  isSlotAvailableForCoach
}: {
  court: Court;
  day: Date;
  block: any;
  isTimeSlotInPast: (day: Date, hour: number) => boolean;
  handleTimeSlotClick: (court: Court, day: Date, hour: number) => void;
  isMobile: boolean;
  selectedCoach: Coach;
  isSlotAvailableForCoach: (slot: TimeSlot, day: Date) => boolean;
}) => {
  const isPast = isTimeSlotInPast(day, block.startHour);
  const duration = block.endHour - block.startHour;
  const isMultiHour = duration > 1;

  // Check if this slot is available for the coach
  const isAvailableForCoach = block.slot && isSlotAvailableForCoach(block.slot, day);
  const slot = block.slot;

  // Determine slot state
  const isReserved = slot && (slot.type === 'reservation' || slot.type === 'private_coaching');
  const isClinic = slot && slot.type === 'clinic';
  const isBlocked = slot && slot.blocked;

  return (
    <div
      className={cn(
        "text-sm sm:text-base text-center rounded transition-all duration-200 relative",
        isMobile ? "p-1" : "p-3",
        isAvailableForCoach
          ? "bg-green-500/20 text-green-800 border border-green-500/30 hover:bg-green-500/30 cursor-pointer hover:scale-105"
          : isReserved
          ? "bg-secondary/20 text-secondary-800 border border-secondary/30 cursor-not-allowed"
          : isClinic
          ? "bg-yellow-500/20 text-yellow-800 border border-yellow-500/30 cursor-not-allowed"
          : isBlocked
          ? "bg-gray-500/20 text-gray-800 border border-gray-500/30 cursor-not-allowed"
          : isPast
          ? "bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed"
          : "bg-gray-100 text-gray-400 cursor-not-allowed",
        isMultiHour && "flex items-center justify-center border-2 shadow-sm",
        isMultiHour && isAvailableForCoach && "border-green-500/50 bg-gradient-to-br from-green-500/20 to-green-500/30 hover:from-green-500/30 hover:to-green-500/40"
      )}
      style={{
        height: isMultiHour ? `${duration * (isMobile ? 4 : 3.5)}rem` : undefined,
        minHeight: isMultiHour ? undefined : isMobile ? "4rem" : "3.5rem",
        marginBottom: isMultiHour ? "0.5rem" : undefined
      }}
      onClick={() => {
        if (isAvailableForCoach && !isPast) {
          handleTimeSlotClick(court, day, block.startHour);
        }
      }}
      title={
        isAvailableForCoach
          ? `Available: ${block.startHour}:00 - ${block.endHour}:00`
          : isReserved
          ? `Reserved: ${block.startHour}:00 - ${block.endHour}:00`
          : isClinic
          ? `Clinic: ${block.startHour}:00 - ${block.endHour}:00`
          : isBlocked
          ? `Blocked: ${block.startHour}:00 - ${block.endHour}:00`
          : isPast
          ? "Past"
          : "Unavailable"
      }
    >
      {isMultiHour ? (
        <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
          <span className="font-medium text-lg sm:text-base">{block.startHour}:00</span>
          <span className="text-sm sm:text-xs opacity-75 font-medium">to</span>
          <span className="font-medium text-lg sm:text-base">{block.endHour}:00</span>
          {isAvailableForCoach && (
            <span className="text-sm mt-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30 text-green-800 font-medium">
              Available
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 justify-center w-full h-full overflow-hidden">
          <span className="text-lg sm:text-base font-medium">{block.startHour}:00</span>
          {isAvailableForCoach && (
            <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-green-500/20 rounded-full border border-green-500/30 text-green-800 font-medium whitespace-nowrap">
              Available
            </span>
          )}
          {isReserved && (
            <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-secondary/20 rounded border border-secondary/30 text-secondary-800 font-medium whitespace-nowrap">
              Reserved
            </span>
          )}
          {isClinic && (
            <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-yellow-500/20 rounded border border-yellow-500/30 text-yellow-800 font-medium whitespace-nowrap">
              Clinic
            </span>
          )}
        </div>
      )}
    </div>
  );
});

TimeSlotBlock.displayName = "TimeSlotBlock";

const CoachSchedulerView = ({ onSelectTimeSlot, selectedCoach }: CoachSchedulerViewProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(3);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const { courts, timeSlotService, privateSessionService } = useDataService();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Generate visible days
  const daysToShow = useMemo(() => {
    const today = startOfDay(new Date());

    if (viewDays === 3) {
      const isSelectedDateToday = currentDate.getTime() === today.getTime();

      if (isSelectedDateToday) {
        return Array.from({ length: viewDays }, (_, i) => addDays(currentDate, i)).filter(day => day >= today);
      } else {
        const centerDays = [subDays(currentDate, 1), currentDate, addDays(currentDate, 1)];
        return centerDays.filter(day => day >= today);
      }
    } else {
      return Array.from({ length: viewDays }, (_, i) => addDays(currentDate, i)).filter(day => day >= today);
    }
  }, [currentDate, viewDays]);

  // Navigate through dates
  const previousDay = useCallback(() => {
    const newDate = subDays(currentDate, 1);
    const today = startOfDay(new Date());
    if (newDate >= today) {
      setCurrentDate(newDate);
    }
  }, [currentDate]);

  const nextDay = useCallback(() => {
    const newDate = addDays(currentDate, 1);
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 30 - 1);

    if (newDate <= maxDate) {
      setCurrentDate(newDate);
    }
  }, [currentDate]);

  const today = useCallback(() => {
    setCurrentDate(startOfDay(new Date()));
  }, []);

  // Check if time slot is in the past
  const isTimeSlotInPast = useCallback((day: Date, hour: number) => {
    const now = currentTime;
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < now;
  }, [currentTime]);

  // Check if slot is available for coach
  const isSlotAvailableForCoach = useCallback((slot: TimeSlot, day: Date): boolean => {
    if (!slot.available || slot.blocked) return false;
    if (slot.type === 'clinic' || slot.type === 'reservation' || slot.type === 'private_coaching') return false;

    const dayOfWeek = format(day, 'EEEE').toLowerCase();
    const availability = selectedCoach.availability?.find(a => a.dayOfWeek === dayOfWeek);

    if (!availability || !availability.isAvailable) return false;
    if (slot.startTime < availability.startTime || slot.endTime > availability.endTime) return false;

    return privateSessionService.isCoachAvailable(
      selectedCoach.id,
      slot.date,
      slot.startTime,
      slot.endTime
    );
  }, [selectedCoach, privateSessionService]);

  // Handle time slot click
  const handleTimeSlotClick = useCallback((court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const timeSlots = timeSlotService.getTimeSlotsForDate(formattedDate, court.id);

    const relevantSlots = timeSlots.filter(
      slot => parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length > 0) {
      const slot = relevantSlots[0];
      if (isSlotAvailableForCoach(slot, day)) {
        onSelectTimeSlot(slot);
      }
    }
  }, [isSlotAvailableForCoach, onSelectTimeSlot, timeSlotService]);

  // Get time slot blocks for a court and day
  const getTimeSlotBlocks = useCallback((court: Court, day: Date) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const timeSlots = timeSlotService.getTimeSlotsForDate(formattedDate, court.id);

    const blocks: any[] = [];
    const startHour = 8;
    const endHour = 21;

    for (let hour = startHour; hour < endHour; hour++) {
      const slot = timeSlots.find(s => parseInt(s.startTime.split(":")[0]) === hour);

      blocks.push({
        startHour: hour,
        endHour: hour + 1,
        slot: slot || null,
        available: slot ? isSlotAvailableForCoach(slot, day) : false
      });
    }

    return blocks;
  }, [timeSlotService, isSlotAvailableForCoach]);

  return (
    <>
      <CoachHeader
        currentDate={currentDate}
        onPreviousDay={previousDay}
        onNextDay={nextDay}
        onToday={today}
        viewDays={viewDays}
        onViewDaysChange={setViewDays}
        coachName={selectedCoach.name}
      />

      <Card className="gradient-card overflow-hidden">
        <CardContent className="p-0 px-1 md:px-4 pb-2">
          <div className={cn(isMobile ? "overflow-x-hidden w-full max-w-full" : "overflow-x-auto")}>
            <div className={cn("relative", isMobile ? "w-full max-w-full" : "min-w-max")}>
              {/* Court rows with date headers over each column */}
              {courts.map((court) => (
                <div key={court.id} className={cn("mb-8", isMobile && "w-full max-w-full overflow-hidden")}>
                  {/* Court Header Bar */}
                  <div className="px-2 sm:px-3 py-3 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b border-border/30 rounded-t-lg mb-4">
                    <div className="flex items-center justify-between">
                      {/* Left Navigation Arrow */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={previousDay}
                        disabled={subDays(currentDate, 1) < startOfDay(new Date())}
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Center: Court Name */}
                      <div className="text-center flex-1">
                        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                          {court.name} - {selectedCoach.name}
                        </h2>
                      </div>

                      {/* Right Navigation Arrow */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={nextDay}
                        disabled={addDays(currentDate, 1) > addDays(startOfDay(new Date()), 30 - 1)}
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Time slots grid */}
                  <div
                    className={cn(
                      "grid",
                      isMobile ? "mobile-all-columns-visible gap-1" : "gap-2 sm:gap-4"
                    )}
                    style={{
                      gridTemplateColumns: isMobile
                        ? `repeat(${viewDays}, 1fr)`
                        : `repeat(${viewDays}, 1fr)`,
                      maxWidth: isMobile ? "100vw" : undefined,
                      width: "100%"
                    }}
                  >
                    {/* Date headers over each column */}
                    {daysToShow.map((day, dayIndex) => (
                      <div key={`${court.id}-${day.toString()}`} className={cn("border border-border/30 rounded-lg overflow-hidden", isMobile && "min-w-0")}>
                        {/* Date header */}
                        <div className="relative flex items-center justify-center text-center p-3 mb-3 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-0 shadow-lg">
                          {dayIndex === 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); previousDay(); }}
                              disabled={subDays(currentDate, 1) < startOfDay(new Date())}
                              className="absolute left-0.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                          )}
                          <div className="font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent text-base sm:text-lg px-6">
                            {format(day, isMobile ? "MMM d" : "EEEE, MMM d")}
                          </div>
                          {dayIndex === daysToShow.length - 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); nextDay(); }}
                              disabled={addDays(currentDate, 1) > addDays(startOfDay(new Date()), 30 - 1)}
                              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Time slots */}
                        <div className={cn("space-y-1", isMobile ? "p-1" : "p-2")}>
                          {getTimeSlotBlocks(court, day).map((block) => (
                            <TimeSlotBlock
                              key={`${court.id}-${day.toString()}-${block.startHour}`}
                              court={court}
                              day={day}
                              block={block}
                              isTimeSlotInPast={isTimeSlotInPast}
                              handleTimeSlotClick={handleTimeSlotClick}
                              isMobile={isMobile}
                              selectedCoach={selectedCoach}
                              isSlotAvailableForCoach={isSlotAvailableForCoach}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default CoachSchedulerView;
