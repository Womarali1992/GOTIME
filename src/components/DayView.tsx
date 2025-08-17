import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, User, GraduationCap, X } from "lucide-react";
import { format } from "date-fns";
import { TimeSlot, Court, Reservation, Clinic, Coach } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DayViewProps {
  selectedDate: Date;
  onClose: () => void;
  courts: Court[];
  timeSlots: TimeSlot[];
  reservations: Reservation[];
  clinics: Clinic[];
  coaches: Coach[];
}

const DayView = ({ 
  selectedDate, 
  onClose, 
  courts, 
  timeSlots, 
  reservations, 
  clinics, 
  coaches 
}: DayViewProps) => {
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "EEEE, MMMM d, yyyy");
  
  // Time range to display (8am to 9pm)
  const startHour = 8;
  const endHour = 21;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Get all time slots for the selected date
  const dateTimeSlots = timeSlots.filter(slot => slot.date === formattedDate);
  
  // Get all reservations for the selected date
  const dateReservations = reservations.filter(reservation => {
    const slot = timeSlots.find(s => s.id === reservation.timeSlotId);
    return slot && slot.date === formattedDate;
  });

  // Get all clinics for the selected date
  const dateClinics = clinics.filter(clinic => clinic.date === formattedDate);

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

  // Function to get time slot status for a specific court and hour
  const getSlotStatus = (court: Court, hour: number) => {
    const relevantSlots = dateTimeSlots.filter(
      slot => slot.courtId === court.id && parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length === 0) return { available: false, reserved: false, blocked: false, isClinic: false, slot: null };

    const slot = relevantSlots[0];
    const isClinic = slot.type === 'clinic';
    const reservation = getReservationForSlot(slot);
    const clinic = getClinicForSlot(slot);
    
    return {
      available: slot.available && !slot.blocked,
      reserved: !slot.available && !slot.blocked && !isClinic,
      blocked: slot.blocked,
      slot: slot,
      reservation: reservation,
      clinic: clinic,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scheduler
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {displayDate}
              </h1>
              <p className="text-muted-foreground">
                Full day schedule for all courts
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Courts Grid */}
          <div className="space-y-6">
            {courts.map((court) => (
              <Card key={court.id} className="border border-input bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                    {court.name}
                    <Badge
                      variant={court.indoor ? "secondary" : "outline"}
                      className={court.indoor ? "bg-secondary/20" : "border-primary/20"}
                    >
                      {court.indoor ? "Indoor" : "Outdoor"}
                    </Badge>
                  </CardTitle>
                  <p className="text-muted-foreground">{court.location}</p>
                </CardHeader>
                <CardContent>
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
                              ? "bg-secondary/20 text-secondary-foreground"
                              : available
                              ? "bg-primary/20 text-primary-foreground"
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
                <div className="w-3 h-3 bg-primary/20 rounded-sm border border-primary/30"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-secondary/20 rounded-sm border border-secondary/30"></div>
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
      </div>
    </div>
  );
};

export default DayView;
