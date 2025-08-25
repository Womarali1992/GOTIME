import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { format, addDays, subDays, startOfDay, startOfWeek } from "date-fns";
import { TimeSlot, Court, Clinic } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn, getTimeSlotStatus, getTimeSlotStatusClasses } from "@/lib/utils";
import { courts, timeSlots, reservations, clinics, coaches, getTimeSlotsForDateRange, getClinicById, getTimeSlotsWithStatusForDate } from "@/lib/data";
import DayOfWeekTabs from "./DayOfWeekTabs";
import DayView from "./DayView";
import CourtCalendar from "./CourtCalendar";

interface HomeSchedulerViewProps {
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
}

const HomeSchedulerView = ({ onSelectTimeSlot }: HomeSchedulerViewProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(3);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const [showMyReservations, setShowMyReservations] = useState<boolean>(false);
  const [selectedReservation, setSelectedReservation] = useState<{
    reservation: any;
    timeSlot: TimeSlot;
    court: any;
  } | null>(null);
  
  // Legend filter states
  const [legendFilters, setLegendFilters] = useState<{
    available: boolean;
    reserved: boolean;
    clinic: boolean;
    myReservations: boolean;
  }>({
    available: true,
    reserved: true,
    clinic: true,
    myReservations: true,
  });

  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedCourt, setSelectedCourt] = useState<string | undefined>(courts[0]?.id);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Refs for click-outside functionality

  const myReservationsModalRef = useRef<HTMLDivElement>(null);
  const dayViewModalRef = useRef<HTMLDivElement>(null);
  const reservationPopupRef = useRef<HTMLDivElement>(null);

  // Mock current user - in a real app this would come from authentication context
  const currentUserEmail = "john@example.com"; // This would be the logged-in user's email

  // Toggle legend filter
  const toggleLegendFilter = (filterType: keyof typeof legendFilters) => {
    setLegendFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

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
    getTimeSlotsForDateRange(currentDate, endDate);
  }, [currentDate, viewDays]);

  // Time range to display (8am to 9pm)
  const startHour = 8;
  const endHour = 21;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Calculate days to display based on current date
  // Show viewDays starting from the current date, no past days
  const daysToShow = Array.from({ length: viewDays }, (_, i) => {
    return addDays(currentDate, i);
  }).filter(day => {
    // Filter out any days that are in the past
    const today = startOfDay(new Date());
    return day >= today;
  });

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
  const previousDay = () => {
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
  };
  
  const nextDay = () => {
    const newDate = addDays(currentDate, 1);
    setCurrentDate(newDate);
    
    // Update week offset to match the new date's week
    const newWeekOffset = calculateWeekOffset(newDate);
    if (newWeekOffset !== weekOffset) {
      setWeekOffset(newWeekOffset);
    }
  };
  
  const today = () => {
    const todayDate = startOfDay(new Date());
    setCurrentDate(todayDate);
    
    // Reset week offset to current week (0)
    setWeekOffset(0);
  };
  
  // Handle date selection from day-of-week tabs
  const handleDateSelect = (date: Date) => {
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
  };

  // Handle date header click to open DayView
  const handleDateHeaderClick = (date: Date) => {
    setSelectedDateForDayView(date);
  };

  // Check if a time slot is in the past
  const isTimeSlotInPast = (day: Date, hour: number) => {
    const now = currentTime;
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < now;
  };

  // Get availability for a specific court, day and hour - now uses centralized function
  const getSlotStatus = (court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const timeSlotsWithStatus = getTimeSlotsWithStatusForDate(formattedDate);
    
    const relevantSlots = timeSlotsWithStatus.filter(
      slot =>
        slot.courtId === court.id &&
        parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length === 0) return { available: false, reserved: false, isClinic: false };

    const slotWithStatus = relevantSlots[0];
    
    return {
      available: slotWithStatus.isAvailable,
      reserved: slotWithStatus.isReserved,
      isClinic: slotWithStatus.isClinic,
      slot: slotWithStatus,
    };
  };

  const handleTimeSlotClick = (court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const relevantSlots = timeSlots.filter(
      slot =>
        slot.courtId === court.id &&
        slot.date === formattedDate &&
        parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length > 0) {
      const slot = relevantSlots[0];
      // Check if this is a reservation
      const reservation = reservations.find(res => res.timeSlotId === slot.id);
      
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
  };

  // Helper function to get the first available time slot for a clinic block
  const getFirstAvailableSlotForBlock = (court: Court, day: Date, startHour: number, endHour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    
    for (let hour = startHour; hour < endHour; hour++) {
      const relevantSlots = timeSlots.filter(
        slot =>
          slot.courtId === court.id &&
          slot.date === formattedDate &&
          parseInt(slot.startTime.split(":")[0]) === hour
      );
      
      if (relevantSlots.length > 0 && relevantSlots[0].available) {
        return relevantSlots[0];
      }
    }
    
    return null;
  };





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
  const handleBackgroundClick = (modalType: string) => {
    if (modalType === 'myReservations') {
      setShowMyReservations(false);
    } else if (modalType === 'reservationPopup') {
      setSelectedReservation(null);
    }
  };

  return (
    <>
      <Card className="gradient-card overflow-hidden">
        <CardHeader className={cn(
          "pb-2 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5",
          isMobile ? "flex flex-row items-start justify-between space-y-0" : "flex flex-row items-center justify-between space-y-0"
        )}>
          {/* Title Section - Left Aligned */}
          <div className={cn(
            isMobile ? "text-left flex-1" : "flex flex-col space-y-1"
          )}>
            <CardTitle className={cn(
              "font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent",
              isMobile ? "text-lg leading-tight" : "text-2xl md:text-3xl"
            )}>
              Court Scheduler
            </CardTitle>
          </div>
          
          {/* Date Display - Center Aligned */}
          <div className={cn(
            isMobile ? "text-center flex-1 mx-2" : "text-center flex-1"
          )}>
            {isMobile ? (
              <div className="text-lg font-medium bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent leading-tight">
                <div className="flex flex-col space-y-0.5">
                  <div>{format(currentDate, "EEEE,")}</div>
                  <div>{format(currentDate, "MMMM d,")}</div>
                  <div>{format(currentDate, "yyyy")}</div>
                </div>
              </div>
            ) : (
              <div className="text-lg sm:text-xl font-medium bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {format(currentDate, "EEEE, MMMM d, yyyy")}
              </div>
            )}
          </div>
          
          {/* View Toggle Navigation - Right Aligned */}
          <div className={cn(
            "bg-muted/50 rounded-lg",
            isMobile ? "flex flex-row space-x-0.5 p-0.5" : "flex items-center space-x-1 p-1"
          )}>
            <Button
              variant={viewDays === 1 ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewDays(1)}
              className={cn(
                "text-xs",
                isMobile ? "h-6 px-1 py-0" : "h-8 px-3 sm:px-4 sm:text-sm"
              )}
            >
              Day
            </Button>
            <Button
              variant={viewDays === 3 ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewDays(3)}
              className={cn(
                "text-xs",
                isMobile ? "h-6 px-1 py-0" : "h-8 px-3 sm:px-4 sm:text-sm"
              )}
            >
              Week
            </Button>
            <Button
              variant={viewDays === 0 ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewDays(0)}
              className={cn(
                "text-xs",
                isMobile ? "h-6 px-1 py-0" : "h-8 px-3 sm:px-4 sm:text-sm"
              )}
            >
              Calendar
            </Button>
          </div>
        </CardHeader>
        

        
        <CardContent className="px-1 md:px-4 pb-2">

          
          {/* Day-of-week tabs */}
          <DayOfWeekTabs 
            centeredDate={currentDate} 
            onDateSelect={handleDateSelect}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
          />
          

          
                    {/* Show schedule view or calendar view based on viewDays */}
          {viewDays === 0 ? (
            // Calendar View
            <CourtCalendar onSelectTimeSlot={onSelectTimeSlot} selectedDate={currentDate} />
          ) : viewDays === 1 ? (
            // Day View - show all courts horizontally for single day
            <DayView
              selectedDate={currentDate}
              onClose={() => {}} // No close needed for inline view
              courts={courts}
              timeSlots={timeSlots}
              reservations={reservations}
              clinics={clinics}
              coaches={coaches}
              isOpen={true}
              isModal={false}
              onSelectTimeSlot={onSelectTimeSlot}
              onDateChange={setCurrentDate}
            />
          ) : (
            // Schedule View (Week view)
            <div className={cn(isMobile ? "overflow-x-hidden w-full max-w-full" : "overflow-x-auto")}>
              <div className={cn("relative", isMobile ? "w-full max-w-full" : "min-w-max")}>
                {/* Court rows with date headers over each column */}
                {courts.filter(court => court.id === selectedCourt).map((court) => (
                  <div key={court.id} className={cn("mb-8", isMobile && "w-full max-w-full overflow-hidden")}>
                    {/* Court name header above the columns */}
                    <div className={cn("bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b border-border/20 rounded-t-lg mb-4", isMobile ? "p-2" : "p-4 sm:p-6")}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 flex justify-start">
                          <h3 className="text-xl sm:text-2xl font-bold text-foreground text-center sm:text-left">{court.name}</h3>
                        </div>
                        
                        {/* Court Navigation Tabs - Mobile Optimized */}
                        <div className="flex-1 flex justify-center">
                          <div className={cn("w-full max-w-2xl", isMobile ? "overflow-x-hidden" : "overflow-x-auto scrollbar-hide")}>
                            <div className={cn("flex gap-2 sm:gap-4 justify-center", isMobile ? "px-2" : "min-w-max px-4")}>
                              {courts.map(courtOption => (
                                <Button
                                  key={courtOption.id}
                                  variant={selectedCourt === courtOption.id ? "default" : "outline"}
                                  onClick={() => setSelectedCourt(courtOption.id)}
                                  className={`h-12 px-4 sm:px-6 py-3 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-lg whitespace-nowrap ${
                                    selectedCourt === courtOption.id 
                                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                                      : 'hover:bg-primary/10 hover:border-primary/30'
                                  }`}
                                >
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="hidden sm:inline">{courtOption.name}</span>
                                  <span className="sm:hidden">{courtOption.name.split(' ')[0]}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Day navigation controls for each court */}
                        <div className="flex-1 flex justify-end">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={previousDay}
                              disabled={subDays(currentDate, 1) < startOfDay(new Date())}
                              className="h-10 px-3"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={today} className="h-10 px-4 text-sm">
                              Today
                            </Button>
                            <Button variant="outline" size="sm" onClick={nextDay} className="h-10 px-3">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Legend - Mobile Optimized */}
                      <div className="mt-4 px-2 sm:px-6">
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm sm:text-base">
                          <button
                            onClick={() => toggleLegendFilter('available')}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-md transition-all duration-200 hover:bg-muted/50 min-h-[48px] justify-center",
                              legendFilters.available ? "opacity-100" : "opacity-40 hover:opacity-60"
                            )}
                            title="Click to toggle Available slots visibility"
                          >
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-green-500/20 border border-green-500/30"></div>
                            <span className="text-muted-foreground font-medium text-sm sm:text-base">Available</span>
                          </button>
                          <button
                            onClick={() => toggleLegendFilter('reserved')}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-md transition-all duration-200 hover:bg-muted/50 min-h-[48px] justify-center",
                              legendFilters.reserved ? "opacity-100" : "opacity-40 hover:opacity-60"
                            )}
                            title="Click to toggle Reserved slots visibility"
                          >
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-secondary/20 border border-secondary/30"></div>
                            <span className="text-muted-foreground font-medium text-sm sm:text-base">Reserved</span>
                          </button>
                          <button
                            onClick={() => toggleLegendFilter('clinic')}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-md transition-all duration-200 hover:bg-muted/50 min-h-[48px] justify-center",
                              legendFilters.clinic ? "opacity-100" : "opacity-40 hover:opacity-60"
                            )}
                            title="Click to toggle Clinic slots visibility"
                          >
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
                            <span className="text-muted-foreground font-medium text-sm sm:text-base">Clinic</span>
                          </button>
                          <button
                            onClick={() => toggleLegendFilter('myReservations')}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-md transition-all duration-200 hover:bg-muted/50 min-h-[48px] justify-center",
                              legendFilters.myReservations ? "opacity-100" : "opacity-40 hover:opacity-60"
                            )}
                            title="Click to toggle My Reservations visibility"
                          >
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-purple-500/20 border border-purple-500/30"></div>
                            <span className="text-muted-foreground font-medium text-sm sm:text-base">My Reservations</span>
                          </button>
                        </div>
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
                      {daysToShow.map((day) => (
                        <div key={`${court.id}-${day.toString()}`} className={cn("border border-border/30 rounded-lg overflow-hidden", isMobile && "min-w-0")}>
                          {/* Date header */}
                          <div
                            className="text-center font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors duration-200 p-3 mb-3 bg-muted/20 text-base sm:text-lg"
                            onClick={() => handleDateHeaderClick(day)}
                            title="Click to view full day schedule"
                          >
                            {format(day, isMobile ? "MMM d" : "EEEE, MMM d")}
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
                                const { available, reserved, isClinic, slot } = getSlotStatus(court, day, hour);
                                const clinic = slot?.clinicId ? getClinicById(slot.clinicId) : null;
                                
                                // Check if this is the current user's reservation
                                const reservation = slot ? reservations.find(res => res.timeSlotId === slot.id) : null;
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
                                      blocked: false, // Blocked status is not directly available from getSlotStatus
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
                                    blocked: false, // Blocked status is not directly available from getSlotStatus
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
                                  if (block.reserved && !block.isMyReservation && !legendFilters.reserved) return false;
                                  if (block.isMyReservation && !legendFilters.myReservations) return false;
                                  return true;
                                })
                                .map((block, blockIndex) => {
                                const isPast = isTimeSlotInPast(day, block.startHour);
                                const duration = block.endHour - block.startHour;
                                const isMultiHour = duration > 1;
                                
                                return (
                                  <div
                                    key={`${court.id}-${day.toString()}-${block.startHour}-${block.endHour}`}
                                    className={cn(
                                      "text-sm sm:text-base text-center rounded cursor-pointer transition-all duration-200 hover:scale-105 relative",
                                      isMobile ? "p-2" : "p-3",
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
                                      height: isMultiHour ? `${duration * (isMobile ? 3 : 3.5)}rem` : undefined,
                                      minHeight: isMultiHour ? undefined : isMobile ? "3rem" : "3.5rem",
                                      marginBottom: isMultiHour ? "0.5rem" : undefined
                                    }}
                                    onClick={() => {
                                      if (block.isClinic && isMultiHour) {
                                        const slot = getFirstAvailableSlotForBlock(court, day, block.startHour, block.endHour);
                                        if (slot) {
                                          onSelectTimeSlot(slot);
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
                                      <div className="flex flex-col items-center">
                                        <span className="font-medium text-base">{block.startHour}:00</span>
                                        <span className="text-sm opacity-75">to</span>
                                        <span className="font-medium text-base">{block.endHour}:00</span>
                                        {block.isClinic && (
                                          <span className="text-sm mt-2 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30 text-yellow-800 font-medium">
                                            Clinic
                                          </span>
                                        )}
                                        {block.isMyReservation && (
                                          <span className="text-sm mt-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 text-purple-800 font-medium">
                                            My Reservation
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-base font-medium">{block.startHour}:00</span>
                                    )}
                                    
                                    {block.isClinic && block.clinic && (
                                      <div className="absolute -top-1 -right-1">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full border border-white"></div>
                                      </div>
                                    )}
                                    {block.isMyReservation && (
                                      <div className="absolute -top-1 -left-1">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full border border-white"></div>
                                      </div>
                                    )}
                                  </div>
                                );
                              });
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
          courts={courts}
          timeSlots={timeSlots}
          reservations={reservations}
          clinics={clinics}
          coaches={coaches}
          isOpen={selectedDateForDayView !== null}
        />
      )}



       {/* My Reservations Modal */}
       {showMyReservations && (
         <div 
           className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
           onClick={() => handleBackgroundClick('myReservations')}
         >
           <div 
             ref={myReservationsModalRef} 
             className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold text-foreground">My Reservations</h2>
                 <button
                   onClick={() => setShowMyReservations(false)}
                   className="text-gray-500 hover:text-gray-700 text-2xl"
                 >
                   ×
                 </button>
               </div>
               
               <div className="space-y-4">
                 {reservations
                   .filter(res => res.playerEmail === currentUserEmail)
                   .map(reservation => {
                     const timeSlot = timeSlots.find(slot => slot.id === reservation.timeSlotId);
                     const court = courts.find(c => c.id === reservation.courtId);
                     const date = timeSlot ? new Date(timeSlot.date) : new Date();
                     
                     return (
                       <div key={reservation.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                         <div className="flex items-center justify-between">
                           <div>
                             <h3 className="font-semibold text-purple-800">
                               {court?.name} - {format(date, "EEEE, MMMM d, yyyy")}
                             </h3>
                             <p className="text-purple-600">
                               {timeSlot?.startTime} - {timeSlot?.endTime}
                             </p>
                             <p className="text-sm text-purple-500">
                               {reservation.players} player{reservation.players !== 1 ? 's' : ''}
                             </p>
                           </div>
                           <div className="w-4 h-4 bg-purple-500/20 border border-purple-500/30 rounded"></div>
                         </div>
                       </div>
                     );
                   })}
                 
                 {reservations.filter(res => res.playerEmail === currentUserEmail).length === 0 && (
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
           className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
           onClick={() => handleBackgroundClick('reservationPopup')}
         >
           <div 
             ref={reservationPopupRef} 
             className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold text-foreground">Reservation Details</h2>
                 <button
                   onClick={() => setSelectedReservation(null)}
                   className="text-gray-500 hover:text-gray-700 text-2xl"
                 >
                   ×
                 </button>
               </div>
               
               <div className="space-y-4">
                 <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                   <div className="space-y-3">
                     <div>
                       <h3 className="font-semibold text-blue-800 text-lg">
                         {selectedReservation.court?.name}
                       </h3>
                       <p className="text-blue-600">
                         {format(new Date(selectedReservation.timeSlot.date), "EEEE, MMMM d, yyyy")}
                       </p>
                     </div>
                     
                     <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                         <Clock className="h-4 w-4 text-blue-600" />
                         <span className="text-blue-700 font-medium">
                           {selectedReservation.timeSlot.startTime} - {selectedReservation.timeSlot.endTime}
                         </span>
                       </div>
                       <div className="flex items-center gap-2">
                         <MapPin className="h-4 w-4 text-blue-600" />
                         <span className="text-blue-700">
                           {selectedReservation.court?.location}
                         </span>
                       </div>
                     </div>
                     
                     <div className="border-t border-blue-200 pt-3">
                       <div className="grid grid-cols-2 gap-4 text-sm">
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
                           {selectedReservation.reservation.comments.map((comment: any, index: number) => (
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