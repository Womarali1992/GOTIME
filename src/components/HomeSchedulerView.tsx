import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
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
  const [showLegendModal, setShowLegendModal] = useState<boolean>(false);
  const [legendModalType, setLegendModalType] = useState<string>("");
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Refs for click-outside functionality
  const legendModalRef = useRef<HTMLDivElement>(null);
  const myReservationsModalRef = useRef<HTMLDivElement>(null);
  const dayViewModalRef = useRef<HTMLDivElement>(null);

  // Mock current user - in a real app this would come from authentication context
  const currentUserEmail = "john@example.com"; // This would be the logged-in user's email

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

    if (relevantSlots.length > 0 && relevantSlots[0].available) {
      onSelectTimeSlot(relevantSlots[0]);
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

  // Helper function to get all items of a specific type for the current day
  const getItemsByType = (type: string) => {
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    const items: Array<{
      court: Court;
      timeSlot: TimeSlot;
      clinic?: Clinic;
      coach?: any;
      reservation?: any;
      startHour: number;
      endHour: number;
    }> = [];

    courts.forEach(court => {
      hours.forEach(hour => {
        const relevantSlots = timeSlots.filter(
          slot =>
            slot.courtId === court.id &&
            slot.date === formattedDate &&
            parseInt(slot.startTime.split(":")[0]) === hour
        );

        if (relevantSlots.length > 0) {
          const slot = relevantSlots[0];
          const status = getTimeSlotStatus(slot);
          const clinic = slot.clinicId ? getClinicById(slot.clinicId) : null;
          const coach = clinic ? coaches.find(c => c.id === clinic.coachId) : null;
          const reservation = reservations.find(res => res.timeSlotId === slot.id);

          let shouldInclude = false;
          switch (type) {
            case 'available':
              shouldInclude = status.available && !status.reserved && !status.blocked && !status.isClinic;
              break;
            case 'clinic':
              shouldInclude = status.isClinic;
              break;
            case 'reserved':
              shouldInclude = status.reserved && !status.isClinic;
              break;
            case 'blocked':
              shouldInclude = status.blocked;
              break;
            case 'myReservations':
              shouldInclude = reservation?.playerEmail === currentUserEmail;
              break;
          }

          if (shouldInclude) {
            items.push({
              court,
              timeSlot: slot,
              clinic,
              coach,
              reservation,
              startHour: hour,
              endHour: hour + 1
            });
          }
        }
      });
    });

    return items;
  };

  // Handle legend item click
  const handleLegendItemClick = (type: string) => {
    setLegendModalType(type);
    setShowLegendModal(true);
  };

  // Click outside handlers and keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (legendModalRef.current && !legendModalRef.current.contains(event.target as Node)) {
        setShowLegendModal(false);
      }
      if (myReservationsModalRef.current && !myReservationsModalRef.current.contains(event.target as Node)) {
        setShowMyReservations(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowLegendModal(false);
        setShowMyReservations(false);
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
    if (modalType === 'legend') {
      setShowLegendModal(false);
    } else if (modalType === 'myReservations') {
      setShowMyReservations(false);
    }
  };

  return (
    <>
      <Card className="gradient-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Court Scheduler
            </CardTitle>
          </div>
          
          {/* View Toggle Navigation moved to header */}
          <div className="flex items-center space-x-1 p-1 bg-muted/50 rounded-lg">
            <Button
              variant={viewDays === 1 ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewDays(1)}
              className="h-8 px-3 sm:px-4 text-xs sm:text-sm"
            >
              Day
            </Button>
            <Button
              variant={viewDays === 3 ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewDays(3)}
              className="h-8 px-3 sm:px-4 text-xs sm:text-sm"
            >
              Week
            </Button>
            <Button
              variant={viewDays === 0 ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewDays(0)}
              className="h-8 px-3 sm:px-4 text-xs sm:text-sm"
            >
              Calendar
            </Button>
          </div>
        </CardHeader>
        

        
        <CardContent className="px-1 md:px-4 pb-2">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 text-xs text-muted-foreground justify-center">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-green-100/50 hover:shadow-sm px-2 py-1 rounded transition-all duration-200"
              onClick={() => handleLegendItemClick('available')}
              title="Click to view all available time slots"
            >
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500/20 border border-green-500/30 rounded"></div>
              <span className="text-xs sm:text-xs">Available</span>
            </div>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-yellow-100/50 hover:shadow-sm px-2 py-1 rounded transition-all duration-200"
              onClick={() => handleLegendItemClick('clinic')}
              title="Click to view all clinic sessions"
            >
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500/30 border-2 border-yellow-500/50 rounded"></div>
              <span className="text-xs sm:text-xs">Clinic</span>
            </div>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-secondary/20 hover:shadow-sm px-2 py-1 rounded transition-all duration-200"
              onClick={() => handleLegendItemClick('reserved')}
              title="Click to view all reserved time slots"
            >
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-secondary/20 border border-secondary/30 rounded"></div>
              <span className="text-xs sm:text-xs">Reserved</span>
            </div>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100/50 hover:shadow-sm px-2 py-1 rounded transition-all duration-200"
              onClick={() => handleLegendItemClick('blocked')}
              title="Click to view all blocked time slots"
            >
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-500/30 border border-gray-500/30 rounded"></div>
              <span className="text-xs sm:text-xs">Blocked</span>
            </div>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-purple-100/50 hover:shadow-sm px-2 py-1 rounded transition-all duration-200"
              onClick={() => handleLegendItemClick('myReservations')}
              title="Click to view all my reservations"
            >
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500/20 border border-purple-500/30 rounded"></div>
              <span className="text-xs sm:text-xs">My Reservations</span>
            </div>
          </div>
          
          {/* Day-of-week tabs */}
          <DayOfWeekTabs 
            centeredDate={currentDate} 
            onDateSelect={handleDateSelect}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
          />
          
          {/* Week View Header with Gradient Background - Only show for week view */}
          {viewDays !== 0 && (
            <div className="mb-6 sm:mb-8 text-center px-2">
              <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-xl border-0 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-2">
                      {format(currentDate, "EEEE, MMMM d, yyyy")}
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">Available courts and time slots</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-clock h-4 w-4">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>All times shown in local timezone</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
            />
          ) : (
            // Schedule View (Week view)
            <div className="overflow-x-auto">
              <div className="min-w-max relative">
                {/* Court rows with date headers over each column */}
                {courts.map((court) => (
                  <div key={court.id} className="mb-8">
                    {/* Court name header above the columns */}
                    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-4 sm:p-6 border-b border-border/20 rounded-t-lg mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground">{court.name}</h3>
                        
                        {/* Day navigation controls for each court */}
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={previousDay}
                            disabled={subDays(currentDate, 1) < startOfDay(new Date())}
                            className="h-8 px-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={today} className="h-8 px-3 text-xs">
                            Today
                          </Button>
                          <Button variant="outline" size="sm" onClick={nextDay} className="h-8 px-2">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Time slots grid */}
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${viewDays}, 1fr)`,
                      }}
                    >
                      {/* Date headers over each column */}
                      {daysToShow.map((day) => (
                        <div key={`${court.id}-${day.toString()}`} className="border border-border/30 rounded-lg overflow-hidden">
                          {/* Date header */}
                          <div
                            className="text-center font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors duration-200 p-2 mb-2 bg-muted/20"
                            onClick={() => handleDateHeaderClick(day)}
                            title="Click to view full day schedule"
                          >
                            {format(day, isMobile ? "MMM d" : "EEEE, MMM d")}
                          </div>
                          
                          {/* Time slots */}
                          <div className="space-y-1 p-2">
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
                                      isMyReservation: false // My reservation status is not directly available from getSlotStatus
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
                                    isMyReservation: false // My reservation status is not directly available from getSlotStatus
                                  });
                                }
                              }
                              
                              // Add the last block if it exists
                              if (currentBlock) {
                                timeSlotBlocks.push(currentBlock);
                              }
                              
                              return timeSlotBlocks.map((block, blockIndex) => {
                                const isPast = isTimeSlotInPast(day, block.startHour);
                                const duration = block.endHour - block.startHour;
                                const isMultiHour = duration > 1;
                                
                                return (
                                  <div
                                    key={`${court.id}-${day.toString()}-${block.startHour}-${block.endHour}`}
                                    className={cn(
                                      "text-xs text-center rounded cursor-pointer transition-all duration-200 hover:scale-105 relative p-2",
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
                                      height: isMultiHour ? `${duration * 2.5}rem` : undefined,
                                      minHeight: isMultiHour ? undefined : "2.5rem",
                                      marginBottom: isMultiHour ? "0.25rem" : undefined
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
                                        <span className="font-medium">{block.startHour}:00</span>
                                        <span className="text-xs opacity-75">to</span>
                                        <span className="font-medium">{block.endHour}:00</span>
                                        {block.isClinic && (
                                          <span className="text-xs mt-1 px-2 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30 text-yellow-800 font-medium">
                                            Clinic
                                          </span>
                                        )}
                                        {block.isMyReservation && (
                                          <span className="text-xs mt-1 px-2 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 text-purple-800 font-medium">
                                            My Reservation
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span>{block.startHour}:00</span>
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

             {/* Legend Modal */}
       {showLegendModal && (
         <div 
           className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
           onClick={() => handleBackgroundClick('legend')}
         >
           <div 
             ref={legendModalRef} 
             className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold text-foreground">
                   {legendModalType === 'available' && 'Available Time Slots'}
                   {legendModalType === 'clinic' && 'Clinic Sessions'}
                   {legendModalType === 'reserved' && 'Reserved Time Slots'}
                   {legendModalType === 'blocked' && 'Blocked Time Slots'}
                   {legendModalType === 'myReservations' && 'My Reservations'}
                 </h2>
                 <button
                   onClick={() => setShowLegendModal(false)}
                   className="text-gray-500 hover:text-gray-700 text-2xl"
                 >
                   ×
                 </button>
               </div>
               
               <div className="space-y-4">
                 {getItemsByType(legendModalType).map((item, index) => (
                   <div 
                     key={`${item.court.id}-${item.timeSlot.id}-${index}`} 
                     className={cn(
                       "border rounded-lg p-4 transition-colors",
                       legendModalType === 'available' && "border-green-200 bg-green-50",
                       legendModalType === 'clinic' && "border-yellow-200 bg-yellow-50",
                       legendModalType === 'reserved' && "border-secondary-200 bg-secondary-50",
                       legendModalType === 'blocked' && "border-gray-200 bg-gray-50",
                       legendModalType === 'myReservations' && "border-purple-200 bg-purple-50"
                     )}
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex-1">
                         <h3 className="font-semibold text-foreground">
                           {item.court.name} - {format(currentDate, "EEEE, MMMM d, yyyy")}
                         </h3>
                         <p className="text-muted-foreground">
                           {item.startHour}:00 - {item.endHour}:00
                         </p>
                         
                         {item.clinic && (
                           <div className="mt-2">
                             <p className="font-medium text-yellow-800">{item.clinic.name}</p>
                             <p className="text-sm text-yellow-600">{item.clinic.description}</p>
                             <p className="text-sm text-yellow-600">Coach: {item.coach?.name}</p>
                             <p className="text-sm text-yellow-600">Price: ${item.clinic.price}</p>
                           </div>
                         )}
                         
                         {item.reservation && (
                           <div className="mt-2">
                             <p className="font-medium text-secondary-800">Player: {item.reservation.playerName}</p>
                             <p className="text-sm text-secondary-600">
                               {item.reservation.players} player{item.reservation.players !== 1 ? 's' : ''}
                             </p>
                           </div>
                         )}
                       </div>
                       
                       <div className={cn(
                         "w-4 h-4 rounded border",
                         legendModalType === 'available' && "bg-green-500/20 border-green-500/30",
                         legendModalType === 'clinic' && "bg-yellow-500/30 border-yellow-500/50",
                         legendModalType === 'reserved' && "bg-secondary/20 border-secondary/30",
                         legendModalType === 'blocked' && "bg-gray-500/30 border-gray-500/30",
                         legendModalType === 'myReservations' && "bg-purple-500/20 border-purple-500/30"
                       )}></div>
                     </div>
                   </div>
                 ))}
                 
                 {getItemsByType(legendModalType).length === 0 && (
                   <div className="text-center py-8 text-gray-500">
                     <p>
                       {legendModalType === 'available' && 'No available time slots for this day.'}
                       {legendModalType === 'clinic' && 'No clinic sessions scheduled for this day.'}
                       {legendModalType === 'reserved' && 'No reserved time slots for this day.'}
                       {legendModalType === 'blocked' && 'No blocked time slots for this day.'}
                       {legendModalType === 'myReservations' && 'You don\'t have any reservations for this day.'}
                     </p>
                   </div>
                 )}
               </div>
             </div>
           </div>
         </div>
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
    </>
  );
};

export default HomeSchedulerView;