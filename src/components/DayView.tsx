import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, User, GraduationCap, X, MapPin, Calendar } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { TimeSlot, Court, Reservation, Clinic, Coach } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dataService } from "@/lib/services/data-service";
import CourtHeader from "./CourtHeader";

interface DayViewProps {
  selectedDate: Date;
  onClose: () => void;
  courts: Court[];
  timeSlots: TimeSlot[];
  reservations: Reservation[];
  clinics: Clinic[];
  coaches: Coach[];
  isOpen: boolean;
  isModal?: boolean; // New prop to control modal vs inline display
  onSelectTimeSlot?: (timeSlot: TimeSlot) => void; // Add slot selection callback
  onDateChange?: (date: Date) => void; // Add date change callback
  // Navigation props for inline view
  weekOffset?: number;
  onWeekChange?: (offset: number) => void;
  viewDays?: number;
  onViewDaysChange?: (days: number) => void;
  legendFilters?: {
    available: boolean;
    clinic: boolean;
    myReservations: boolean;
  };
  onLegendFiltersChange?: (filters: { available: boolean; clinic: boolean; myReservations: boolean; }) => void;
  selectedCourt?: string | undefined;
  onCourtChange?: (courtId: string | undefined) => void;
}

const DayView = ({ 
  selectedDate, 
  onClose, 
  courts, 
  timeSlots,
  reservations, 
  clinics, 
  coaches,
  isOpen,
  isModal = true,
  onSelectTimeSlot,
  onDateChange,
  weekOffset = 0,
  onWeekChange,
  viewDays = 1,
  onViewDaysChange,
  legendFilters = { available: true, clinic: true, myReservations: true },
  onLegendFiltersChange,
  selectedCourt,
  onCourtChange
}: DayViewProps) => {
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "MMM d");
  
  // Time focus mode state
  const [isTimeFocusMode, setIsTimeFocusMode] = useState(false);
  const [focusedTime, setFocusedTime] = useState<number | null>(null);
  
  // Reservation popup state
  const [selectedReservation, setSelectedReservation] = useState<{
    reservation: any;
    timeSlot: TimeSlot;
    court: any;
  } | null>(null);
  
  // Time range to display (8am to 9pm)
  const startHour = 8;
  const endHour = 21;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Generate next 13 days for time focus mode
  const next13Days = Array.from({ length: 13 }, (_, i) => addDays(new Date(), i));

  // ESC key handler for exiting time focus mode
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTimeFocusMode) {
        setIsTimeFocusMode(false);
        setFocusedTime(null);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isTimeFocusMode]);

  // Function to enter time focus mode
  const enterTimeFocusMode = (hour: number) => {
    setFocusedTime(hour);
    setIsTimeFocusMode(true);
  };

  // Function to exit time focus mode
  const exitTimeFocusMode = () => {
    setIsTimeFocusMode(false);
    setFocusedTime(null);
  };

  // Use services-based single source for getting slot status
  const getSlotStatusForDate = (court: Court, date: Date, hour: number) => {
    const dateString = format(date, "yyyy-MM-dd");
    return dataService.timeSlotService.getSlotStatus(court.id, dateString, hour);
  };

  // Get all time slots for the selected date
  const dateTimeSlots = timeSlots.filter(slot => slot.date === formattedDate);
  
  // Get all reservations for the selected date using services
  const dateReservations = dataService.reservationService.getReservationsForDate(formattedDate);
  
  // Get all clinics for the selected date using services
  const dateClinics = dataService.clinicService.getClinicsForDate(formattedDate);
  
  // Get time slots with status for better reservation handling (services)
  const timeSlotsWithStatus = dataService.timeSlotService.getTimeSlotsForDate(formattedDate);

  // Function to get clinic for a time slot
  const getClinicForSlot = (slot: TimeSlot) => {
    if (slot.type === 'clinic' && slot.clinicId) {
      return clinics.find(clinic => clinic.id === slot.clinicId);
    }
    return null;
  };

  // Function to get reservation for a time slot
  const getReservationForSlot = (slot: TimeSlot) => {
    return reservations.find(reservation => reservation.timeSlotId === slot.id);
  };

  // Function to get time slot status for a specific court and hour - services based
  const getSlotStatus = (court: Court, hour: number) => {
    return dataService.timeSlotService.getSlotStatus(court.id, formattedDate, hour);
  };

  // Check if a time slot is in the past
  const isTimeSlotInPast = (day: Date, hour: number) => {
    const now = new Date();
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < now;
  };

  // Handle time slot click
  const handleTimeSlotClick = (court: Court, hour: number, date?: Date) => {
    const targetDate = date ? format(date, "yyyy-MM-dd") : formattedDate;
    const relevantSlots = timeSlots.filter(
      slot =>
        slot.courtId === court.id &&
        slot.date === targetDate &&
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
      } else if (slot.available && onSelectTimeSlot) {
        // Handle available slot booking
        onSelectTimeSlot(slot);
      }
    }
  };

  // Handle time header click to enter time focus mode
  const handleTimeHeaderClick = (hour: number) => {
    enterTimeFocusMode(hour);
  };

  // Handle day header click to switch to that day's view
  const handleDayHeaderClick = (date: Date) => {
    if (onDateChange) {
      onDateChange(date);
      exitTimeFocusMode(); // Exit time focus mode and go to regular day view
    }
  };

  // Navigation handlers for date/time navigation
  const handlePreviousNavigation = () => {
    if (isTimeFocusMode && focusedTime !== null) {
      // In time focus mode, navigate to previous hour
      const newHour = focusedTime - 1;
      if (newHour >= 8) { // Don't go before 8am
        setFocusedTime(newHour);
      }
    } else {
      // In day mode, navigate to previous day
      const previousDate = subDays(selectedDate, 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (previousDate >= today && onDateChange) {
        onDateChange(previousDate);
      }
    }
  };

  const handleNextNavigation = () => {
    if (isTimeFocusMode && focusedTime !== null) {
      // In time focus mode, navigate to next hour
      const newHour = focusedTime + 1;
      if (newHour <= 21) { // Don't go after 9pm
        setFocusedTime(newHour);
      }
    } else {
      // In day mode, navigate to next day
      const nextDate = addDays(selectedDate, 1);
      if (onDateChange) {
        onDateChange(nextDate);
      }
    }
  };

  // Get the data to display in rows (either hours or days based on mode)
  const getRowData = () => {
    if (isTimeFocusMode && focusedTime) {
      // In time focus mode, rows are the next 13 days
      return next13Days.map(day => ({
        type: 'day' as const,
        value: day,
        label: format(day, "EEE d"), // Shorter format: "Wed 15"
        fullLabel: format(day, "EEE, MMM d"), // Full format for tooltips
        timeString: format(day, "yyyy-MM-dd")
      }));
    } else {
      // In default mode, rows are time slots
      return hours.map(hour => ({
        type: 'hour' as const,
        value: hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        fullLabel: `${hour.toString().padStart(2, '0')}:00`,
        timeString: `${hour.toString().padStart(2, '0')}:00`
      }));
    }
  };

  // Unified grid view that works for both modes
  const renderUnifiedGridView = () => {
    const rowData = getRowData();
    
    return (
      <div className={isModal ? "p-5 md:p-6 overflow-y-auto max-h-[calc(95vh-100px)]" : "p-3 md:p-4"}>
        {/* Back button for time focus mode */}
        {isTimeFocusMode && (
          <div className="mb-6 flex items-center justify-center">
            <Button 
              variant="outline" 
              onClick={exitTimeFocusMode}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Day View
            </Button>
          </div>
        )}

        {/* Day of Week Navigation removed */}

        {/* Court Headers - Mobile-responsive - Always show in day view */}
        {(
          <div className="mb-6">
          {/* Mobile: Grid layout to match table structure */}
          <div className="block sm:hidden">
            <div className="grid grid-cols-4 gap-0 border border-border/30 rounded-lg overflow-hidden bg-card/80">
              {/* Time/Days header */}
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-2 border-r border-border/20 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  {/* Previous Navigation Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviousNavigation}
                    className="h-6 w-6 p-0 hover:bg-primary/10 rounded-full"
                    disabled={
                      isTimeFocusMode 
                        ? focusedTime === 8 
                        : (() => {
                            const yesterday = subDays(selectedDate, 1);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return yesterday < today;
                          })()
                    }
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>

                  <div className="flex flex-col items-center gap-1">
                    {isTimeFocusMode ? (
                      <>
                        <Clock className="h-3 w-3 text-primary" />
                        <span className="text-xs font-semibold">{focusedTime?.toString().padStart(2, '0')}:00</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3 text-primary" />
                        <span className="text-xs font-semibold">{format(selectedDate, "MMM d")}</span>
                      </>
                    )}
                  </div>

                  {/* Next Navigation Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextNavigation}
                    className="h-6 w-6 p-0 hover:bg-primary/10 rounded-full"
                    disabled={
                      isTimeFocusMode 
                        ? focusedTime === 21 
                        : false
                    }
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Court headers */}
              {courts.map((court, index) => (
                <div 
                  key={court.id} 
                  className={cn(
                    "bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-2 flex flex-col items-center justify-center",
                    index < courts.length - 1 ? "border-r border-border/20" : ""
                  )}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <h3 className="text-xs font-bold text-foreground leading-tight">
                        {court.name}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-xs mb-1 leading-tight">
                      {court.location}
                    </p>
                    <span className={`px-1 py-0.5 rounded-full text-xs font-medium ${
                      court.indoor
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {court.indoor ? "Indoor" : "Outdoor"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden sm:grid grid-cols-4 gap-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                {/* Previous Navigation Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviousNavigation}
                  className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
                  disabled={
                    isTimeFocusMode 
                      ? focusedTime === 8 
                      : (() => {
                          const yesterday = subDays(selectedDate, 1);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return yesterday < today;
                        })()
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2">
                  {isTimeFocusMode ? (
                    <>
                      <Clock className="h-5 w-5 text-primary" />
                      <div className="text-sm font-semibold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                        <div>{focusedTime?.toString().padStart(2, '0')}:00</div>
                        <div>Time Focus</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5 text-primary" />
                      <div className="text-sm font-semibold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                        <div>{format(selectedDate, "EEEE")}</div>
                        <div>{format(selectedDate, "MMM d")}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Next Navigation Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextNavigation}
                  className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
                  disabled={
                    isTimeFocusMode 
                      ? focusedTime === 21 
                      : false
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {courts.map((court) => (
              <div key={court.id} className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-4 rounded-lg border border-border/20 min-h-[120px]">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                      {court.name}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">
                    {court.location}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      court.indoor
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {court.indoor ? "Indoor" : "Outdoor"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Dynamic Grid - Changes based on mode */}
        <div className="space-y-3">
          {rowData.map((row, rowIndex) => {
            return (
              <div key={rowIndex} className="border border-border/30 rounded-lg overflow-hidden bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Mobile Layout - Grid Format */}
                <div className="block sm:hidden">
                  <div className="grid grid-cols-4 gap-0">
                    {/* Row Header Column - Time or Day */}
                    <div 
                      className={cn(
                        "bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 p-2 flex items-center justify-center border-r border-border/20 transition-colors min-h-[3rem] rounded-l-lg",
                        !isTimeFocusMode && row.type === 'hour' ? "cursor-pointer hover:from-primary/10 hover:via-secondary/10 hover:to-primary/10" : "",
                        isTimeFocusMode && row.type === 'day' && onDateChange ? "cursor-pointer hover:from-primary/10 hover:via-secondary/10 hover:to-primary/10" : ""
                      )}
                      onClick={() => {
                        if (row.type === 'hour') {
                          handleTimeHeaderClick(row.value as number);
                        } else if (row.type === 'day' && onDateChange) {
                          handleDayHeaderClick(row.value as Date);
                        }
                      }}
                      title={
                        row.type === 'hour' 
                          ? `Click to view ${row.label} across next 13 days`
                          : row.type === 'day' && onDateChange
                          ? `Click to view full day schedule for ${row.fullLabel}`
                          : undefined
                      }
                    >
                      <div className="flex flex-col items-center gap-1">
                        {row.type === 'hour' ? (
                          <Clock className="h-3 w-3 text-primary flex-shrink-0" />
                        ) : (
                          <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-center leading-tight">
                          {row.label}
                        </span>
                      </div>
                    </div>
                    
                    {/* Court Columns */}
                    {courts.map((court, courtIndex) => {
                      // Get slot status based on current mode
                      let slotData;
                      if (row.type === 'hour') {
                        // Default mode: get status for this court and hour on selected date
                        slotData = getSlotStatus(court, row.value as number);
                      } else {
                        // Time focus mode: get status for this court and focused time on this day
                        slotData = getSlotStatusForDate(court, row.value as Date, focusedTime!);
                      }
                      
                      const { available, reserved, blocked, slot, reservation, clinic } = slotData;
                      const isClickable = available && !reserved && !blocked && !clinic && onSelectTimeSlot;
                      const isPast = row.type === 'hour' 
                        ? isTimeSlotInPast(selectedDate, row.value as number)
                        : isTimeSlotInPast(row.value as Date, focusedTime!);
                      
                      return (
                        <div
                          key={court.id}
                          className={cn(
                            "p-1 min-h-[3rem] flex items-center justify-center transition-all duration-200 relative",
                            courtIndex < courts.length - 1 ? "border-r border-border/20" : "",
                            isClickable ? "cursor-pointer" : "cursor-default"
                          )}
                        >
                          <div
                            className={cn(
                              "w-full h-full rounded text-xs text-center flex items-center justify-center transition-all duration-200 p-1",
                              clinic
                                ? "bg-yellow-500/20 text-yellow-800 border border-yellow-500/30 hover:bg-yellow-500/30"
                                : blocked
                                ? "bg-gray-500/20 text-gray-800 border border-gray-500/30"
                                : reservation
                                ? "bg-secondary/20 text-secondary-800 border border-secondary/30 hover:bg-secondary/30"
                                : available
                                ? "bg-green-500/20 text-green-800 border border-green-500/30 hover:bg-green-500/30"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed",
                              isPast && "opacity-50"
                            )}
                            onClick={() => {
                              if (isClickable) {
                                if (row.type === 'hour') {
                                  handleTimeSlotClick(court, row.value as number);
                                } else {
                                  handleTimeSlotClick(court, focusedTime!, row.value as Date);
                                }
                              }
                            }}
                            title={
                              clinic 
                                ? `${clinic.name}: ${clinic.description} ($${clinic.price})`
                                : reservation
                                ? `Reserved by ${reservation.playerName} (${reservation.players} player${reservation.players !== 1 ? 's' : ''})${reservation.participants && reservation.participants.length > 1 ? ` - Playing with ${reservation.participants.filter(p => !p.isOrganizer).map(p => p.name).join(', ')}` : ''}`
                                : blocked
                                ? "Blocked"
                                : available
                                ? "Available - Click to book"
                                : "Unavailable"
                            }
                          >
                            {clinic ? (
                              <div className="flex flex-col items-center">
                                <GraduationCap className="h-2 w-2 mb-0.5" />
                                <span className="font-semibold text-xs leading-none">Clinic</span>
                              </div>
                            ) : reservation ? (
                              <div className="flex flex-col items-center">
                                <User className="h-2 w-2 mb-0.5" />
                                <span className="font-semibold text-xs leading-none">Reserved</span>
                              </div>
                            ) : blocked ? (
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-xs leading-none">Blocked</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-xs leading-none">
                                  {available ? "Available" : "N/A"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:grid sm:grid-cols-4 gap-0">
                  {/* Row Header Column - Time or Day */}
                  <div 
                    className={cn(
                      "bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 p-3 flex items-center justify-center border-r border-border/20 transition-colors min-h-[3rem] min-w-[120px] rounded-l-xl shadow-lg",
                      !isTimeFocusMode && row.type === 'hour' ? "cursor-pointer hover:from-primary/10 hover:via-secondary/10 hover:to-primary/10" : "",
                      isTimeFocusMode && row.type === 'day' && onDateChange ? "cursor-pointer hover:from-primary/10 hover:via-secondary/10 hover:to-primary/10" : ""
                    )}
                    onClick={() => {
                      if (row.type === 'hour') {
                        handleTimeHeaderClick(row.value as number);
                      } else if (row.type === 'day' && onDateChange) {
                        handleDayHeaderClick(row.value as Date);
                      }
                    }}
                    title={
                      row.type === 'hour' 
                        ? `Click to view ${row.label} across next 13 days`
                        : row.type === 'day' && onDateChange
                        ? `Click to view full day schedule for ${row.fullLabel}`
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {row.type === 'hour' ? (
                        <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent whitespace-nowrap">
                        {row.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Court Columns */}
                  {courts.map((court, courtIndex) => {
                    // Get slot status based on current mode
                    let slotData;
                    if (row.type === 'hour') {
                      // Default mode: get status for this court and hour on selected date
                      slotData = getSlotStatus(court, row.value as number);
                    } else {
                      // Time focus mode: get status for this court and focused time on this day
                      slotData = getSlotStatusForDate(court, row.value as Date, focusedTime!);
                    }
                    
                    const { available, reserved, blocked, slot, reservation, clinic } = slotData;
                    const isClickable = available && !reserved && !blocked && !clinic && onSelectTimeSlot;
                    const isPast = row.type === 'hour' 
                      ? isTimeSlotInPast(selectedDate, row.value as number)
                      : isTimeSlotInPast(row.value as Date, focusedTime!);
                    
                    return (
                      <div
                        key={court.id}
                        className={cn(
                          "p-2 min-h-[3rem] flex items-center justify-center transition-all duration-200 hover:scale-105 relative",
                          courtIndex < courts.length - 1 ? "border-r border-border/20" : "",
                          isClickable ? "cursor-pointer" : "cursor-default"
                        )}
                      >
                        <div
                          className={cn(
                            "w-full h-full rounded text-sm md:text-base text-center flex items-center justify-center transition-all duration-200 p-2",
                            clinic
                              ? "bg-yellow-500/20 text-yellow-800 border border-yellow-500/30 hover:bg-yellow-500/30"
                              : blocked
                              ? "bg-gray-500/20 text-gray-800 border border-gray-500/30"
                              : reservation
                              ? "bg-secondary/20 text-secondary-800 border border-secondary/30 hover:bg-secondary/30"
                              : available
                              ? "bg-green-500/20 text-green-800 border border-green-500/30 hover:bg-green-500/30"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed",
                            isPast && "opacity-50"
                          )}
                          onClick={() => {
                            if (isClickable) {
                              if (row.type === 'hour') {
                                handleTimeSlotClick(court, row.value as number);
                              } else {
                                handleTimeSlotClick(court, focusedTime!, row.value as Date);
                              }
                            }
                          }}
                          title={
                            clinic 
                              ? `${clinic.name}: ${clinic.description} ($${clinic.price})`
                              : reservation
                              ? `Reserved by ${reservation.playerName} (${reservation.players} player${reservation.players !== 1 ? 's' : ''})${reservation.participants && reservation.participants.length > 1 ? ` - Playing with ${reservation.participants.filter(p => !p.isOrganizer).map(p => p.name).join(', ')}` : ''}`
                              : blocked
                              ? "Blocked"
                              : available
                              ? "Available - Click to book"
                              : "Unavailable"
                          }
                        >
                          {clinic ? (
                            <div className="flex flex-col items-center">
                              <GraduationCap className="h-3 w-3 mb-1" />
                              <span className="font-semibold text-sm">{clinic.name}</span>
                            </div>
                          ) : reservation ? (
                            <div className="flex flex-col items-center">
                              <User className="h-3 w-3 mb-1" />
                              <span className="font-semibold text-sm">Reserved</span>
                            </div>
                          ) : blocked ? (
                            <div className="flex flex-col items-center">
                              <span className="font-semibold text-sm">Blocked</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="font-semibold text-sm">
                                {available ? "Available" : "N/A"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500/20 border border-green-500/30"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/30"></div>
              <span>Clinic</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500/20 border border-gray-500/30"></div>
              <span>Blocked</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            {isTimeFocusMode 
              ? "Click on any day (left column) to view that day's schedule, or press ESC / 'Back to Day View' to return"
              : "Click on any time (left column) to view that time across the next 13 days"
            }
          </p>
        </div>
      </div>
    );
  };

  // Main content - unified grid view
  const dayViewContent = renderUnifiedGridView();

  // Return inline content for non-modal usage
  if (!isModal) {
    return (
      <div className="space-y-4">
        {/* Note: CourtHeader is now handled by parent HomeSchedulerView to avoid duplication */}
        
        <Card className="gradient-card overflow-hidden">
          <CardContent className="px-1 md:px-4 pb-2">
            {dayViewContent}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Return modal version
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-7xl max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-background via-muted/30 to-background">
        <DialogHeader className="px-6 py-6 border-b border-border bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={onClose} className="hover:bg-primary/10 hover:border-primary/30">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Scheduler
              </Button>
              <div>
                <DialogTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  {isTimeFocusMode && focusedTime 
                    ? `${focusedTime.toString().padStart(2, '0')}:00 - Next 13 Days`
                    : displayDate
                  }
                </DialogTitle>
                <p className="text-muted-foreground">
                  {isTimeFocusMode 
                    ? "Time focus view - showing the same time across multiple days"
                    : "Full day schedule for all courts"
                  }
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-primary/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        {dayViewContent}
        
        {/* Reservation Details Popup */}
        {selectedReservation && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setSelectedReservation(null)}
          >
            <div 
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
                          {format(new Date(selectedReservation.timeSlot.date), "MMM d")}
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
      </DialogContent>
    </Dialog>
  );
};

export default DayView;