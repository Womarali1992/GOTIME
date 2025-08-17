
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { TimeSlot, Court } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SchedulerChartProps {
  courts: Court[];
  timeSlots: TimeSlot[];
  onScheduleCourt: (court: Court) => void;
}

const SchedulerChart = ({ courts, timeSlots, onScheduleCourt }: SchedulerChartProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(3);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Time range to display (8am to 10pm)
  const startHour = 8;
  const endHour = 22;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Calculate days to display based on current date
  const daysToShow = Array.from({ length: viewDays }, (_, i) => addDays(currentDate, i));

  // Navigate through dates
  const previousDay = () => setCurrentDate(subDays(currentDate, 1));
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const today = () => setCurrentDate(startOfDay(new Date()));

  // Get availability for a specific court, day and hour
  const getSlotStatus = (court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const relevantSlots = timeSlots.filter(
      slot =>
        slot.courtId === court.id &&
        slot.date === formattedDate &&
        parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length === 0) return { available: false, reserved: false, isClinic: false };

    const slot = relevantSlots[0];
    const isClinic = slot.type === 'clinic';
    
    return {
      available: slot.available,
      reserved: !slot.available && !isClinic,
      isClinic: isClinic,
      slot: slot,
    };
  };

  return (
    <Card className="gradient-card overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* Changed gradient-text to normal text color for better readability */}
        <CardTitle className="text-lg md:text-xl font-bold text-foreground">
          Court Schedule
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={previousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={today}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-1 md:px-4 pb-2">
        <div className="overflow-x-auto">
          <div className="min-w-max relative">
            {/* Time header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `150px repeat(${viewDays}, 1fr)`,
              }}
            >
              {/* Empty cell for court names */}
              <div className="border-b border-border/30 p-2"></div>

              {/* Date headers */}
              {daysToShow.map((day) => (
                <div
                  key={day.toString()}
                  className="border-b border-border/30 p-2 text-center font-medium text-foreground"
                >
                  {format(day, isMobile ? "MMM d" : "EEEE, MMM d")}
                </div>
              ))}
            </div>

            {/* Court rows */}
            {courts.map((court) => (
              <div
                key={court.id}
                className="grid"
                style={{
                  gridTemplateColumns: `150px repeat(${viewDays}, 1fr)`,
                }}
              >
                {/* Court name */}
                <div className="border-b border-border/30 p-2 flex flex-col justify-center">
                  <span className="font-medium text-foreground">{court.name}</span>
                  <Badge
                    variant={court.indoor ? "secondary" : "outline"}
                    className={cn(
                      "mt-1 text-xs",
                      court.indoor ? "bg-secondary/20" : "border-primary/20"
                    )}
                  >
                    {court.indoor ? "Indoor" : "Outdoor"}
                  </Badge>
                </div>

                {/* Day cells */}
                {daysToShow.map((day) => (
                  <div key={`${court.id}-${day.toString()}`} className="border-b border-border/30 p-2">
                    <div className="space-y-1">
                      {hours.map((hour) => {
                        const { available, reserved, isClinic } = getSlotStatus(court, day, hour);
                        return (
                          <div
                            key={`${court.id}-${day.toString()}-${hour}`}
                            className={cn(
                              "h-6 rounded-sm flex items-center px-1 text-xs court-slot",
                              isClinic ? "bg-yellow-500/30 text-yellow-800 border border-yellow-500/50" :
                              available ? "bg-primary/20 text-primary" :
                              reserved ? "bg-secondary/20 text-secondary" :
                              "bg-gray-100/20 text-gray-500"
                            )}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {`${hour}:00`}
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onScheduleCourt(court)}
                      className="w-full mt-2 text-xs h-7"
                    >
                      Schedule
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchedulerChart;

