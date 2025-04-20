
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { TimeSlot, Court } from "@/lib/types";
import { getAvailableTimeSlots, courts } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface CourtCalendarProps {
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
}

const CourtCalendar = ({ onSelectTimeSlot }: CourtCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string | undefined>(undefined);
  
  // Format the date as YYYY-MM-DD for our data functions
  const formattedDate = selectedDate 
    ? format(selectedDate, "yyyy-MM-dd") 
    : format(new Date(), "yyyy-MM-dd");
  
  // Get available time slots for the selected date and court
  const availableSlots = getAvailableTimeSlots(formattedDate, selectedCourt);
  
  // Group time slots by court
  const slotsByCourtId: Record<string, TimeSlot[]> = {};
  
  availableSlots.forEach(slot => {
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
                      {slots.map(slot => (
                        <Button
                          key={slot.id}
                          variant="outline"
                          className="court-slot h-16 flex flex-col items-center justify-center"
                          onClick={() => onSelectTimeSlot(slot)}
                        >
                          <span className="text-sm font-medium">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Available
                          </span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {Object.keys(slotsByCourtId).length === 0 && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No available courts found for the selected date.</p>
                <p className="text-sm text-muted-foreground mt-2">Please select another date or check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtCalendar;
