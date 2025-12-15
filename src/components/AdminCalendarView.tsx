
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MapPin, Clock, Users, Check, X, Award, Circle } from "lucide-react";
import { format } from "date-fns";
import { apiDataService } from "@/lib/services/api-data-service";

interface AdminCalendarViewProps {
  onAddUserToReservation?: (timeSlotId: string) => void;
  refreshKey?: number;
}

const AdminCalendarView = ({ onAddUserToReservation, refreshKey = 0 }: AdminCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDateSlots, setCurrentDateSlots] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [operatingHours, setOperatingHours] = useState<any[]>([]);
  const [displayDates, setDisplayDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized load functions to prevent recreation on every render
  const loadCourts = useCallback(async () => {
    try {
      const loadedCourts = await apiDataService.getAllCourts();
      console.log('[AdminCalendarView] Loaded courts:', loadedCourts.length);
      setCourts(loadedCourts);
    } catch (error) {
      console.error("Error loading courts:", error);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await apiDataService.getReservationSettings();
      console.log('[AdminCalendarView] Loaded settings:', settings);
      if (settings?.operatingHours) {
        console.log('[AdminCalendarView] Operating hours:', settings.operatingHours);
        setOperatingHours(settings.operatingHours);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }, []);

  // Load initial data only once on mount and when refreshKey changes
  useEffect(() => {
    console.log('[AdminCalendarView] Mounting component, refreshKey:', refreshKey);
    const loadInitialData = async () => {
      setIsLoading(true);
      console.log('[AdminCalendarView] Loading courts and settings...');
      await Promise.all([loadCourts(), loadSettings()]);
      console.log('[AdminCalendarView] Initial data loaded');
      setIsLoading(false);
    };
    loadInitialData();
  }, [refreshKey, loadCourts, loadSettings]);

  // Calculate display dates - memoized to prevent unnecessary recalculations
  const calculatedDisplayDates = useMemo(() => {
    if (operatingHours.length === 0) return [];

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dates = Array.from({ length: 14 }, (_, offset) => {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + offset);
      return date;
    }).filter(date => {
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];
      const daySettings = operatingHours.find(d => d.dayOfWeek === dayName);
      return daySettings && daySettings.isOpen;
    }).slice(0, 3);

    return dates;
  }, [selectedDate, operatingHours]);

  // Update displayDates when calculated dates change
  useEffect(() => {
    console.log('[AdminCalendarView] Calculated display dates:', calculatedDisplayDates.length);
    setDisplayDates(prev => {
      // Only update if dates actually changed
      if (prev.length !== calculatedDisplayDates.length) {
        console.log('[AdminCalendarView] Display dates length changed:', prev.length, '->', calculatedDisplayDates.length);
        return calculatedDisplayDates;
      }
      const hasChanged = calculatedDisplayDates.some((date, i) =>
        date.getTime() !== prev[i]?.getTime()
      );
      if (hasChanged) {
        console.log('[AdminCalendarView] Display dates changed');
      }
      return hasChanged ? calculatedDisplayDates : prev;
    });
  }, [calculatedDisplayDates]);

  // Load time slots for display dates - memoized callback
  const loadTimeSlots = useCallback(async () => {
    if (displayDates.length === 0) return;

    try {
      const allSlots = await Promise.all(
        displayDates.map(date => {
          const formattedDate = format(date, "yyyy-MM-dd");
          return apiDataService.getTimeSlotsForDate(formattedDate);
        })
      );

      const flatSlots = allSlots.flat();
      console.log('[AdminCalendarView] Loaded time slots:', flatSlots.length);
      console.log('[AdminCalendarView] Sample slot:', flatSlots[0]);
      console.log('[AdminCalendarView] Status breakdown:', flatSlots.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      setCurrentDateSlots(flatSlots);
    } catch (error) {
      console.error("Error loading time slots:", error);
    }
  }, [displayDates]);

  // Load time slots when display dates change or refreshKey updates
  useEffect(() => {
    loadTimeSlots();
  }, [loadTimeSlots, refreshKey]);

  // Memoized helper functions
  const isSlotReserved = useCallback((slotId: string) => {
    const slotWithStatus = currentDateSlots.find(slot => slot.id === slotId);
    return slotWithStatus ? slotWithStatus.isReserved : false;
  }, [currentDateSlots]);

  const getSlotColor = useCallback((slotId: string) => {
    const slotWithStatus = currentDateSlots.find(slot => slot.id === slotId);
    if (!slotWithStatus) return "bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300 hover:border-gray-400";

    if (slotWithStatus.isBlocked) return "bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:border-red-400";
    if (slotWithStatus.isClinic) return "bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300 hover:border-amber-400";
    if (slotWithStatus.isReserved) return "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-400 hover:border-blue-500";
    return "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-400 hover:border-emerald-500";
  }, [currentDateSlots]);

  const getSlotIconComponent = useCallback((slotId: string) => {
    const slotWithStatus = currentDateSlots.find(slot => slot.id === slotId);
    if (!slotWithStatus) return <X className="h-5 w-5 text-gray-500" />;

    if (slotWithStatus.isBlocked) return <X className="h-5 w-5 text-red-600" />;
    if (slotWithStatus.isClinic) return <Award className="h-5 w-5 text-amber-600" />;
    if (slotWithStatus.isReserved) return <Check className="h-5 w-5 text-blue-600" />;
    return <Circle className="h-5 w-5 text-emerald-600 fill-emerald-600" />;
  }, [currentDateSlots]);

  const getSlotStatus = useCallback((slotId: string) => {
    const slotWithStatus = currentDateSlots.find(slot => slot.id === slotId);
    if (!slotWithStatus) return "Unknown";
    return slotWithStatus.status.charAt(0).toUpperCase() + slotWithStatus.status.slice(1);
  }, [currentDateSlots]);

  const getSlotTextColor = useCallback((slotId: string) => {
    const slotWithStatus = currentDateSlots.find(slot => slot.id === slotId);
    if (!slotWithStatus) return "text-gray-700";

    if (slotWithStatus.isBlocked) return "text-red-700";
    if (slotWithStatus.isClinic) return "text-amber-700";
    if (slotWithStatus.isReserved) return "text-blue-700";
    return "text-emerald-700";
  }, [currentDateSlots]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Instruction Banner */}
        <div className="text-sm bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg">
          💡 <strong>Tip:</strong> Click on any available (green) or reserved (blue) time slot to book users for that court
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-6">
          {/* Calendar Sidebar */}
          <Card className="lg:sticky lg:top-6 h-fit gradient-card shadow-lg">
            <CardHeader className="text-center pb-3 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b border-border/30">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Date Selector</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a date to view schedules
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-lg border-0"
                classNames={{
                  months: "flex flex-col space-y-4",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-base font-bold",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-9 w-9 bg-primary/10 hover:bg-primary/20 text-primary border-0 rounded-lg transition-colors",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-11 font-semibold text-xs",
                  row: "flex w-full mt-2",
                  cell: "h-11 w-11 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-muted/30 [&:has([aria-selected])]:bg-muted/30 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-11 w-11 p-0 font-medium aria-selected:opacity-100 hover:bg-primary/10 rounded-lg transition-all",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary shadow-md",
                  day_today: "bg-secondary/30 text-secondary-foreground font-bold border border-secondary",
                  day_outside: "text-muted-foreground opacity-50 aria-selected:bg-muted/30 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-muted/30 aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </CardContent>
          </Card>

          {/* Schedule Content */}
          <Card className="gradient-card shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b border-border/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  {format(selectedDate, "MMMM d, yyyy")}
                </h3>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{format(selectedDate, "EEE")}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Court Headers */}
              <div className="grid grid-cols-[140px_repeat(3,1fr)] sm:grid-cols-[160px_repeat(3,1fr)] gap-2 sm:gap-3 mb-6">
                <div className="flex items-center justify-center">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time</div>
                </div>
                {courts.slice(0, 3).map((court, idx) => (
                  <div key={court.id} className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg border border-border/30 shadow-sm hover:shadow-md transition-all">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="text-sm sm:text-base font-bold">{court.name}</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{court.location}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      court.indoor
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {court.indoor ? "Indoor" : "Outdoor"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dates Grid */}
              <div className="space-y-6">
                {displayDates.map((date) => {
                  const formattedDate = format(date, "yyyy-MM-dd");
                  const displayCourts = courts.slice(0, 3);
                  const allSlotsForDate = currentDateSlots.filter(s => s.date === formattedDate);
                  const allTimes = [...new Set(allSlotsForDate.map(slot => slot.startTime))].sort();

                  return (
                    <div key={formattedDate} className="space-y-3">
                      {/* Date Header */}
                      <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-lg border border-border/30 shadow-sm">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <CalendarIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-bold">{format(date, "MMMM d, yyyy")}</span>
                          <span className="text-sm text-muted-foreground">({format(date, "EEEE")})</span>
                        </div>
                      </div>

                      {/* Time Slots for this date */}
                      <div className="space-y-2">
                        {allTimes.map((time) => (
                          <div key={`${formattedDate}-${time}`} className="grid grid-cols-[140px_repeat(3,1fr)] sm:grid-cols-[160px_repeat(3,1fr)] gap-2 sm:gap-3">
                            {/* Time Label */}
                            <div className="flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg border border-border/30">
                              <div className="text-center space-y-1">
                                <Clock className="h-4 w-4 mx-auto text-primary" />
                                <span className="text-xs sm:text-sm font-bold block">{time}</span>
                              </div>
                            </div>

                            {/* Court Columns for this time slot */}
                            {displayCourts.map((court) => {
                              const slot = allSlotsForDate.find(
                                s => s.courtId === court.id && s.startTime === time
                              );

                              if (!slot) {
                                return (
                                  <div key={court.id} className="h-20 sm:h-24 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-border/30">
                                    <span className="text-xs text-muted-foreground font-medium">No slot</span>
                                  </div>
                                );
                              }

                              return (
                                <Button
                                  key={slot.id}
                                  variant="outline"
                                  className={`h-20 sm:h-24 flex flex-col items-center justify-center gap-2 ${getSlotColor(
                                    slot.id
                                  )} border-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95`}
                                  onClick={() => {
                                    if (onAddUserToReservation) {
                                      onAddUserToReservation(slot.id);
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-center">
                                    {getSlotIconComponent(slot.id)}
                                  </div>
                                  <span className={`text-xs sm:text-sm font-bold ${getSlotTextColor(slot.id)}`}>
                                    {getSlotStatus(slot.id)}
                                  </span>
                                </Button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <Card className="mt-8 bg-muted/20 border border-border/30 shadow-sm">
                <CardContent className="p-6">
                  <h4 className="text-base sm:text-lg font-bold text-center mb-4">Status Legend</h4>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg border border-emerald-400 shadow-sm">
                      <Circle className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">Available</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-400 shadow-sm">
                      <Check className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">Reserved</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg border border-amber-300 shadow-sm">
                      <Award className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-700">Clinic</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-300 shadow-sm">
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">Blocked</span>
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
