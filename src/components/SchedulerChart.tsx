
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { TimeSlot, Court } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import DayView from "./DayView";
import { apiDataService } from "@/lib/services/api-data-service";
import { useDataService } from "@/hooks/use-data-service";
import { useUser } from "@/contexts/UserContext";

interface SchedulerChartProps {
  courts: Court[];
  timeSlots: TimeSlot[];
  onScheduleCourt: (court: Court) => void;
  onDateChange?: (date: Date) => void;
  onAddUserToReservation?: (timeSlotId: string) => void;
}

const SchedulerChart = ({ courts, timeSlots: _timeSlots, onScheduleCourt, onDateChange, onAddUserToReservation }: SchedulerChartProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(3);
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [operatingHours, setOperatingHours] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [daysToShow, setDaysToShow] = useState<Date[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get data from context (single source of truth)
  const { reservations, clinics, coaches, reservationSettings } = useDataService();
  const { currentUser } = useUser();

  // Initialize operating hours from context
  useEffect(() => {
    if (reservationSettings?.operatingHours) {
      setOperatingHours(reservationSettings.operatingHours);
      setIsInitialized(true);
    }
  }, [reservationSettings]);

  // Calculate days to show and load slots when current date changes
  useEffect(() => {
    if (!isInitialized) return;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const days = Array.from({ length: viewDays * 2 }, (_, i) => addDays(currentDate, i))
      .filter(day => {
        // Filter out any days that are in the past
        const today = startOfDay(new Date());
        if (day < today) return false;

        // Filter out closed days based on operating hours
        const dayOfWeek = day.getDay();
        const dayName = dayNames[dayOfWeek];
        const daySettings = operatingHours.find(d => d.dayOfWeek === dayName);

        return daySettings && daySettings.isOpen;
      })
      .slice(0, viewDays); // Take only the first viewDays that pass the filters

    setDaysToShow(days);

    // Load time slots for these days
    const loadSlots = async () => {
      if (days.length === 0) {
        return;
      }

      const allSlots = await Promise.all(
        days.map(day => {
          const formattedDate = format(day, "yyyy-MM-dd");
          return apiDataService.getTimeSlotsForDate(formattedDate);
        })
      );
      const flatSlots = allSlots.flat();
      setTimeSlots(flatSlots);
    };

    loadSlots();
  }, [currentDate, viewDays, isInitialized, operatingHours]);

  // Time range to display (8am to 10pm)
  const startHour = 8;
  const endHour = 22;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

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

  // Get availability for a specific court, day and hour
  const getSlotStatus = (court: Court, day: Date, hour: number) => {
    const dateString = format(day, "yyyy-MM-dd");
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    const now = new Date();
    const slotDateTime = new Date(day);
    slotDateTime.setHours(hour, 0, 0, 0);
    const isPast = slotDateTime < now;

    // Find the time slot
    const slot = timeSlots.find(
      ts => ts.courtId === court.id && ts.date === dateString && ts.startTime === timeString
    );

    if (!slot) {
      return { available: !isPast, reserved: false, isClinic: false, blocked: false, isMyReservation: false, isMyClinicReservation: false, coachName: undefined };
    }

    // Use enriched data from the API endpoint which already includes status flags
    const enrichedSlot = slot as any;

    // Check if this is the current user's reservation
    const reservation = enrichedSlot.reservation;
    const isMyReservation = reservation ? (
      reservation.playerEmail === currentUser?.email ||
      (currentUser?.id && reservation.createdById === currentUser.id)
    ) : false;

    const isClinic = enrichedSlot.isClinic ?? false;

    // Get coach name if this is a clinic
    let coachName: string | undefined;
    let isMyClinicReservation = false;
    if (isClinic) {
      // Use enriched clinic data from slot (includes participants) or fall back to lookup
      const clinic = enrichedSlot.clinic || clinics.find(c => c.id === enrichedSlot.clinicId);
      if (clinic?.coachId) {
        const coach = coaches.find(c => c.id === clinic.coachId);
        coachName = coach?.name;
      }
      // Check if user is in clinic participants
      const clinicParticipants = clinic?.participants || [];
      const isInClinicParticipants = currentUser?.email && clinicParticipants.some(
        (p: any) => p.email === currentUser.email || p.userId === currentUser.id
      );
      isMyClinicReservation = isMyReservation || isInClinicParticipants;
    }

    const result = {
      available: enrichedSlot.isAvailable ?? enrichedSlot.available ?? false,
      reserved: enrichedSlot.isReserved ?? false,
      isClinic,
      blocked: enrichedSlot.isBlocked ?? enrichedSlot.blocked ?? false,
      isMyReservation,
      isMyClinicReservation,
      coachName
    };

    return result;
  };

  return (
    <>
      {/* Instruction Banner */}
      <div className="text-sm bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg mb-4">
        💡 <strong>Tip:</strong> Click on any time slot to book users for that court
      </div>

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
                        const { available, reserved, isClinic, blocked, isMyReservation, isMyClinicReservation, coachName } = getSlotStatus(court, day, hour);
                        const dateString = format(day, "yyyy-MM-dd");
                        const timeSlot = timeSlots.find(
                          slot => slot.courtId === court.id &&
                                  slot.date === dateString &&
                                  slot.startTime === `${hour}:00`
                        );

                        return (
                          <div
                            key={`${court.id}-${day.toString()}-${hour}`}
                            className={cn(
                              "h-6 rounded-sm flex items-center px-1 text-sm sm:text-xs court-slot transition-all",
                              isMyClinicReservation ? "bg-purple-500/30 text-purple-800 border-2 border-yellow-500/80" :
                              isClinic ? "bg-yellow-500/30 text-yellow-800 border border-yellow-500/50" :
                              isMyReservation ? "bg-purple-500/30 text-purple-800 border border-purple-500/50" :
                              available ? "bg-primary/20 text-primary" :
                              reserved ? "bg-secondary/20 text-secondary" :
                              "bg-gray-100/20 text-gray-500",
                              !blocked && timeSlot && onAddUserToReservation && "cursor-pointer hover:scale-105 hover:shadow-md"
                            )}
                            onClick={() => {
                              if (!blocked && timeSlot && onAddUserToReservation) {
                                onAddUserToReservation(timeSlot.id);
                              }
                            }}
                            title={
                              isMyClinicReservation ? `My Reservation, Coaching session with ${coachName || 'Coach'}` :
                              isMyReservation ? "My Reservation" :
                              isClinic ? "Clinic" :
                              !blocked && timeSlot ? "Click to add user to this time slot" : undefined
                            }
                          >
                            {isMyReservation || isMyClinicReservation ? <User className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
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
                <div className="w-3 h-3 bg-purple-500/30 rounded-sm border border-purple-500/50"></div>
                <span>My Reservation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500/30 rounded-sm border-2 border-yellow-500/80"></div>
                <span>My Coaching Session</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500/30 rounded-sm border border-yellow-500/50"></div>
                <span>Clinic</span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Click date headers to view full day schedule • Click time slots to book users
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

