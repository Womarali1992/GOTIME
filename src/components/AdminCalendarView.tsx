
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar as CalendarIcon, LayoutGrid, LayoutList } from "lucide-react";
import { format } from "date-fns";
import { timeSlots, courts, reservations } from "@/lib/data";

const AdminCalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Get all slots for the selected date
  const slotsForDate = timeSlots.filter(
    (slot) => slot.date === format(selectedDate, "yyyy-MM-dd")
  );

  // Check if a slot is reserved
  const isSlotReserved = (slotId: string) => {
    return reservations.some((res) => res.timeSlotId === slotId);
  };

  const getSlotColor = (slotId: string, available: boolean) => {
    if (!available) return "bg-gray-200 text-gray-500"; // Blocked
    if (isSlotReserved(slotId)) return "bg-secondary/20 text-secondary"; // Reserved
    return "bg-primary/20 text-primary"; // Available
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Calendar View
        </h2>
        <div className="flex items-center gap-4">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as "month" | "week")}
            className="border border-border/50 bg-background/95"
          >
            <ToggleGroupItem value="month" aria-label="Month view">
              <CalendarIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5">
          <div className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="pointer-events-auto"
            />
          </div>
        </Card>

        <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
            <div className="space-y-6">
              {courts.map((court) => {
                const courtSlots = slotsForDate.filter(
                  (slot) => slot.courtId === court.id
                );

                return (
                  <div key={court.id} className="space-y-2">
                    <h4 className="font-medium">{court.name}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {courtSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant="outline"
                          className={`h-16 flex flex-col items-center justify-center border border-border/50 transition-all duration-300 ${getSlotColor(
                            slot.id,
                            slot.available
                          )}`}
                        >
                          <span className="text-sm font-medium">
                            {slot.startTime}
                          </span>
                          <span className="text-xs">
                            {isSlotReserved(slot.id)
                              ? "Reserved"
                              : slot.available
                              ? "Available"
                              : "Blocked"}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminCalendarView;
