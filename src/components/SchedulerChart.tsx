
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { TimeSlot, Court } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import DayView from "./DayView";
import { apiDataService } from "@/lib/services/api-data-service";
// Use API backend data service

interface SchedulerChartProps {
  courts: Court[];
  timeSlots: TimeSlot[];
  onScheduleCourt: (court: Court) => void;
  onDateChange?: (date: Date) => void;
  onAddUserToReservation?: (timeSlotId: string) => void;
}

const SchedulerChart = ({ courts, timeSlots: _timeSlots, onScheduleCourt, onDateChange, onAddUserToReservation }: SchedulerChartProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(3);
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [reservations, setReservations] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [operatingHours, setOperatingHours] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [daysToShow, setDaysToShow] = useState<Date[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      const [loadedReservations, loadedClinics, loadedCoaches, settings] = await Promise.all([
        apiDataService.getAllReservations(),
        apiDataService.getAllClinics(),
        apiDataService.getAllCoaches(),
        apiDataService.getReservationSettings()
      ]);
      setReservations(loadedReservations);
      setClinics(loadedClinics);
      setCoaches(loadedCoaches);
      setOperatingHours(settings?.operatingHours || []);
      setIsInitialized(true);
    };
    loadData();
  }, []);

  // Calculate days to show and load slots when current date changes
  useEffect(() => {
    if (!isInitialized) return;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const days = Array.from({ length: viewDays * 2 }, (_, i) => addDays(currentDate, i))
      .filter(day => {
        // Filter out any days that are in the past
        const today = startOfDay(new Date());
        if (day < today) return false;

        // Filter out closed days based on operating hours
        const dayOfWeek = day.getDay();
        const dayName = dayNames[dayOfWeek];
        const daySettings = operatingHours.find(d => d.dayOfWeek === dayName);

        return daySettings && daySettings.isOpen;
      })
      .slice(0, viewDays); // Take only the first viewDays that pass the filters

    setDaysToShow(days);

    // Load time slots for these days
    const loadSlots = async () => {
      if (days.length === 0) {
        console.log('[SchedulerChart] No days to show yet');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5e3968d2-4334-450b-99ea-38fdb8e4ab73',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SchedulerChart.tsx:78',message:'no days to show',data:{daysLength:days.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return;
      }

      console.log('[SchedulerChart] Loading slots for days:', days.map(d => format(d, 'yyyy-MM-dd')));
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5e3968d2-4334-450b-99ea-38fdb8e4ab73',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SchedulerChart.tsx:83',message:'loading slots start',data:{days:days.map(d=>format(d,'yyyy-MM-dd')),daysCount:days.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const allSlots = await Promise.all(
        days.map(day => {
          const formattedDate = format(day, "yyyy-MM-dd");
          return apiDataService.getTimeSlotsForDate(formattedDate);
        })
      );
      const flatSlots = allSlots.flat();
      console.log('[SchedulerChart] Loaded slots:', flatSlots.length);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5e3968d2-4334-450b-99ea-38fdb8e4ab73',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SchedulerChart.tsx:91',message:'slots loaded',data:{slotsCount:flatSlots.length,firstSlot:flatSlots[0],blockedCount:flatSlots.filter(s=>(s as any).blocked).length,blockedSlots:flatSlots.filter(s=>(s as any).blocked).slice(0,3).map(s=>({id:s.id,blocked:(s as any).blocked,available:s.available}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setTimeSlots(flatSlots);
    };

    loadSlots();
  }, [currentDate, viewDays, isInitialized, operatingHours]);

  // Time range to display (8am to 10pm)
  const startHour = 8;
  const endHour = 22;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Navigate through dates - prevent going to past dates
  const previousDay = () => {
    const newDate = subDays(currentDate, 1);
    const today = startOfDay(new Date());
    if (newDate >= today) {
      setCurrentDate(newDate);
    }
  };
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const today = () => setCurrentDate(startOfDay(new Date()));

  // Handle date header click to open DayView
  const handleDateHeaderClick = (date: Date) => {
    setSelectedDateForDayView(date);
  };

  // Get availability for a specific court, day and hour
  const getSlotStatus = (court: Court, day: Date, hour: number) => {
    const dateString = format(day, "yyyy-MM-dd");
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    const now = new Date();
    const slotDateTime = new Date(day);
    slotDateTime.setHours(hour, 0, 0, 0);
    const isPast = slotDateTime < now;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5e3968d2-4334-450b-99ea-38fdb8e4ab73',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SchedulerChart.tsx:119',message:'getSlotStatus entry',data:{courtId:court.id,dateString,timeString,timeSlotsCount:timeSlots.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Find the time slot
    const slot = timeSlots.find(
      ts => ts.courtId === court.id && ts.date === dateString && ts.startTime === timeString
    );

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5e3968d2-4334-450b-99ea-38fdb8e4ab73',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SchedulerChart.tsx:126',message:'slot lookup result',data:{slotFound:!!slot,slotId:slot?.id,slotBlocked:(slot as any)?.blocked,slotAvailable:slot?.available},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!slot) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5e3968d2-4334-450b-99ea-38fdb8e4ab73',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SchedulerChart.tsx:129',message:'slot not found - returning available fallback',data:{courtId:court.id,dateString,timeString,isPast},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return { available: !isPast, reserved: false, isClinic: false, blocked: false };
    }

    // Check if reserved
    const reservation = reservations.find(r => r.timeSlotId === slot.id);
    const clinic = clinics.find(c => c.id === (slot as any).clinicId);
    const blockedFlag = (slot as any).isBlocked ?? (slot as any).blocked ?? false;
    const slotAvailableFlag = (slot as any).isAvailable ?? (slot as any).available ?? true;

    const result = {
      available: slotAvailableFlag && !reservation && !clinic && !blockedFlag,
      reserved: !!reservation,
      isClinic: !!clinic,
      blocked: blockedFlag
    };

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5e3968d2-4334-450b-99ea-38fdb8e4ab73',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SchedulerChart.tsx:140',message:'slot status result',data:{result,slotBlocked:(slot as any).blocked,slotAvailable:slot.available,hasReservation:!!reservation,hasClinic:!!clinic},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    return result;
  };

  return (
    <>
      {/* Instruction Banner */}
      <div className="text-sm bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg mb-4">
        💡 <strong>Tip:</strong> Click on any time slot to book users for that court
      </div>

      <Card className="gradient-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Changed gradient-text to normal text color for better readability */}
          <CardTitle className="text-lg md:text-xl font-bold text-foreground">
            Court Schedule
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={previousDay}
              disabled={subDays(currentDate, 1) < startOfDay(new Date())}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={today}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={nextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-1 md:px-4 pb-2">
                  <div className="overflow-x-auto">
          <div className="min-w-max relative">
            {/* Court rows with date headers over each column */}
            {courts.map((court) => (
              <div
                key={court.id}
                className={cn(
                  "grid",
                  isMobile ? "mobile-three-columns" : ""
                )}
                style={{
                  gridTemplateColumns: isMobile 
                    ? `150px repeat(${viewDays}, minmax(280px, 1fr))`
                    : `150px repeat(${viewDays}, 1fr)`,
                }}
              >
                {/* Court name */}
                <div className="border-b border-border/30 p-2 flex flex-col justify-center">
                  <span className="font-medium text-foreground">{court.name}</span>
                  <Badge
                    variant={court.indoor ? "secondary" : "outline"}
                    className={cn(
                      "mt-1 text-xs",
                      court.indoor ? "bg-secondary/20" : "border-primary/20"
                    )}
                  >
                    {court.indoor ? "Indoor" : "Outdoor"}
                  </Badge>
                </div>

                {/* Date headers over each column */}
                {daysToShow.map((day) => (
                  <div key={`${court.id}-${day.toString()}`} className="border-b border-border/30 p-2">
                    {/* Date header */}
                    <div
                      className="text-center cursor-pointer transition-colors duration-200 p-3 mb-2 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-0 shadow-lg hover:from-primary/10 hover:via-secondary/10 hover:to-primary/10"
                      onClick={() => handleDateHeaderClick(day)}
                      title="Click to view full day schedule"
                    >
                      <div className="font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                        {format(day, isMobile ? "MMM d" : "EEEE, MMM d")}
                      </div>
                    </div>
                    
                    {/* Time slots */}
                    <div className="space-y-1">
                      {hours.map((hour) => {
                        const { available, reserved, isClinic, blocked } = getSlotStatus(court, day, hour);
                        const dateString = format(day, "yyyy-MM-dd");
                        const timeSlot = timeSlots.find(
                          slot => slot.courtId === court.id &&
                                  slot.date === dateString &&
                                  slot.startTime === `${hour}:00`
                        );

                        return (
                          <div
                            key={`${court.id}-${day.toString()}-${hour}`}
                            className={cn(
                              "h-6 rounded-sm flex items-center px-1 text-sm sm:text-xs court-slot transition-all",
                              isClinic ? "bg-yellow-500/30 text-yellow-800 border border-yellow-500/50" :
                              available ? "bg-primary/20 text-primary" :
                              reserved ? "bg-secondary/20 text-secondary" :
                              "bg-gray-100/20 text-gray-500",
                              !blocked && timeSlot && onAddUserToReservation && "cursor-pointer hover:scale-105 hover:shadow-md"
                            )}
                            onClick={() => {
                              if (!blocked && timeSlot && onAddUserToReservation) {
                                onAddUserToReservation(timeSlot.id);
                              }
                            }}
                            title={!blocked && timeSlot ? "Click to add user to this time slot" : undefined}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {`${hour}:00`}
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onScheduleCourt(court)}
                      className="w-full mt-2 text-xs h-7"
                    >
                      Schedule
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
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
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Click date headers to view full day schedule • Click time slots to book users
            </p>
          </div>
        </CardContent>
      </Card>

      {/* DayView Modal */}
      {selectedDateForDayView && (
        <DayView
          selectedDate={selectedDateForDayView}
          onClose={() => setSelectedDateForDayView(null)}
          courts={courts}
          timeSlots={timeSlots}
          reservations={reservations}
          clinics={clinics}
          coaches={coaches}
          isOpen={selectedDateForDayView !== null}
          onDateChange={setSelectedDateForDayView}
        />
      )}
    </>
  );
};

export default SchedulerChart;

