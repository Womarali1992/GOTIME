
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { TimeSlot, Court } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import DayView from "./DayView";
import { dataService } from "@/lib/services/data-service";
// Use services-based status via dataService

interface SchedulerChartProps {
  courts: Court[];
  timeSlots: TimeSlot[];
  onScheduleCourt: (court: Court) => void;
  onDateChange?: (date: Date) => void;
}

const SchedulerChart = ({ courts, timeSlots, onScheduleCourt, onDateChange }: SchedulerChartProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(3);
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const reservations = dataService.reservationService.getAllReservations();
  const clinics = dataService.clinicService.getAllClinics();
  const coaches = dataService.coachService.getAllCoaches();

  // Call onDateChange when currentDate changes
  useEffect(() => {
    if (onDateChange) {
      onDateChange(currentDate);
    }
  }, [currentDate, onDateChange]);

  // Time range to display (8am to 10pm)
  const startHour = 8;
  const endHour = 22;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Calculate days to display based on current date
  // Show viewDays starting from the current date, no past days
  const daysToShow = Array.from({ length: viewDays }, (_, i) => addDays(currentDate, i))
    .filter(day => {
      // Filter out any days that are in the past
      const today = startOfDay(new Date());
      return day >= today;
    });

  // Navigate through dates - prevent going to past dates
  const previousDay = () => {
    const newDate = subDays(currentDate, 1);
    const today = startOfDay(new Date());
    if (newDate >= today) {
      setCurrentDate(newDate);
    }
  };
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const today = () => setCurrentDate(startOfDay(new Date()));

  // Handle date header click to open DayView
  const handleDateHeaderClick = (date: Date) => {
    setSelectedDateForDayView(date);
  };

  // Get availability for a specific court, day and hour - services single source of truth
  const getSlotStatus = (court: Court, day: Date, hour: number) => {
    const dateString = format(day, "yyyy-MM-dd");
    return dataService.timeSlotService.getSlotStatus(court.id, dateString, hour);
  };

  return (
    <>
      <Card className="gradient-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Changed gradient-text to normal text color for better readability */}
          <CardTitle className="text-lg md:text-xl font-bold text-foreground">
            Court Schedule
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={previousDay}
              disabled={subDays(currentDate, 1) < startOfDay(new Date())}
            >
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
            {/* Court rows with date headers over each column */}
            {courts.map((court) => (
              <div
                key={court.id}
                className={cn(
                  "grid",
                  isMobile ? "mobile-three-columns" : ""
                )}
                style={{
                  gridTemplateColumns: isMobile 
                    ? `150px repeat(${viewDays}, minmax(280px, 1fr))`
                    : `150px repeat(${viewDays}, 1fr)`,
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

                {/* Date headers over each column */}
                {daysToShow.map((day) => (
                  <div key={`${court.id}-${day.toString()}`} className="border-b border-border/30 p-2">
                    {/* Date header */}
                    <div
                      className="text-center cursor-pointer transition-colors duration-200 p-3 mb-2 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-0 shadow-lg hover:from-primary/10 hover:via-secondary/10 hover:to-primary/10"
                      onClick={() => handleDateHeaderClick(day)}
                      title="Click to view full day schedule"
                    >
                      <div className="font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                        {format(day, isMobile ? "MMM d" : "EEEE, MMM d")}
                      </div>
                    </div>
                    
                    {/* Time slots */}
                    <div className="space-y-1">
                      {hours.map((hour) => {
                        const { available, reserved, isClinic } = getSlotStatus(court, day, hour);
                        return (
                          <div
                            key={`${court.id}-${day.toString()}-${hour}`}
                            className={cn(
                              "h-6 rounded-sm flex items-center px-1 text-sm sm:text-xs court-slot",
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
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary/20 rounded-sm border border-primary/30"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-secondary/20 rounded-sm border border-secondary/30"></div>
                <span>Reserved</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500/30 rounded-sm border border-yellow-500/50"></div>
                <span>Clinic</span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Click date headers to view full day schedule
            </p>
          </div>
        </CardContent>
      </Card>

      {/* DayView Modal */}
      {selectedDateForDayView && (
        <DayView
          selectedDate={selectedDateForDayView}
          onClose={() => setSelectedDateForDayView(null)}
          courts={courts}
          timeSlots={timeSlots}
          reservations={reservations}
          clinics={clinics}
          coaches={coaches}
          isOpen={selectedDateForDayView !== null}
          onDateChange={setSelectedDateForDayView}
        />
      )}
    </>
  );
};

export default SchedulerChart;

