
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { TimeSlot, Court } from "@/lib/types";
import { timeSlots, courts, clinics, coaches, getTimeSlotsForDate } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface CourtCalendarProps {
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
}

const CourtCalendar = ({ onSelectTimeSlot }: CourtCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string | undefined>(undefined);
  
  // Generate time slots for the selected date when it changes
  useEffect(() => {
    if (selectedDate) {
      getTimeSlotsForDate(selectedDate);
    }
  }, [selectedDate]);
  
  // Format the date as YYYY-MM-DD for our data functions
  const formattedDate = selectedDate 
    ? format(selectedDate, "yyyy-MM-dd") 
    : format(new Date(), "yyyy-MM-dd");
  
  // Get all time slots for the selected date and court (not just available ones)
  const getAllTimeSlots = (date: string, courtId?: string): TimeSlot[] => {
    return timeSlots.filter(
      slot => slot.date === date && (!courtId || slot.courtId === courtId)
    );
  };
  
  // Get all time slots for the selected date and court
  const allSlots = getAllTimeSlots(formattedDate, selectedCourt);
  
  // Group time slots by court
  const slotsByCourtId: Record<string, TimeSlot[]> = {};
  
  allSlots.forEach(slot => {
    if (!slotsByCourtId[slot.courtId]) {
      slotsByCourtId[slot.courtId] = [];
    }
    slotsByCourtId[slot.courtId].push(slot);
  });

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-auto">
          <CardContent className="pt-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border pointer-events-auto"
              disabled={{ before: new Date() }}
            />
          </CardContent>
        </Card>
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCourt === undefined ? "default" : "outline"}
              onClick={() => setSelectedCourt(undefined)}
            >
              All Courts
            </Button>
            
            {courts.map(court => (
              <Button
                key={court.id}
                variant={selectedCourt === court.id ? "default" : "outline"}
                onClick={() => setSelectedCourt(court.id)}
              >
                {court.name}
              </Button>
            ))}
          </div>
          
          <div className="space-y-6">
            {Object.entries(slotsByCourtId).map(([courtId, slots]) => {
              const court = courts.find(c => c.id === courtId);
              return (
                <Card key={courtId} className="overflow-hidden">
                  <div className="bg-muted p-4 flex justify-between items-center">
                    <h3 className="font-medium">
                      {court?.name} - {court?.location}
                    </h3>
                    <span className="bg-secondary text-white text-xs px-2 py-1 rounded-full">
                      {court?.indoor ? "Indoor" : "Outdoor"}
                    </span>
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {slots.map(slot => {
                        const isClinic = slot.type === 'clinic';
                        const clinic = isClinic ? clinics.find(c => c.id === slot.clinicId) : null;
                        const coach = clinic ? coaches.find(c => c.id === clinic.coachId) : null;
                        
                        // Determine slot status and styling
                        let statusText = "Available";
                        let statusClass = "bg-primary/20 border-primary/300 hover:bg-primary/100";
                        let isClickable = true;
                        
                        if (isClinic) {
                          statusText = "Clinic";
                          statusClass = "bg-yellow-50 border-yellow-300 hover:bg-yellow-100";
                        } else if (slot.blocked) {
                          statusText = "Blocked";
                          statusClass = "bg-gray-500/20 border-gray-400 text-gray-600";
                          isClickable = false;
                        } else if (!slot.available) {
                          statusText = "Reserved";
                          statusClass = "bg-secondary/20 border-secondary/300 text-secondary-foreground";
                          isClickable = false;
                        }
                        
                        return (
                          <Button
                            key={slot.id}
                            variant="outline"
                            className={`court-slot h-20 flex flex-col items-center justify-center ${statusClass}`}
                            onClick={() => isClickable && onSelectTimeSlot(slot)}
                            disabled={!isClickable}
                          >
                            <span className="text-sm font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            {isClinic ? (
                              <div className="text-center">
                                <span className="text-xs text-yellow-700 font-medium">
                                  {clinic?.name}
                                </span>
                                <span className="text-xs text-yellow-600 block">
                                  Coach: {coach?.name}
                                </span>
                                <span className="text-xs text-yellow-800 font-semibold">
                                  ${clinic?.price}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {statusText}
                              </span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {Object.keys(slotsByCourtId).length === 0 && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No courts found for the selected date.</p>
                <p className="text-sm text-muted-foreground mt-2">Please select another date or check back later.</p>
              </div>
            )}
            
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
                  <div className="w-3 h-3 bg-gray-500/20 rounded-sm border border-gray-400"></div>
                  <span>Blocked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtCalendar;
