import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Users, GraduationCap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, subDays, startOfDay, startOfWeek } from "date-fns";
import { TimeSlot, Court, Clinic, Reservation, Comment } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn, getTimeSlotStatus, getTimeSlotStatusClasses } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useDataService } from "@/hooks/use-data-service";
import { useBookings } from "@/hooks/use-bookings";
import type { Social } from "@/lib/validation/schemas";

import DayView from "./DayView";
import CourtCalendar from "./CourtCalendar";
import CourtHeader from "./CourtHeader";
import EditReservationDialog from "./EditReservationDialog";

// Type definitions for time slot blocks
interface TimeSlotBlockData {
  startHour: number;
  endHour: number;
  isClinic: boolean;
  isSocial: boolean;
  clinic: Clinic | null;
  slot: TimeSlot | null;
  available: boolean;
  reserved: boolean;
  blocked: boolean;
  isMyReservation: boolean;
  coachUnavailable?: boolean;
  social?: Social | null;
}

interface ReservationWithDetails {
  reservation: Reservation;
  timeSlot: TimeSlot;
  court: Court;
}

interface HomeSchedulerViewProps {
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
  selectedCoachId?: string;
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
    social: boolean;
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
        "text-sm sm:text-base text-center rounded transition-all duration-200 relative",
        isMobile ? "p-1" : "p-2",
        // Past slots should always be grey (check first, before other conditions)
        isPast
          ? "bg-gray-400/50 text-gray-600 border-2 border-gray-500/60 shadow-sm cursor-not-allowed opacity-60"
          // Coach unavailable styling - show but disable
          : block.coachUnavailable
          ? "bg-gray-400/50 text-gray-900 border-2 border-gray-500/60 shadow-sm cursor-not-allowed opacity-60"
          : block.isSocial
          ? "bg-orange-300/50 text-orange-900 border-2 border-orange-500/60 shadow-sm hover:bg-orange-300/60 cursor-pointer hover:scale-105"
          : block.isMyReservation
          ? "bg-purple-500/50 text-purple-900 border-2 border-purple-600/60 shadow-sm hover:bg-purple-500/60 cursor-pointer hover:scale-105"
          : block.isClinic
          ? "bg-yellow-500/50 text-yellow-900 border-2 border-yellow-600/60 shadow-sm hover:bg-yellow-500/60 cursor-pointer hover:scale-105"
          : block.available && !block.blocked && !block.reserved
          ? "bg-green-500/50 text-green-900 border-2 border-green-600/60 shadow-sm hover:bg-green-500/60 cursor-pointer hover:scale-105"
          : block.reserved
          ? "bg-blue-500/50 text-blue-900 border-2 border-blue-600/60 shadow-sm hover:bg-blue-500/60 cursor-pointer hover:scale-105"
          : block.blocked
          ? "bg-gray-400/50 text-gray-900 border-2 border-gray-500/60 shadow-sm cursor-not-allowed"
          : "bg-gray-200 text-gray-500 border-2 border-gray-300/60 cursor-not-allowed",
        isMultiHour && "flex items-center justify-center",
        isMultiHour && !isPast && !block.coachUnavailable && block.isSocial && "border-orange-500/60 bg-gradient-to-br from-orange-300/50 to-orange-300/60 hover:from-orange-300/60 hover:to-orange-300/70",
        isMultiHour && !isPast && !block.coachUnavailable && block.isClinic && "border-yellow-600/60 bg-gradient-to-br from-yellow-500/50 to-yellow-500/60 hover:from-yellow-500/60 hover:to-yellow-500/70",
        isMultiHour && !isPast && !block.coachUnavailable && block.isMyReservation && "border-purple-600/60 bg-gradient-to-br from-purple-500/50 to-purple-500/60 hover:from-purple-500/60 hover:to-purple-500/70",
        isMultiHour && !isPast && !block.coachUnavailable && block.available && !block.isClinic && !block.isMyReservation && !block.isSocial && "border-green-600/60 bg-gradient-to-br from-green-500/50 to-green-500/60 hover:from-green-500/60 hover:to-green-500/70"
      )}
      style={{
        height: isMultiHour ? `${duration * (isMobile ? 4 : 3.5)}rem` : undefined,
        minHeight: isMultiHour ? undefined : isMobile ? "4rem" : "3.5rem",
        marginBottom: isMultiHour ? "0.5rem" : undefined
      }}
      onClick={() => {
        // Don't allow clicking past slots or coach-unavailable slots
        if (isPast || block.coachUnavailable) return;

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
        isPast
          ? `Past: ${block.startHour}:00 - ${block.endHour}:00`
          : block.coachUnavailable
          ? `Coach unavailable: ${block.startHour}:00 - ${block.endHour}:00`
          : block.isSocial
          ? `Social Game: ${block.startHour}:00 - ${block.endHour}:00`
          : block.isMyReservation
          ? `My Reservation: ${block.startHour}:00 - ${block.endHour}:00`
          : block.clinic
          ? `${block.clinic.name}: ${block.clinic.description} ($${block.clinic.price})`
          : `${block.startHour}:00 - ${block.endHour}:00`
      }
    >
      {isMultiHour ? (
        <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
          <span className="font-bold text-xl sm:text-lg">{block.startHour}:00</span>
          <span className="text-sm sm:text-xs opacity-75 font-medium">to</span>
          <span className="font-bold text-xl sm:text-lg">{block.endHour}:00</span>
          {block.isSocial && block.social && (
            <div className="text-center mt-2">
              <span className="text-xs px-2 py-1 bg-orange-600/30 rounded-full border border-orange-600/40 font-semibold flex items-center gap-1 justify-center">
                <Users className="h-3 w-3" />
                Social Game
              </span>
              <div className="text-xs mt-1 text-orange-800 font-semibold">
                {block.social.title}
              </div>
            </div>
          )}
          {block.isClinic && block.clinic && (
            <span
              className="text-[10px] mt-2 px-2 py-1 bg-yellow-600/30 rounded border border-yellow-600/40 font-semibold text-center break-words leading-tight max-w-full overflow-visible cursor-help"
              title={block.clinic.name}
            >
              {block.clinic.name}
            </span>
          )}
          {block.isMyReservation && (
            <span className="text-sm mt-2 px-3 py-1 bg-purple-600/30 rounded-full border border-purple-600/40 font-semibold">
              My Reservation
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden">
          {block.isSocial ? (
            <>
              <Users className="h-3 w-3 mb-0.5" />
              <span className="font-bold text-lg sm:text-xl">{block.startHour}:00</span>
              <span className="text-[10px] font-semibold">Social</span>
            </>
          ) : block.isClinic ? (
            <>
              <GraduationCap className="h-3 w-3 mb-0.5" />
              <span className="font-bold text-lg sm:text-xl">{block.startHour}:00</span>
            </>
          ) : block.isMyReservation ? (
            <>
              <User className="h-3 w-3 mb-0.5" />
              <span className="font-bold text-lg sm:text-xl">{block.startHour}:00</span>
            </>
          ) : block.reserved ? (
            <>
              <User className="h-3 w-3 mb-0.5" />
              <span className="font-bold text-lg sm:text-xl">{block.startHour}:00</span>
            </>
          ) : block.blocked ? (
            <span className="font-bold text-lg sm:text-xl">{block.startHour}:00</span>
          ) : block.available ? (
            <span className="font-bold text-lg sm:text-xl">{block.startHour}:00</span>
          ) : (
            <span className="font-bold text-lg sm:text-xl text-gray-400">{block.startHour}:00</span>
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

const HomeSchedulerView = ({ onSelectTimeSlot, selectedCoachId }: HomeSchedulerViewProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const [showMyReservations, setShowMyReservations] = useState<boolean>(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  
  // Legend filter states
  const [legendFilters, setLegendFilters] = useState<{
    available: boolean;
    clinic: boolean;
    social: boolean;
    myReservations: boolean;
  }>({
    available: true,
    clinic: true,
    social: true,
    myReservations: true,
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
  const { courts, reservations, clinics, coaches, socials, refreshKey } = useDataService();

  // Get booking operations from centralized hook
  const { updateReservation, deleteReservation } = useBookings();
  
  // Load time slots dynamically for the dates being displayed
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const activeFilterLabel = useMemo(() => {
    if (legendFilters.available && legendFilters.clinic && legendFilters.social && legendFilters.myReservations) return "All";
    if (legendFilters.available) return "Available";
    if (legendFilters.clinic) return "Clinic";
    if (legendFilters.social) return "Social";
    if (legendFilters.myReservations) return "My Reservations";
    return "All";
  }, [legendFilters]);

  const isAllOn = useMemo(() => (
    legendFilters.available && legendFilters.clinic && legendFilters.social && legendFilters.myReservations
  ), [legendFilters]);

  // Toggle legend filter
  // Behavior:
  // - Click on a filter when all are on -> enable exclusive mode for that filter
  // - Click again on the active exclusive filter -> turn all filters back on (show all)
  // - Click on a different filter while in exclusive mode -> switch exclusive filter
  const toggleLegendFilter = useCallback((filterType: keyof typeof legendFilters) => {
    setLegendFilters((prev) => {
      const allOn = prev.available && prev.clinic && prev.social && prev.myReservations;
      const entries = Object.entries(prev) as Array<[keyof typeof prev, boolean]>;
      const numOn = entries.reduce((count, [, value]) => count + (value ? 1 : 0), 0);
      const isExclusive = numOn === 1 && prev[filterType];

      if (isExclusive) {
        // Turning off the active exclusive filter -> show all
        return { available: true, clinic: true, social: true, myReservations: true };
      }

      // Otherwise switch to exclusive mode for the selected filter
      return {
        available: filterType === 'available',
        clinic: filterType === 'clinic',
        social: filterType === 'social',
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
    setSelectedDateForDayView(date);
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
      return { available: false, reserved: false, blocked: false, isClinic: false, isSocial: false, slot: null, clinic: null, reservation: null };
    }

    const slot = relevantSlots[0];
    const reservation = reservations.find(res => res.timeSlotId === slot.id);
    const clinic = slot.clinicId ? clinics.find(c => c.id === slot.clinicId) : null;
    
    // Check if this time slot is in the past
    const slotDateTime = new Date(day);
    const [slotHours, slotMinutes] = slot.startTime.split(':').map(Number);
    slotDateTime.setHours(slotHours, slotMinutes || 0, 0, 0);
    const isSlotInPast = slotDateTime < currentTime;
    
    // Check if this is a social and if it hasn't passed yet
    let isSocial = false;
    if (slot.socialId) {
      const social = socials.find(s => s.id === slot.socialId);
      if (social) {
        // Check if the social's end time has passed
        const now = currentTime;
        const socialDate = new Date(social.date);
        const [hours, minutes] = social.endTime.split(':').map(Number);
        socialDate.setHours(hours, minutes || 0, 0, 0);
        isSocial = socialDate >= now; // Only show if end time hasn't passed
      }
    }

    const status = {
      available: slot.available && !isSlotInPast, // Mark as unavailable if in the past
      reserved: !!reservation,
      blocked: slot.blocked || false,
      isClinic: !!clinic,
      isSocial,
      slot,
      clinic,
      reservation,
      coachUnavailable: false
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
  }, [selectedCoachId, timeSlots, reservations, clinics, coaches, socials, currentTime]);

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
        // Show reservation popup
        setSelectedReservation({
          reservation,
          timeSlot: slot,
          court
        });
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
              socials={socials}
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
                                isSocial: boolean;
                                clinic: Clinic | null;
                                slot: TimeSlot | null;
                                available: boolean;
                                reserved: boolean;
                                blocked: boolean;
                                isMyReservation: boolean;
                                coachUnavailable?: boolean;
                                social?: Social | null;
                              }> = [];

                              let currentBlock: {
                                startHour: number;
                                endHour: number;
                                isClinic: boolean;
                                isSocial: boolean;
                                clinic: Clinic | null;
                                slot: TimeSlot | null;
                                available: boolean;
                                reserved: boolean;
                                blocked: boolean;
                                isMyReservation: boolean;
                                coachUnavailable?: boolean;
                                social?: Social | null;
                              } | null = null;

                              // Group consecutive time slots into blocks
                              for (let i = 0; i < hours.length; i++) {
                                const hour = hours[i];
                                const { available, reserved, blocked, isClinic, isSocial, slot, clinic, reservation, coachUnavailable } = getSlotStatus(court, day, hour);

                                // Check if this is the current user's reservation
                                const isMyReservation = reservation ? reservation.playerEmail === currentUserEmail : false;

                                // Get social information if this is a social slot
                                let social: Social | null = null;
                                if (isSocial && slot?.socialId) {
                                  social = socials.find(s => s.id === slot.socialId) || null;
                                }
                                
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
                                      isSocial: false,
                                      clinic,
                                      slot,
                                      available,
                                      reserved,
                                      blocked: !!blocked,
                                      isMyReservation,
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
                                    isSocial: !!isSocial,
                                    clinic: null,
                                    slot,
                                    available,
                                    reserved,
                                    blocked: !!blocked,
                                    isMyReservation,
                                    coachUnavailable,
                                    social: isSocial ? social : null
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
                                  // Social blocks should only be filtered by social filter
                                  if (block.isSocial) {
                                    return legendFilters.social;
                                  }

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
          courts={courts}
          timeSlots={timeSlots}
          reservations={reservations}
          clinics={clinics}
          coaches={coaches}
          socials={socials}
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
                 {reservations
                   .filter(res => res.playerEmail === currentUserEmail)
                   .map(reservation => {
                     const timeSlot = timeSlots.find(ts => ts.id === reservation.timeSlotId);
                     const court = courts.find(c => c.id === reservation.courtId);
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
                 
                 {/* Edit Button */}
                 <div className="flex justify-end pt-4 border-t">
                   <Button
                     onClick={handleEditReservation}
                     className="w-full sm:w-auto"
                   >
                     Edit Reservation
                   </Button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Edit Reservation Dialog */}
       <EditReservationDialog
         isOpen={editingReservation !== null}
         onClose={() => setEditingReservation(null)}
         onSave={handleSaveReservation}
         onDelete={handleDeleteReservation}
         reservation={editingReservation}
       />
    </>
  );
};

export default HomeSchedulerView;