
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar as CalendarIcon, LayoutList, MapPin, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { timeSlots, courts, reservations, getTimeSlotsWithStatusForDate } from "@/lib/data";

const AdminCalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Get all slots for the selected date
  const slotsForDate = timeSlots.filter(
    (slot) => slot.date === format(selectedDate, "yyyy-MM-dd")
  );
  
  // Get time slots with status for better reservation handling
  const slotsWithStatus = getTimeSlotsWithStatusForDate(format(selectedDate, "yyyy-MM-dd"));

  // Check if a slot is reserved using centralized function
  const isSlotReserved = (slotId: string) => {
    const slotWithStatus = slotsWithStatus.find(slot => slot.id === slotId);
    return slotWithStatus ? slotWithStatus.isReserved : false;
  };

  const getSlotColor = (slotId: string, available: boolean) => {
    if (!available) return "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300 text-gray-600"; // Blocked
    if (isSlotReserved(slotId)) return "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 text-blue-700"; // Reserved
    return "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 text-green-800"; // Available
  };

  const getSlotIcon = (slotId: string, available: boolean) => {
    if (!available) return "🚫";
    if (isSlotReserved(slotId)) return "✅";
    return "🎾";
  };

  const getSlotStatus = (slotId: string, available: boolean) => {
    if (!available) return "Blocked";
    if (isSlotReserved(slotId)) return "Reserved";
    return "Available";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-2">
            Admin Calendar
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage court schedules and reservations
          </p>
        </div>

        {/* View Mode Toggle */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => value && setViewMode(value as "month" | "week")}
                className="border-0 bg-muted/30 rounded-xl p-1"
              >
                <ToggleGroupItem 
                  value="month" 
                  aria-label="Month view" 
                  className="hover:bg-primary/20 transition-all duration-200 rounded-lg p-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <CalendarIcon className="h-5 w-5" />
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="week" 
                  aria-label="Week view" 
                  className="hover:bg-primary/20 transition-all duration-200 rounded-lg p-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <LayoutList className="h-5 w-5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
          {/* Calendar Sidebar */}
          <Card className="sticky top-6 bg-card/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Select Date</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose a date to view schedules
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-card to-muted/20"
                classNames={{
                  months: "flex flex-col space-y-4",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-lg font-semibold text-foreground",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-8 w-8 bg-primary/10 hover:bg-primary/20 text-primary border-0 rounded-lg transition-colors",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-10 font-medium text-sm",
                  row: "flex w-full mt-2",
                  cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-muted/30 [&:has([aria-selected])]:bg-muted/30 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-lg transition-colors",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground shadow-lg",
                  day_today: "bg-secondary/20 text-secondary-foreground font-semibold",
                  day_outside: "text-muted-foreground opacity-50 aria-selected:bg-muted/30 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-muted/30 aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </CardContent>
          </Card>

          {/* Schedule Content */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <p className="text-muted-foreground">
                    Court schedules and availability
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>All times in local timezone</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {courts.map((court) => {
                  const courtSlots = slotsForDate.filter(
                    (slot) => slot.courtId === court.id
                  );

                  return (
                    <div key={court.id} className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">{court.name}</h4>
                          <p className="text-sm text-muted-foreground">{court.location}</p>
                        </div>
                        <div className="ml-auto">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            court.indoor 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {court.indoor ? "Indoor" : "Outdoor"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {courtSlots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant="outline"
                            className={`h-20 flex flex-col items-center justify-center ${getSlotColor(
                              slot.id,
                              slot.available
                            )} border-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                          >
                            <div className="text-lg mb-1">{getSlotIcon(slot.id, slot.available)}</div>
                            <span className="text-xs font-semibold">
                              {slot.startTime}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getSlotStatus(slot.id, slot.available)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <Card className="mt-8 bg-muted/20 border-0">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-center mb-4">Status Legend</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-xl">🎾</div>
                      <div>
                        <div className="font-medium text-green-800">Available</div>
                        <div className="text-xs text-green-600">Ready for booking</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xl">✅</div>
                      <div>
                        <div className="font-medium text-blue-800">Reserved</div>
                        <div className="text-xs text-blue-600">Already booked</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xl">🚫</div>
                      <div>
                        <div className="font-medium text-gray-800">Blocked</div>
                        <div className="text-xs text-gray-600">Not available</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendarView;
