import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, subDays, startOfDay, startOfWeek } from "date-fns";
import { TimeSlot, Court, Clinic, Reservation, Comment } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn, getTimeSlotStatus, getTimeSlotStatusClasses } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useDataService } from "@/hooks/use-data-service";

import DayView from "./DayView";
import CourtCalendar from "./CourtCalendar";
import CourtHeader from "./CourtHeader";

// Type definitions for time slot blocks
interface TimeSlotBlockData {
  startHour: number;
  endHour: number;
  isClinic: boolean;
  clinic: Clinic | null;
  slot: TimeSlot | null;
  available: boolean;
  reserved: boolean;
  blocked: boolean;
  isMyReservation: boolean;
}

interface ReservationWithDetails {
  reservation: Reservation;
  timeSlot: TimeSlot;
  court: Court;
}

interface HomeSchedulerViewProps {
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
}

// Memoized component for time slot blocks to prevent unnecessary re-renders
const TimeSlotBlock = React.memo(({
  court,
  day,
  block,
  isTimeSlotInPast,
  handleTimeSlotClick,
  getFirstAvailableSlotForBlock,
  legendFilters,
  currentUserEmail,
  isMobile
}: {
  court: Court;
  day: Date;
  block: TimeSlotBlockData;
  isTimeSlotInPast: (day: Date, hour: number) => boolean;
  handleTimeSlotClick: (court: Court, day: Date, hour: number) => void;
  getFirstAvailableSlotForBlock: (court: Court, day: Date, startHour: number, endHour: number) => TimeSlot | null;
  legendFilters: {
    available: boolean;
    clinic: boolean;
    myReservations: boolean;
  };
  currentUserEmail: string;
  isMobile: boolean;
}) => {
  const isPast = isTimeSlotInPast(day, block.startHour);
  const duration = block.endHour - block.startHour;
  const isMultiHour = duration > 1;

  return (
    <div
      key={`${court.id}-${day.toString()}-${block.startHour}-${block.endHour}`}
      className={cn(
        "text-sm sm:text-base text-center rounded cursor-pointer transition-all duration-200 hover:scale-105 relative",
        isMobile ? "p-1" : "p-3",
        block.isMyReservation
          ? "bg-purple-500/20 text-purple-800 border border-purple-500/30 hover:bg-purple-500/30"
          : block.isClinic
          ? "bg-yellow-500/20 text-yellow-800 border border-yellow-500/30 hover:bg-yellow-500/30"
          : block.available && !block.blocked && !block.reserved
          ? "bg-green-500/20 text-green-800 border border-green-500/30 hover:bg-green-500/30"
          : block.reserved
          ? "bg-secondary/20 text-secondary-800 border border-secondary/30 hover:bg-secondary/30"
          : block.blocked
          ? "bg-gray-500/20 text-gray-800 border border-gray-500/30"
          : "bg-gray-100 text-gray-400 cursor-not-allowed",
        isMultiHour && "flex items-center justify-center border-2 shadow-sm",
        isMultiHour && block.isClinic && "border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-yellow-500/30 hover:from-yellow-500/30 hover:to-yellow-500/40",
        isMultiHour && block.isMyReservation && "border-purple-500/50 bg-gradient-to-br from-purple-500/20 to-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/40",
        isMultiHour && block.available && !block.isClinic && !block.isMyReservation && "border-green-500/50 bg-gradient-to-br from-green-500/20 to-green-500/30 hover:from-green-500/30 hover:to-green-500/40"
      )}
      style={{
        height: isMultiHour ? `${duration * (isMobile ? 4 : 3.5)}rem` : undefined,
        minHeight: isMultiHour ? undefined : isMobile ? "4rem" : "3.5rem",
        marginBottom: isMultiHour ? "0.5rem" : undefined
      }}
      onClick={() => {
        if (block.isClinic && isMultiHour) {
          const slot = getFirstAvailableSlotForBlock(court, day, block.startHour, block.endHour);
          if (slot) {
            handleTimeSlotClick(court, day, block.startHour);
          }
        } else {
          handleTimeSlotClick(court, day, block.startHour);
        }
      }}
      title={
        block.isMyReservation
          ? `My Reservation: ${block.startHour}:00 - ${block.endHour}:00`
          : block.clinic
          ? `${block.clinic.name}: ${block.clinic.description} ($${block.clinic.price})`
          : `${block.startHour}:00 - ${block.endHour}:00`
      }
    >
      {isMultiHour ? (
        <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
          <span className="font-medium text-lg sm:text-base">{block.startHour}:00</span>
          <span className="text-sm sm:text-xs opacity-75 font-medium">to</span>
          <span className="font-medium text-lg sm:text-base">{block.endHour}:00</span>
          {block.isClinic && block.clinic && (
            <span 
              className="text-[10px] mt-2 px-2 py-1 bg-yellow-500/20 rounded border border-yellow-500/30 text-yellow-800 font-medium text-center break-words leading-tight max-w-full overflow-visible cursor-help"
              title={block.clinic.name}
            >
              {block.clinic.name}
            </span>
          )}
          {block.isMyReservation && (
            <span className="text-sm mt-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 text-purple-800 font-medium">
              My Reservation
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 justify-center w-full h-full overflow-hidden">
          <span className="text-lg sm:text-base font-medium">{block.startHour}:00</span>
          {block.isClinic && block.clinic && (
            <span 
              className="text-[8px] sm:text-[9px] px-1 py-0.5 bg-yellow-500/20 rounded border border-yellow-500/30 text-yellow-800 font-medium break-words leading-tight text-center w-full overflow-visible cursor-help"
              title={block.clinic.name}
            >
              {block.clinic.name}
            </span>
          )}
          {block.isMyReservation && (
            <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-purple-500/20 rounded-full border border-purple-500/30 text-purple-800 font-medium whitespace-nowrap">
              My Reservation
            </span>
          )}
        </div>
      )}

      {block.isClinic && block.clinic && (
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-yellow-500 border border-white"></div>
        </div>
      )}
      {block.isMyReservation && (
        <div className="absolute -top-1 -left-1">
          <div className="w-2 h-2 bg-purple-500 border border-white"></div>
        </div>
      )}
    </div>
  );
});

const HomeSchedulerView = ({ onSelectTimeSlot }: HomeSchedulerViewProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(3);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const [showMyReservations, setShowMyReservations] = useState<boolean>(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null);
  
  // Legend filter states
  const [legendFilters, setLegendFilters] = useState<{
    available: boolean;
    clinic: boolean;
    myReservations: boolean;
  }>({
    available: true,
    clinic: true,
    myReservations: true,
  });

  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedCourt, setSelectedCourt] = useState<string | undefined>(undefined);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Refs for click-outside functionality

  const myReservationsModalRef = useRef<HTMLDivElement>(null);
  const dayViewModalRef = useRef<HTMLDivElement>(null);
  const reservationPopupRef = useRef<HTMLDivElement>(null);

  // Get current user from context
  const { currentUser } = useUser();
  const currentUserEmail = currentUser?.email || "";
  
  // Get data service
  const dataService = useDataService();

  const activeFilterLabel = useMemo(() => {
    if (legendFilters.available && legendFilters.clinic && legendFilters.myReservations) return "All";
    if (legendFilters.available) return "Available";
    if (legendFilters.clinic) return "Clinic";
    if (legendFilters.myReservations) return "My Reservations";
    return "All";
  }, [legendFilters]);

  const isAllOn = useMemo(() => (
    legendFilters.available && legendFilters.clinic && legendFilters.myReservations
  ), [legendFilters]);

  // Toggle legend filter
  // Behavior:
  // - Click on a filter when all are on -> enable exclusive mode for that filter
  // - Click again on the active exclusive filter -> turn all filters back on (show all)
  // - Click on a different filter while in exclusive mode -> switch exclusive filter
  const toggleLegendFilter = useCallback((filterType: keyof typeof legendFilters) => {
    setLegendFilters((prev) => {
      const allOn = prev.available && prev.clinic && prev.myReservations;
      const entries = Object.entries(prev) as Array<[keyof typeof prev, boolean]>;
      const numOn = entries.reduce((count, [, value]) => count + (value ? 1 : 0), 0);
      const isExclusive = numOn === 1 && prev[filterType];

      if (isExclusive) {
        // Turning off the active exclusive filter -> show all
        return { available: true, clinic: true, myReservations: true };
      }

      // Otherwise switch to exclusive mode for the selected filter
      return {
        available: filterType === 'available',
        clinic: filterType === 'clinic',
        myReservations: filterType === 'myReservations',
      };
    });
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Generate time slots for the current view when dates change
  useEffect(() => {
    const endDate = addDays(currentDate, viewDays - 1);
    // Note: time slots are now generated in the data service initialization
    // This effect is kept for future dynamic loading if needed
  }, [currentDate, viewDays]);

  // Time range to display (8am to 9pm)
  const startHour = 8;
  const endHour = 21;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Calculate days to display based on current date
  const daysToShow = useMemo(() => {
    const today = startOfDay(new Date());
    
    if (viewDays === 3) {
      // For 3-day view: center the selected date unless it's today
      const isSelectedDateToday = currentDate.getTime() === today.getTime();
      
      if (isSelectedDateToday) {
        // If selected date is today, show today as first column
        return Array.from({ length: viewDays }, (_, i) => {
          return addDays(currentDate, i);
        }).filter(day => day >= today);
      } else {
        // If selected date is not today, center it (show: previous day, selected day, next day)
        const centerDays = [
          subDays(currentDate, 1),
          currentDate,
          addDays(currentDate, 1)
        ].filter(day => day >= today);
        
        // If filtering removes the first day (because it's in the past), 
        // show selected date + next 2 days instead
        if (centerDays.length < 3) {
          return Array.from({ length: viewDays }, (_, i) => {
            return addDays(currentDate, i);
          }).filter(day => day >= today);
        }
        
        return centerDays;
      }
    } else {
      // For other view modes, use original logic
      return Array.from({ length: viewDays }, (_, i) => {
        return addDays(currentDate, i);
      }).filter(day => day >= today);
    }
  }, [currentDate, viewDays]);

  // Helper function to calculate week offset for a given date
  const calculateWeekOffset = (targetDate: Date) => {
    const today = startOfDay(new Date());
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    const targetWeekStart = startOfWeek(targetDate, { weekStartsOn: 0 });
    
    // Calculate the difference in weeks
    const diffInMs = targetWeekStart.getTime() - todayWeekStart.getTime();
    const diffInWeeks = Math.round(diffInMs / (7 * 24 * 60 * 60 * 1000));
    
    return diffInWeeks;
  };

  // Navigate through dates - prevent going to past dates and sync week offset
  const previousDay = useCallback(() => {
    const newDate = subDays(currentDate, 1);
    const today = startOfDay(new Date());
    if (newDate >= today) {
      setCurrentDate(newDate);

      // Update week offset to match the new date's week
      const newWeekOffset = calculateWeekOffset(newDate);
      if (newWeekOffset !== weekOffset) {
        setWeekOffset(newWeekOffset);
      }
    }
  }, [currentDate, weekOffset]);

  const nextDay = useCallback(() => {
    const newDate = addDays(currentDate, 1);
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 30 - 1); // Use default 30 days visibility
    
    if (newDate <= maxDate) {
      setCurrentDate(newDate);

      // Update week offset to match the new date's week
      const newWeekOffset = calculateWeekOffset(newDate);
      if (newWeekOffset !== weekOffset) {
        setWeekOffset(newWeekOffset);
      }
    }
  }, [currentDate, weekOffset]);

  const today = useCallback(() => {
    const todayDate = startOfDay(new Date());
    setCurrentDate(todayDate);

    // Reset week offset to current week (0)
    setWeekOffset(0);
  }, []);
  
  // Handle date selection from day-of-week tabs
  const handleDateSelect = useCallback((date: Date) => {
    // Only allow selecting current or future dates
    const today = startOfDay(new Date());
    if (date >= today) {
      const selectedDate = startOfDay(date);
      setCurrentDate(selectedDate);

      // Update week offset to match the selected date's week (in case of edge cases)
      const newWeekOffset = calculateWeekOffset(selectedDate);
      if (newWeekOffset !== weekOffset) {
        setWeekOffset(newWeekOffset);
      }
    }
  }, [weekOffset]);

  // Handle date header click to open DayView
  const handleDateHeaderClick = useCallback((date: Date) => {
    setSelectedDateForDayView(date);
  }, []);

  // Check if a time slot is in the past
  const isTimeSlotInPast = useCallback((day: Date, hour: number) => {
    const now = currentTime;
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < now;
  }, [currentTime]);

  // Get availability for a specific court, day and hour - services single source of truth
  const getSlotStatus = (court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    return dataService.timeSlotService.getSlotStatus(court.id, formattedDate, hour);
  };

  const handleTimeSlotClick = useCallback((court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const timeSlots = dataService.timeSlotService.getTimeSlotsForDate(formattedDate, court.id);

    const relevantSlots = timeSlots.filter(
      slot => parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length > 0) {
      const slot = relevantSlots[0];
      // Check if this is a reservation
      const reservation = dataService.reservations.find(res => res.timeSlotId === slot.id);

      if (reservation) {
        // Show reservation popup
        setSelectedReservation({
          reservation,
          timeSlot: slot,
          court
        });
      } else if (slot.available) {
        // Handle available slot booking
        onSelectTimeSlot(slot);
      }
    }
  }, [onSelectTimeSlot, dataService.reservations, dataService.timeSlotService]);

  // Helper function to get the first available time slot for a clinic block
  const getFirstAvailableSlotForBlock = useCallback((court: Court, day: Date, startHour: number, endHour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const timeSlots = dataService.timeSlotService.getTimeSlotsForDate(formattedDate, court.id);

    for (let hour = startHour; hour < endHour; hour++) {
      const relevantSlots = timeSlots.filter(
        slot => parseInt(slot.startTime.split(":")[0]) === hour
      );

      if (relevantSlots.length > 0 && relevantSlots[0].available) {
        return relevantSlots[0];
      }
    }

    return null;
  }, []);





  // Click outside handlers and keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {

      if (myReservationsModalRef.current && !myReservationsModalRef.current.contains(event.target as Node)) {
        setShowMyReservations(false);
      }
      if (reservationPopupRef.current && !reservationPopupRef.current.contains(event.target as Node)) {
        setSelectedReservation(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {

        setShowMyReservations(false);
        setSelectedReservation(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle background click to close modals
  const handleBackgroundClick = useCallback((modalType: string) => {
    if (modalType === 'myReservations') {
      setShowMyReservations(false);
    } else if (modalType === 'reservationPopup') {
      setSelectedReservation(null);
    }
  }, []);

  return (
    <>
      {/* CourtHeader now contains the top bar with view toggles and court/date info */}
      <CourtHeader
        courtId={selectedCourt || "all"}
        courtName={selectedCourt ? (dataService.courts.find(court => court.id === selectedCourt)?.name || "All Courts") : "All Courts"}
        currentDate={currentDate}
        onDateSelect={handleDateSelect}
        weekOffset={weekOffset}
        onWeekChange={setWeekOffset}
        viewDays={viewDays}
        onViewDaysChange={setViewDays}
        legendFilters={legendFilters}
        onLegendFiltersChange={setLegendFilters}
        selectedCourt={selectedCourt}
        onCourtChange={setSelectedCourt}
      />

      <Card className="gradient-card overflow-hidden">
        <CardContent className="p-0 px-1 md:px-4 pb-2">



          {/* Show schedule view or calendar view based on viewDays */}
          {viewDays === 0 ? (
            // Calendar View
            <CourtCalendar 
              onSelectTimeSlot={onSelectTimeSlot} 
              selectedDate={currentDate}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
              viewDays={viewDays}
              onViewDaysChange={setViewDays}
              legendFilters={legendFilters}
              onLegendFiltersChange={setLegendFilters}
              selectedCourt={selectedCourt}
              onCourtChange={setSelectedCourt}
              onDateChange={setCurrentDate}
            />
          ) : viewDays === 1 ? (
            // Day View - show all courts horizontally for single day
            <DayView
              selectedDate={currentDate}
              onClose={() => {}} // No close needed for inline view
              courts={dataService.courts}
              timeSlots={dataService.timeSlots}
              reservations={dataService.reservations}
              clinics={dataService.clinics}
              coaches={dataService.coaches}
              isOpen={true}
              isModal={false}
              onSelectTimeSlot={onSelectTimeSlot}
              onDateChange={setCurrentDate}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
              viewDays={viewDays}
              onViewDaysChange={setViewDays}
              legendFilters={legendFilters}
              onLegendFiltersChange={setLegendFilters}
              selectedCourt={selectedCourt}
              onCourtChange={setSelectedCourt}
            />
          ) : (
            // Schedule View (Week view)
            <div className={cn(isMobile ? "overflow-x-hidden w-full max-w-full" : "overflow-x-auto")}>
              <div className={cn("relative", isMobile ? "w-full max-w-full" : "min-w-max")}> 
                {/* Court rows with date headers over each column */}
                {(selectedCourt ? dataService.courts.filter(court => court.id === selectedCourt) : dataService.courts).map((court) => (
                  <div key={court.id} className={cn("mb-8", isMobile && "w-full max-w-full overflow-hidden")}>
                    {/* Court Header Bar - only show when viewing all courts */}
                    {!selectedCourt && (
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

                          {/* Center: Date and Court Name */}
                          <div className="text-center flex-1">
                            {/* Mobile: Stack court name and date */}
                            <div className="sm:hidden">
                              <div className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                                <div className="text-sm font-semibold">{court.name}</div>
                                <div className="text-lg font-bold">{format(currentDate, "EEEE, MMMM d")}</div>
                              </div>
                            </div>
                            
                            {/* Desktop: Single line */}
                            <h2 className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                              Pickleball Court {format(currentDate, "EEEE, MMMM d")} - {court.name}
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
                    )}
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
                          <div
                            className="relative flex items-center justify-center text-center cursor-pointer transition-colors duration-200 p-3 mb-3 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-0 shadow-lg hover:from-primary/10 hover:via-secondary/10 hover:to-primary/10"
                            onClick={() => handleDateHeaderClick(day)}
                            title="Click to view full day schedule"
                          >
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
                              {!selectedCourt && isMobile ? (
                                <div className="flex flex-col">
                                  <span>{format(day, "EEE do").toUpperCase()}</span>
                                </div>
                              ) : !selectedCourt ? (
                                format(day, "EEEE MMMM d")
                              ) : (
                                format(day, isMobile ? "MMM d" : "EEEE, MMM d")
                              )}
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
                            {(() => {
                              const timeSlotBlocks: Array<{
                                startHour: number;
                                endHour: number;
                                isClinic: boolean;
                                clinic: Clinic | null;
                                slot: TimeSlot | null;
                                available: boolean;
                                reserved: boolean;
                                blocked: boolean;
                                isMyReservation: boolean;
                              }> = [];
                              
                              let currentBlock: {
                                startHour: number;
                                endHour: number;
                                isClinic: boolean;
                                clinic: Clinic | null;
                                slot: TimeSlot | null;
                                available: boolean;
                                reserved: boolean;
                                blocked: boolean;
                                isMyReservation: boolean;
                              } | null = null;
                              
                              // Group consecutive time slots into blocks
                              for (let i = 0; i < hours.length; i++) {
                                const hour = hours[i];
                                const { available, reserved, blocked, isClinic, slot, clinic, reservation } = getSlotStatus(court, day, hour);
                                
                                // Check if this is the current user's reservation
                                const isMyReservation = reservation ? reservation.playerEmail === currentUserEmail : false;
                                
                                if (isClinic && clinic) {
                                  // If this is a clinic and it's the same clinic as the previous hour
                                  if (currentBlock && 
                                      currentBlock.isClinic && 
                                      currentBlock.clinic?.id === clinic.id &&
                                      currentBlock.endHour === hour) {
                                    // Extend the current block
                                    currentBlock.endHour = hour + 1;
                                  } else {
                                    // Start a new clinic block
                                    if (currentBlock) {
                                      timeSlotBlocks.push(currentBlock);
                                    }
                                    currentBlock = {
                                      startHour: hour,
                                      endHour: hour + 1,
                                      isClinic: true,
                                      clinic,
                                      slot,
                                      available,
                                      reserved,
                                      blocked: !!blocked,
                                      isMyReservation
                                    };
                                  }
                                } else {
                                  // If this is not a clinic, add the previous block and create a new single-hour block
                                  if (currentBlock) {
                                    timeSlotBlocks.push(currentBlock);
                                    currentBlock = null;
                                  }
                                  
                                  timeSlotBlocks.push({
                                    startHour: hour,
                                    endHour: hour + 1,
                                    isClinic: false,
                                    clinic: null,
                                    slot,
                                    available,
                                    reserved,
                                    blocked: !!blocked,
                                    isMyReservation
                                  });
                                }
                              }
                              
                              // Add the last block if it exists
                              if (currentBlock) {
                                timeSlotBlocks.push(currentBlock);
                              }
                              
                              return timeSlotBlocks
                                .filter((block) => {
                                  // Apply legend filters
                                  // Clinic blocks should only be filtered by clinic filter
                                  if (block.isClinic) {
                                    return legendFilters.clinic;
                                  }

                                  // Non-clinic blocks use other filters
                                  if (block.available && !block.reserved && !block.blocked && !legendFilters.available) return false;
                                  // Removed reserved legend filter; reserved blocks are shown unless filtered by My Reservations
                                  if (block.isMyReservation && !legendFilters.myReservations) return false;
                                  return true;
                                })
                                .map((block, blockIndex) => (
                                  <TimeSlotBlock
                                    key={`${court.id}-${day.toString()}-${block.startHour}-${block.endHour}`}
                                    court={court}
                                    day={day}
                                    block={block}
                                    isTimeSlotInPast={isTimeSlotInPast}
                                    handleTimeSlotClick={handleTimeSlotClick}
                                    getFirstAvailableSlotForBlock={getFirstAvailableSlotForBlock}
                                    legendFilters={legendFilters}
                                    currentUserEmail={currentUserEmail}
                                    isMobile={isMobile}
                                  />
                                ));
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day View Modal */}
      {selectedDateForDayView && (
        <DayView
          selectedDate={selectedDateForDayView}
          onClose={() => setSelectedDateForDayView(null)}
          courts={dataService.courts}
          timeSlots={dataService.timeSlots}
          reservations={dataService.reservations}
          clinics={dataService.clinics}
          coaches={dataService.coaches}
          isOpen={selectedDateForDayView !== null}
        />
      )}



       {/* My Reservations Modal */}
       {showMyReservations && (
         <div 
           className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-4"
           onClick={() => handleBackgroundClick('myReservations')}
         >
           <div 
             ref={myReservationsModalRef} 
             className="bg-white rounded-lg w-full max-w-[90vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="p-3 sm:p-6">
               <div className="flex items-start justify-between mb-4">
                 <h2 className="text-base sm:text-xl font-semibold text-foreground pr-2 flex-1">My Reservations</h2>
                 <button
                   onClick={() => setShowMyReservations(false)}
                   className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl flex-shrink-0 p-1"
                 >
                   ×
                 </button>
               </div>
               
               <div className="space-y-4">
                 {dataService.reservations
                   .filter(res => res.playerEmail === currentUserEmail)
                   .map(reservation => {
                     const timeSlot = dataService.timeSlots.find(ts => ts.id === reservation.timeSlotId);
                     const court = dataService.courts.find(c => c.id === reservation.courtId);
                     const date = timeSlot ? new Date(timeSlot.date) : new Date();
                     
                     return (
                       <div key={reservation.id} className="border border-purple-200 rounded-lg p-3 sm:p-4 bg-purple-50">
                         <div className="flex items-center justify-between">
                           <div className="min-w-0 flex-1">
                             <h3 className="font-semibold text-purple-800 text-sm sm:text-base">
                               {court?.name} - {format(date, "MMM d")}
                             </h3>
                             <p className="text-purple-600 text-sm">
                               {timeSlot?.startTime} - {timeSlot?.endTime}
                             </p>
                             <p className="text-xs sm:text-sm text-purple-500">
                              {reservation.players} player{reservation.players !== 1 ? 's' : ''}
                              {reservation.participants && reservation.participants.length > 1 && (
                                <span className="ml-2 text-xs">
                                  (You + {reservation.participants.length - 1} friend{reservation.participants.length - 1 !== 1 ? 's' : ''})
                                </span>
                              )}
                            </p>
                           </div>
                           <div className="w-4 h-4 bg-purple-500/20 border border-purple-500/30 rounded"></div>
                         </div>
                       </div>
                     );
                   })}
                 
                 {dataService.reservations.filter(res => res.playerEmail === currentUserEmail).length === 0 && (
                   <div className="text-center py-8 text-gray-500">
                     <p>You don't have any reservations yet.</p>
                   </div>
                   )}
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Reservation Details Popup */}
       {selectedReservation && (
         <div 
           className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-4"
           onClick={() => handleBackgroundClick('reservationPopup')}
         >
           <div 
             ref={reservationPopupRef} 
             className="bg-white rounded-lg w-full max-w-[90vw] sm:max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-y-auto shadow-2xl"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="p-3 sm:p-6">
               <div className="flex items-start justify-between mb-4">
                 <h2 className="text-base sm:text-xl font-semibold text-foreground pr-2 flex-1">Reservation Details</h2>
                 <button
                   onClick={() => setSelectedReservation(null)}
                   className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl flex-shrink-0 p-1"
                 >
                   ×
                 </button>
               </div>
               
               <div className="space-y-4">
                 <div className="border border-blue-200 rounded-lg p-3 sm:p-4 bg-blue-50">
                   <div className="space-y-3">
                     <div>
                       <h3 className="font-semibold text-blue-800 text-base sm:text-lg">
                         {selectedReservation.court?.name}
                       </h3>
                       <p className="text-blue-600 text-sm sm:text-base">
                         {format(new Date(selectedReservation.timeSlot.date), "MMM d")}
                       </p>
                     </div>
                     
                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                       <div className="flex items-center gap-2">
                         <Clock className="h-4 w-4 text-blue-600" />
                         <span className="text-blue-700 font-medium text-sm sm:text-base">
                           {selectedReservation.timeSlot.startTime} - {selectedReservation.timeSlot.endTime}
                         </span>
                       </div>
                       <div className="flex items-center gap-2">
                         <MapPin className="h-4 w-4 text-blue-600" />
                         <span className="text-blue-700 text-sm sm:text-base">
                           {selectedReservation.court?.location}
                         </span>
                       </div>
                     </div>
                     
                     <div className="border-t border-blue-200 pt-3">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                         <div>
                           <span className="text-blue-600 font-medium">Player:</span>
                           <p className="text-blue-800">{selectedReservation.reservation.playerName}</p>
                         </div>
                         <div>
                           <span className="text-blue-600 font-medium">Players:</span>
                           <p className="text-blue-800">{selectedReservation.reservation.players}</p>
                         </div>
                         <div>
                           <span className="text-blue-600 font-medium">Email:</span>
                           <p className="text-blue-800 text-xs">{selectedReservation.reservation.playerEmail}</p>
                         </div>
                         <div>
                           <span className="text-blue-600 font-medium">Phone:</span>
                           <p className="text-blue-800">{selectedReservation.reservation.playerPhone}</p>
                         </div>
                       </div>
                     </div>
                     
                     {selectedReservation.reservation.comments && selectedReservation.reservation.comments.length > 0 && (
                       <div className="border-t border-blue-200 pt-3">
                         <span className="text-blue-600 font-medium">Comments:</span>
                         <div className="mt-2 space-y-2">
                           {selectedReservation.reservation.comments.map((comment: Comment, index: number) => (
                             <div key={comment.id || index} className="bg-blue-100 rounded p-2">
                               <p className="text-blue-800 text-sm">{comment.text}</p>
                               <p className="text-blue-600 text-xs mt-1">
                                 - {comment.authorName} ({format(new Date(comment.createdAt), "MMM d, yyyy")})
                               </p>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                     
                     <div className="border-t border-blue-200 pt-3">
                       <p className="text-blue-600 text-xs">
                         Reserved on {format(new Date(selectedReservation.reservation.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
    </>
  );
};

export default HomeSchedulerView;