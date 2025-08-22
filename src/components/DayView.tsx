import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, User, GraduationCap, X, MapPin, Star } from "lucide-react";
import { format } from "date-fns";
import { TimeSlot, Court, Reservation, Clinic, Coach } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getTimeSlotsWithStatusForDate, getReservationsForDate } from "@/lib/data";

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
  onSelectTimeSlot
}: DayViewProps) => {
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "EEEE, MMMM d, yyyy");
  
  // Time range to display (8am to 9pm)
  const startHour = 8;
  const endHour = 21;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

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
  const handleTimeSlotClick = (court: Court, hour: number) => {
    if (!onSelectTimeSlot) return;
    
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

  const dayViewContent = (
    <div className={isModal ? "p-6 overflow-y-auto max-h-[calc(90vh-120px)]" : "p-4"}>
      {/* Court Headers - Week View Style */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">Time</span>
          </div>
        </div>
        {courts.map((court) => (
          <div key={court.id} className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-4 rounded-lg border border-border/20">
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
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs font-medium">Premium</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Time Slots Grid - Week View Style */}
      <div className="space-y-3">
        {hours.map((hour) => {
          const timeString = `${hour.toString().padStart(2, '0')}:00`;
          
          return (
            <div key={hour} className="border border-border/30 rounded-lg overflow-hidden bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="grid grid-cols-4 gap-0">
                {/* Time Column */}
                <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 p-3 flex items-center justify-center border-r border-border/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      {timeString}
                    </span>
                  </div>
                </div>
                
                {/* Court Columns - Week View Style Blocks */}
                {courts.map((court, index) => {
                  const { available, reserved, blocked, slot, reservation, clinic } = getSlotStatus(court, hour);
                  const isClickable = available && !reserved && !blocked && !clinic && onSelectTimeSlot;
                  const isPast = isTimeSlotInPast(selectedDate, hour);
                  
                  return (
                    <div
                      key={court.id}
                      className={cn(
                        "p-2 min-h-[3rem] flex items-center justify-center transition-all duration-200 hover:scale-105 relative",
                        index < courts.length - 1 ? "border-r border-border/20" : "",
                        isClickable ? "cursor-pointer" : "cursor-default"
                      )}
                    >
                      <div
                        className={cn(
                          "w-full h-full rounded text-xs text-center flex items-center justify-center transition-all duration-200 p-2",
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
                        onClick={() => isClickable && handleTimeSlotClick(court, hour)}
                        title={
                          clinic 
                            ? `${clinic.name}: ${clinic.description} ($${clinic.price})`
                            : reservation
                            ? `Reserved by ${reservation.playerName} (${reservation.players} player${reservation.players !== 1 ? 's' : ''})`
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
                            <span className="font-medium text-xs">Clinic</span>
                          </div>
                        ) : reservation ? (
                          <div className="flex flex-col items-center">
                            <User className="h-3 w-3 mb-1" />
                            <span className="font-medium text-xs">Reserved</span>
                          </div>
                        ) : blocked ? (
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-xs">Blocked</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-xs">
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
            <div className="w-3 h-3 bg-green-500/20 rounded-sm border border-green-500/30"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-secondary/20 rounded-sm border border-secondary/30"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500/20 rounded-sm border border-yellow-500/30"></div>
            <span>Clinic</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500/20 rounded-sm border border-gray-500/30"></div>
            <span>Blocked</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Return inline content for non-modal usage
  if (!isModal) {
    return (
      <Card className="gradient-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {displayDate}
            </CardTitle>
            <p className="text-muted-foreground">
              Full day schedule for all courts
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
      <DialogContent className="w-[calc(100%-2rem)] max-w-6xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-background via-muted/30 to-background">
        <DialogHeader className="px-6 py-6 border-b border-border bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={onClose} className="hover:bg-primary/10 hover:border-primary/30">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Scheduler
              </Button>
              <div>
                <DialogTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  {displayDate}
                </DialogTitle>
                <p className="text-muted-foreground">
                  Full day schedule for all courts
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-primary/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        {dayViewContent}
      </DialogContent>
    </Dialog>
  );
};

export default DayView;