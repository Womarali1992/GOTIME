import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfDay, startOfWeek } from "date-fns";
import { TimeSlot, Court, Clinic, Reservation } from "@/lib/types";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useDataService } from "@/hooks/use-data-service";
import { useBookings } from "@/hooks/use-bookings";
import { apiDataService } from "@/lib/services/api-data-service";
import DayView from "./DayView";
import CourtCalendar from "./CourtCalendar";
import CourtHeader from "./CourtHeader";
import EditReservationDialog from "./EditReservationDialog";
import TimeSlotBlock from "./TimeSlotBlock";
import type { TimeSlotBlockData } from "./TimeSlotBlock";
import ReservationDetailsPopup from "./ReservationDetailsPopup";
import type { ReservationWithDetails } from "./ReservationDetailsPopup";
import MyReservationsModal from "./MyReservationsModal";
import JoinOpenPlayDialog from "./JoinOpenPlayDialog";

interface HomeSchedulerViewProps {
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
  selectedCoachId?: string;
}

const HomeSchedulerView = ({ onSelectTimeSlot, selectedCoachId }: HomeSchedulerViewProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const [showMyReservations, setShowMyReservations] = useState<boolean>(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [joinOpenPlayData, setJoinOpenPlayData] = useState<ReservationWithDetails | null>(null);
  
  // Legend filter states
  const [legendFilters, setLegendFilters] = useState<{
    available: boolean;
    clinic: boolean;
    myReservations: boolean;
    openPlay: boolean;
  }>({
    available: true,
    clinic: true,
    myReservations: true,
    openPlay: true,
  });

  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedCourt, setSelectedCourt] = useState<string | undefined>(undefined);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const lastAutoAdvanceRef = useRef<Date | null>(null);
  
  // Refs for click-outside functionality

  const myReservationsModalRef = useRef<HTMLDivElement>(null);
  const dayViewModalRef = useRef<HTMLDivElement>(null);
  const reservationPopupRef = useRef<HTMLDivElement>(null);

  // Get current user from context
  const { currentUser } = useUser();
  const currentUserEmail = currentUser?.email || "";

  // Get data service
  const { courts, reservations, clinics, coaches, refreshKey } = useDataService();

  // Get booking operations from centralized hook
  const { updateReservation, deleteReservation } = useBookings();
  
  // Load time slots dynamically for the dates being displayed
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const activeFilterLabel = useMemo(() => {
    if (legendFilters.available && legendFilters.clinic && legendFilters.myReservations && legendFilters.openPlay) return "All";
    if (legendFilters.available) return "Available";
    if (legendFilters.clinic) return "Clinic";
    if (legendFilters.myReservations) return "My Reservations";
    if (legendFilters.openPlay) return "Open Play";
    return "All";
  }, [legendFilters]);

  const isAllOn = useMemo(() => (
    legendFilters.available && legendFilters.clinic && legendFilters.myReservations && legendFilters.openPlay
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
        return { available: true, clinic: true, myReservations: true, openPlay: true };
      }

      // Otherwise switch to exclusive mode for the selected filter
      return {
        available: filterType === 'available',
        clinic: filterType === 'clinic',
        myReservations: filterType === 'myReservations',
        openPlay: filterType === 'openPlay',
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
    const now = currentTime;
    
    if (viewDays === 3) {
      // For 3-day view: center the selected date unless it's today
      const isSelectedDateToday = currentDate.getTime() === today.getTime();
      
      if (isSelectedDateToday) {
        // If selected date is today, show today as first column
        return Array.from({ length: viewDays }, (_, i) => {
          return addDays(currentDate, i);
        }).filter(day => day >= today);
      } else {
        // If selected date is not today, try to center it (show: previous day, selected day, next day)
        const centerDays = [
          subDays(currentDate, 1),
          currentDate,
          addDays(currentDate, 1)
        ].filter(day => day >= today);
        
        // If filtering removes the first day (because it's in the past), 
        // show selected date as first column (selected date + next 2 days)
        if (centerDays.length < 3) {
          return Array.from({ length: viewDays }, (_, i) => {
            return addDays(currentDate, i);
          }).filter(day => day >= today);
        }
        
        // Check if the first day in the centered view has any future slots
        // If all slots are past, show currentDate as first column instead
        const firstDay = centerDays[0];
        const firstDayEndTime = new Date(firstDay);
        firstDayEndTime.setHours(21, 0, 0, 0); // 9pm
        
        // If the first day's last slot (9pm) is in the past, show currentDate as first
        if (firstDayEndTime < now) {
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
  }, [currentDate, viewDays, currentTime]);

  // Load time slots dynamically for the dates being displayed
  // Reload when daysToShow changes OR when data is refreshed (refreshKey changes)
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (daysToShow.length === 0) return;
      
      const slotsToLoad = daysToShow.map(day => format(day, "yyyy-MM-dd"));
      try {
        const allSlots = await Promise.all(
          slotsToLoad.map(date => apiDataService.getTimeSlotsForDate(date))
        );
        setTimeSlots(allSlots.flat());
      } catch (error) {
        console.error('Failed to load time slots:', error);
      }
    };
    loadTimeSlots();
  }, [daysToShow, refreshKey]);

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

  // Auto-advance to next day if all time slots have passed (for 3-day view)
  useEffect(() => {
    if (viewDays === 3 && daysToShow.length > 0) {
      const now = currentTime;
      const today = startOfDay(new Date());
      
      // Only check the first (earliest) day shown - if it's all past, advance
      const firstDay = daysToShow[0];
      const firstDayKey = format(firstDay, "yyyy-MM-dd");
      
      // Prevent multiple rapid advances for the same day
      if (lastAutoAdvanceRef.current && format(lastAutoAdvanceRef.current, "yyyy-MM-dd") === firstDayKey) {
        return;
      }
      
      // Calculate which courts to check
      const displayCourts = selectedCourt ? courts.filter(court => court.id === selectedCourt) : courts;
      
      if (displayCourts.length === 0) return;
      
      // Check if all time slots (8am-9pm) for all courts on the first day are in the past
      const firstDayAllPast = displayCourts.every(court => {
        return hours.every(hour => {
          const slotDateTime = new Date(firstDay);
          slotDateTime.setHours(hour, 0, 0, 0);
          return slotDateTime < now;
        });
      });

      if (firstDayAllPast) {
        // Find the first day with at least one future slot
        const maxDate = addDays(today, 30 - 1);
        let targetDate = addDays(firstDay, 1);
        
        // Search for the first day with at least one future slot
        while (targetDate <= maxDate) {
          const dayHasFutureSlot = displayCourts.some(court => {
            return hours.some(hour => {
              const slotDateTime = new Date(targetDate);
              slotDateTime.setHours(hour, 0, 0, 0);
              return slotDateTime >= now;
            });
          });
          
          if (dayHasFutureSlot) {
            // Found a day with future slots - set currentDate to this day
            // The 3-day view centering logic will handle showing it properly
            lastAutoAdvanceRef.current = firstDay;
            setCurrentDate(targetDate);
            
            // Update week offset
            const newWeekOffset = calculateWeekOffset(targetDate);
            if (newWeekOffset !== weekOffset) {
              setWeekOffset(newWeekOffset);
            }
            break;
          }
          
          targetDate = addDays(targetDate, 1);
        }
      }
    }
  }, [currentDate, viewDays, daysToShow, currentTime, courts, selectedCourt, hours, weekOffset]);

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
    setCurrentDate(date);
    setViewDays(1);
  }, []);

  // Check if a time slot is in the past
  const isTimeSlotInPast = useCallback((day: Date, hour: number) => {
    const now = currentTime;
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < now;
  }, [currentTime]);

  // Get availability for a specific court, day and hour
  const getSlotStatus = useCallback((court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");

    // Find time slots for this court, date, and hour
    const relevantSlots = timeSlots.filter(
      slot => slot.courtId === court.id &&
              slot.date === formattedDate &&
              parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length === 0) {
      return { available: false, reserved: false, blocked: false, isClinic: false, slot: null, clinic: null, reservation: null };
    }

    const slot = relevantSlots[0];
    const reservation = (slot as any).reservation || reservations.find(res => res.timeSlotId === slot.id);
    // Use enriched clinic data from slot (includes participants) or fall back to lookup
    const clinic = (slot as any).clinic || (slot.clinicId ? clinics.find(c => c.id === slot.clinicId) : null);
    
    // Check if this time slot is in the past
    const slotDateTime = new Date(day);
    const [slotHours, slotMinutes] = slot.startTime.split(':').map(Number);
    slotDateTime.setHours(slotHours, slotMinutes || 0, 0, 0);
    const isSlotInPast = slotDateTime < currentTime;
    
    const status = {
      available: slot.available && !isSlotInPast, // Mark as unavailable if in the past
      reserved: !!reservation,
      blocked: slot.blocked || false,
      isClinic: !!clinic,
      slot,
      clinic,
      reservation,
      coachUnavailable: false,
      isOpenPlay: reservation?.isOpenPlay || false,
      openPlaySlots: reservation?.openPlaySlots,
      currentPlayers: reservation?.players || 0,
      maxOpenPlayers: reservation?.maxOpenPlayers,
      openPlayGroupId: reservation?.openPlayGroupId,
    };

    // If coach is selected, filter based on coach availability
    if (selectedCoachId && slot) {
      const coach = coaches.find(c => c.id === selectedCoachId);
      if (!coach) return { ...status, available: false, coachUnavailable: true };

      // Check if slot is available for booking (not already booked, blocked, or a clinic)
      if (!status.available || status.blocked || status.reserved || status.isClinic) {
        return { ...status, available: false };
      }

      // Check coach's weekly availability
      const dayOfWeek = format(day, 'EEEE').toLowerCase();
      const availability = coach.availability?.find(a => a.dayOfWeek === dayOfWeek);

      if (!availability || !availability.isAvailable) {
        return { ...status, available: false, coachUnavailable: true };
      }

      // Check if slot time falls within coach's availability window
      if (slot.startTime < availability.startTime || slot.endTime > availability.endTime) {
        return { ...status, available: false, coachUnavailable: true };
      }
    }

    return status;
  }, [selectedCoachId, timeSlots, reservations, clinics, coaches, currentTime]);

  const handleTimeSlotClick = useCallback((court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const courtTimeSlots = timeSlots.filter(
      slot => slot.courtId === court.id && slot.date === formattedDate
    );

    const relevantSlots = courtTimeSlots.filter(
      slot => parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length > 0) {
      const slot = relevantSlots[0];
      // Check if this is a reservation
      const reservation = reservations.find(res => res.timeSlotId === slot.id);

      if (reservation) {
        // Check if this is an open play reservation the user can join
        const isOwner = reservation.playerEmail === currentUserEmail ||
          (currentUser?.id && (reservation as any).createdById === currentUser.id);
        const alreadyJoined = reservation.participants?.some(p => p.email === currentUserEmail);
        const maxPlayers = (reservation as any).maxOpenPlayers || 8;
        const gid = (reservation as any).openPlayGroupId;
        const groupTotal = gid
          ? reservations.filter(r => (r as any).openPlayGroupId === gid).reduce((s, r) => s + (r.players || 1), 0)
          : reservation.players || 1;
        const hasRoom = groupTotal < maxPlayers;

        if (reservation.isOpenPlay && !isOwner && !alreadyJoined && hasRoom) {
          // Open join dialog
          setJoinOpenPlayData({ reservation, timeSlot: slot, court });
        } else {
          // Show reservation popup
          setSelectedReservation({
            reservation,
            timeSlot: slot,
            court
          });
        }
      } else if (slot.available || currentUser?.membershipType === 'admin') {
        // Handle available slot booking, or allow admins to book even unavailable/blocked slots
        onSelectTimeSlot(slot);
      }
    }
  }, [onSelectTimeSlot, timeSlots, reservations, currentUser]);

  // Helper function to get the first available time slot for a clinic block
  const getFirstAvailableSlotForBlock = useCallback((court: Court, day: Date, startHour: number, endHour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const courtTimeSlots = timeSlots.filter(
      slot => slot.courtId === court.id && slot.date === formattedDate
    );

    for (let hour = startHour; hour < endHour; hour++) {
      const relevantSlots = courtTimeSlots.filter(
        slot => parseInt(slot.startTime.split(":")[0]) === hour
      );

      if (relevantSlots.length > 0 && relevantSlots[0].available) {
        return relevantSlots[0];
      }
    }

    return null;
  }, [timeSlots]);





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

  // Handle edit reservation
  const handleEditReservation = useCallback(() => {
    if (selectedReservation) {
      setEditingReservation(selectedReservation.reservation);
      setSelectedReservation(null); // Close the details popup
    }
  }, [selectedReservation]);

  // Handle save reservation - uses centralized hook, auto-refreshes state
  const handleSaveReservation = useCallback(async (reservationId: string, updates: Partial<Reservation>) => {
    try {
      await updateReservation(reservationId, updates);
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }, [updateReservation]);

  // Handle delete reservation - uses centralized hook, auto-refreshes state
  const handleDeleteReservation = useCallback(async (reservationId: string) => {
    try {
      await deleteReservation(reservationId);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  }, [deleteReservation]);

  return (
    <>
      {/* CourtHeader now contains the top bar with view toggles and court/date info */}
      <CourtHeader
        courtId={selectedCourt || "all"}
        courtName={selectedCourt ? (courts.find(court => court.id === selectedCourt)?.name || "All Courts") : "All Courts"}
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
              courts={courts}
              timeSlots={timeSlots}
              reservations={reservations}
              clinics={clinics}
              coaches={coaches}
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
                {(selectedCourt ? courts.filter(court => court.id === selectedCourt) : courts).map((court) => (
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
                                isMyClinicReservation: boolean;
                                coachName?: string;
                                coachUnavailable?: boolean;
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
                                isMyClinicReservation: boolean;
                                coachName?: string;
                                coachUnavailable?: boolean;
                              } | null = null;

                              // Group consecutive time slots into blocks
                              for (let i = 0; i < hours.length; i++) {
                                const hour = hours[i];
                                const { available, reserved, blocked, isClinic, slot, clinic, reservation, coachUnavailable, isOpenPlay, openPlaySlots, currentPlayers, maxOpenPlayers, openPlayGroupId } = getSlotStatus(court, day, hour);

                                // Compute group-wide total for open play
                                let groupTotalPlayers = currentPlayers;
                                if (isOpenPlay && openPlayGroupId) {
                                  groupTotalPlayers = reservations
                                    .filter(r => (r as any).openPlayGroupId === openPlayGroupId)
                                    .reduce((sum, r) => sum + (r.players || 1), 0);
                                }

                                // Check if this is the current user's reservation
                                // Match by email OR by createdById (if user is logged in)
                                const isMyReservation = reservation ? (
                                  reservation.playerEmail === currentUserEmail ||
                                  (currentUser?.id && (reservation as any).createdById === currentUser.id)
                                ) : false;

                                if (isClinic && clinic) {
                                  // Check if this is the user's clinic reservation
                                  // Check both: reservation ownership AND clinic participants
                                  const clinicParticipants = (clinic as any).participants || [];
                                  const isInClinicParticipants = currentUserEmail && clinicParticipants.some(
                                    (p: any) => p.email === currentUserEmail || p.userId === currentUser?.id
                                  );
                                  const isMyClinicReservation = isMyReservation || isInClinicParticipants;

                                  // Get the coach name for the clinic
                                  const coach = clinic.coachId ? coaches.find(c => c.id === clinic.coachId) : null;
                                  const coachName = coach?.name || 'Coach';

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
                                      isMyReservation,
                                      isMyClinicReservation,
                                      coachName,
                                      coachUnavailable
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
                                    isMyReservation,
                                    isMyClinicReservation: false,
                                    coachUnavailable,
                                    isOpenPlay,
                                    openPlaySlots,
                                    currentPlayers,
                                    maxOpenPlayers,
                                    groupTotalPlayers,
                                  });
                                }
                              }
                              
                              // Add the last block if it exists
                              if (currentBlock) {
                                timeSlotBlocks.push(currentBlock);
                              }
                              
                              return timeSlotBlocks
                                .filter((block) => {
                                  // Always show coach-unavailable slots when coach is selected (they should be visible but disabled)
                                  if (block.coachUnavailable) {
                                    return true;
                                  }

                                  // Apply legend filters
                                  // Clinic blocks should only be filtered by clinic filter
                                  if (block.isClinic) {
                                    return legendFilters.clinic;
                                  }

                                  // Open play filter
                                  if (block.isOpenPlay && !block.isMyReservation) {
                                    return legendFilters.openPlay;
                                  }

                                  // Non-clinic blocks use other filters
                                  if (block.available && !block.reserved && !block.blocked && !legendFilters.available) return false;
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
         <MyReservationsModal
           reservations={reservations}
           timeSlots={timeSlots}
           courts={courts}
           currentUserEmail={currentUserEmail}
           currentUser={currentUser}
           myReservationsModalRef={myReservationsModalRef as React.RefObject<HTMLDivElement>}
           onClose={() => setShowMyReservations(false)}
           onBackgroundClick={() => handleBackgroundClick('myReservations')}
         />
       )}

       {/* Reservation Details Popup */}
       {selectedReservation && (
         <ReservationDetailsPopup
           selectedReservation={selectedReservation}
           reservationPopupRef={reservationPopupRef as React.RefObject<HTMLDivElement>}
           onClose={() => setSelectedReservation(null)}
           onBackgroundClick={() => handleBackgroundClick('reservationPopup')}
           onEdit={handleEditReservation}
         />
       )}

       {/* Edit Reservation Dialog */}
       <EditReservationDialog
         isOpen={editingReservation !== null}
         onClose={() => setEditingReservation(null)}
         onSave={handleSaveReservation}
         onDelete={handleDeleteReservation}
         reservation={editingReservation}
       />

       {/* Join Open Play Dialog */}
       {joinOpenPlayData && (
         <JoinOpenPlayDialog
           isOpen={true}
           onClose={() => setJoinOpenPlayData(null)}
           reservation={joinOpenPlayData.reservation}
           timeSlot={joinOpenPlayData.timeSlot}
           court={joinOpenPlayData.court}
         />
       )}
    </>
  );
};

export default HomeSchedulerView;