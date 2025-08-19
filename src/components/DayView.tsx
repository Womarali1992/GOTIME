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
}

const DayView = ({ 
  selectedDate, 
  onClose, 
  courts, 
  timeSlots, 
  reservations, 
  clinics, 
  coaches,
  isOpen
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Courts Grid */}
          <div className="space-y-6">
            {courts.map((court) => (
              <Card key={court.id} className="overflow-hidden bg-card/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-4 sm:p-6 border-b border-border/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground">
                          {court.name}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {court.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-end">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        court.indoor 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {court.indoor ? "Indoor" : "Outdoor"}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                        <span className="text-xs sm:text-sm font-medium">Premium</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {hours.map((hour) => {
                      const { available, reserved, blocked, slot, reservation, clinic } = getSlotStatus(court, hour);
                      const timeString = `${hour.toString().padStart(2, '0')}:00`;
                      
                      return (
                        <div
                          key={`${court.id}-${hour}`}
                          className={cn(
                            "min-h-[4rem] rounded-sm flex items-center px-4 transition-all duration-300",
                            clinic
                              ? "bg-yellow-500/30 text-yellow-800 border border-yellow-500/50"
                              : blocked
                              ? "bg-gray-500/30 text-gray-100 border border-gray-500/50"
                              : reservation
                              ? "bg-blue-500/20 text-blue-700 border border-blue-500/30"
                              : available
                              ? "bg-green-500/20 text-green-700 border border-green-500/30"
                              : "bg-muted/80 text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between w-full gap-4">
                            <div className="min-w-[150px]">
                              {clinic ? (
                                <div>
                                  <span className="font-semibold text-base flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    {clinic.name}
                                  </span>
                                  <div className="text-sm text-muted-foreground">
                                    Coach: {coaches.find(c => c.id === clinic.coachId)?.name}
                                  </div>
                                </div>
                              ) : reservation ? (
                                <div>
                                  <span className="font-semibold text-base flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {reservation.playerName}
                                  </span>
                                  <div className="text-sm text-muted-foreground">
                                    ({reservation.players} player{reservation.players !== 1 ? 's' : ''})
                                  </div>
                                </div>
                              ) : blocked ? (
                                <span className="text-base font-medium">
                                  Blocked
                                </span>
                              ) : (
                                <span className="text-base font-medium">
                                  {slot?.available ? "Available" : "Unavailable"}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-1 justify-center">
                              <Clock className="h-5 w-5" />
                              <span className="text-lg font-semibold whitespace-nowrap">
                                {timeString}
                              </span>
                            </div>

                            <Badge
                              variant={clinic ? "default" : blocked ? "secondary" : slot?.available ? "outline" : "secondary"}
                              className={cn(
                                "text-sm shrink-0 min-w-[80px] justify-center",
                                clinic ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30" : ""
                              )}
                            >
                              {clinic
                                ? "Clinic"
                                : blocked
                                ? "Blocked"
                                : reservation
                                ? "Reserved"
                                : slot?.available
                                ? "Available"
                                : "Unavailable"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500/20 rounded-sm border border-green-500/30"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500/20 rounded-sm border border-blue-500/30"></div>
                <span>Reserved</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500/30 rounded-sm border border-yellow-500/50"></div>
                <span>Clinic</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted/80 rounded-sm border border-muted-foreground/30"></div>
                <span>Blocked</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayView;
