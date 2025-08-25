import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, User, GraduationCap, X, MapPin, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { TimeSlot, Court, Reservation, Clinic, Coach } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dataService } from "@/lib/services/data-service";
import { getReservationsForDate, getTimeSlotsWithStatusForDate, getSlotStatusForCourtDateTimeObj } from "@/lib/data";

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
  onDateChange
}: DayViewProps) => {
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "EEEE, MMMM d, yyyy");
  
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

  // Use centralized function for getting slot status
  const getSlotStatusForDate = (court: Court, date: Date, hour: number) => {
    return getSlotStatusForCourtDateTimeObj(court, date, hour);
  };

  // Get all time slots for the selected date
  const dateTimeSlots = timeSlots.filter(slot => slot.date === formattedDate);
  
  // Get all reservations for the selected date using centralized function
  const dateReservations = getReservationsForDate(formattedDate);
  
  // Get all clinics for the selected date
  const dateClinics = clinics.filter(clinic => clinic.date === formattedDate);
  
  // Get time slots with status for better reservation handling
  const timeSlotsWithStatus = getTimeSlotsWithStatusForDate(formattedDate);

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

  // Function to get time slot status for a specific court and hour - now uses centralized data
  const getSlotStatus = (court: Court, hour: number) => {
    const relevantSlots = timeSlotsWithStatus.filter(
      slot => slot.courtId === court.id && parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length === 0) return { available: false, reserved: false, blocked: false, isClinic: false, slot: null };

    const slotWithStatus = relevantSlots[0];
    
    return {
      available: slotWithStatus.isAvailable,
      reserved: slotWithStatus.isReserved,
      blocked: slotWithStatus.isBlocked,
      slot: slotWithStatus,
      reservation: slotWithStatus.reservation,
      clinic: slotWithStatus.clinic,
    };
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

        {/* Court Headers - Mobile-responsive */}
        <div className="mb-6">
          {/* Mobile: Stack vertically, Desktop: Grid layout */}
          <div className="block sm:hidden space-y-3">
            <div className="text-center bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-3 rounded-lg border border-border/20">
              <div className="flex items-center justify-center gap-2">
                {isTimeFocusMode ? (
                  <>
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">Days</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">Time</span>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {courts.map((court) => (
                <div key={court.id} className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-3 rounded-lg border border-border/20">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="p-1 bg-primary/20 rounded">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">
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

          {/* Desktop: Grid layout */}
          <div className="hidden sm:grid grid-cols-4 gap-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                {isTimeFocusMode ? (
                  <>
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">Days</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">Time</span>
                  </>
                )}
              </div>
            </div>
            {courts.map((court) => (
              <div key={court.id} className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-4 rounded-lg border border-border/20 min-h-[120px]">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-1 bg-primary/20 rounded">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
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

        {/* Dynamic Grid - Changes based on mode */}
        <div className="space-y-3">
          {rowData.map((row, rowIndex) => {
            return (
              <div key={rowIndex} className="border border-border/30 rounded-lg overflow-hidden bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  {/* Row Header - Mobile */}
                  <div 
                    className={cn(
                      "bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 p-3 flex items-center justify-center border-b border-border/20 transition-colors",
                      !isTimeFocusMode && row.type === 'hour' ? "cursor-pointer hover:bg-primary/10" : "",
                      isTimeFocusMode && row.type === 'day' && onDateChange ? "cursor-pointer hover:bg-primary/10" : ""
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
                    <div className="flex items-center gap-2">
                      {row.type === 'hour' ? (
                        <Clock className="h-5 w-5 text-primary" />
                      ) : (
                        <Calendar className="h-5 w-5 text-primary" />
                      )}
                      <span className="text-lg font-bold text-foreground">
                        {row.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Courts Grid - Mobile */}
                  <div className="grid grid-cols-1 gap-2 p-3">
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
                        <div key={court.id} className="border border-border/20 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{court.name}</span>
                          </div>
                          <div
                            className={cn(
                              "w-full h-12 rounded text-base text-center flex items-center justify-center transition-all duration-200 font-medium",
                              isClickable ? "cursor-pointer" : "cursor-default",
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
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                <span>Clinic</span>
                              </div>
                            ) : reservation ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Reserved</span>
                              </div>
                            ) : blocked ? (
                              <span>Blocked</span>
                            ) : (
                              <span>{available ? "Available" : "N/A"}</span>
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
      <Card className="gradient-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {isTimeFocusMode && focusedTime 
                ? `${focusedTime.toString().padStart(2, '0')}:00 - Next 13 Days`
                : displayDate
              }
            </CardTitle>
            <p className="text-muted-foreground">
              {isTimeFocusMode 
                ? "Time focus view - showing the same time across multiple days"
                : "Full day schedule for all courts"
              }
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-1 md:px-4 pb-2">
          {dayViewContent}
        </CardContent>
      </Card>
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
      </DialogContent>
    </Dialog>
  );
};

export default DayView;