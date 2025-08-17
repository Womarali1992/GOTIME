import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { TimeSlot, Court } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn, getTimeSlotStatus, getTimeSlotStatusClasses } from "@/lib/utils";
import { courts, timeSlots, reservations, clinics, coaches, getTimeSlotsForDateRange, getClinicById } from "@/lib/data";
import DayOfWeekTabs from "./DayOfWeekTabs";
import DayView from "./DayView";

interface HomeSchedulerViewProps {
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
}

const HomeSchedulerView = ({ onSelectTimeSlot }: HomeSchedulerViewProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [viewDays, setViewDays] = useState<number>(3);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Generate time slots for the current view when dates change
  useEffect(() => {
    const endDate = addDays(currentDate, viewDays - 1);
    getTimeSlotsForDateRange(currentDate, endDate);
  }, [currentDate, viewDays]);

  // Time range to display (8am to 9pm)
  const startHour = 8;
  const endHour = 21;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Calculate days to display based on current date
  // Show viewDays starting from the current date, no past days
  const daysToShow = Array.from({ length: viewDays }, (_, i) => {
    return addDays(currentDate, i);
  }).filter(day => {
    // Filter out any days that are in the past
    const today = startOfDay(new Date());
    return day >= today;
  });

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
  
  // Handle date selection from day-of-week tabs
  const handleDateSelect = (date: Date) => {
    // Only allow selecting current or future dates
    const today = startOfDay(new Date());
    if (date >= today) {
      setCurrentDate(startOfDay(date));
    }
  };

  // Handle date header click to open DayView
  const handleDateHeaderClick = (date: Date) => {
    setSelectedDateForDayView(date);
  };

  // Check if a time slot is in the past
  const isTimeSlotInPast = (day: Date, hour: number) => {
    const now = currentTime;
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < now;
  };

  // Get availability for a specific court, day and hour
  const getSlotStatus = (court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const relevantSlots = timeSlots.filter(
      slot =>
        slot.courtId === court.id &&
        slot.date === formattedDate &&
        parseInt(slot.startTime.split(":")[0]) === hour
    );

    if (relevantSlots.length === 0) {
      // If no slot exists, generate one for this date
      const endDate = addDays(day, 1);
      getTimeSlotsForDateRange(day, endDate);
      
      // Return default status for now - will be updated on next render
      return { available: false, reserved: false, blocked: false, isClinic: false, slot: null };
    }

    const slot = relevantSlots[0];
    return getTimeSlotStatus(slot);
  };

  const handleTimeSlotClick = (court: Court, day: Date, hour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
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

  // Helper function to get the first available time slot for a clinic block
  const getFirstAvailableSlotForBlock = (court: Court, day: Date, startHour: number, endHour: number) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    
    for (let hour = startHour; hour < endHour; hour++) {
      const relevantSlots = timeSlots.filter(
        slot =>
          slot.courtId === court.id &&
          slot.date === formattedDate &&
          parseInt(slot.startTime.split(":")[0]) === hour
      );
      
      if (relevantSlots.length > 0 && relevantSlots[0].available) {
        return relevantSlots[0];
      }
    }
    
    return null;
  };

  return (
    <>
      <Card className="gradient-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-lg md:text-xl font-bold text-foreground">
              Court Schedule View
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Current time: {format(currentTime, "h:mm a")}
            </p>
          </div>
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
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary/20 border border-primary/30 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500/30 border-2 border-yellow-500/50 rounded"></div>
              <span>Clinic (Single Hour)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/30 border-2 border-yellow-500/50 rounded shadow-sm"></div>
              <span>Clinic (Multi-Hour)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary/20 border border-secondary/30 rounded"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500/30 border border-gray-500/30 rounded"></div>
              <span>Blocked</span>
            </div>
          </div>
          
          {/* Day-of-week tabs */}
          <DayOfWeekTabs 
            centeredDate={currentDate} 
            onDateSelect={handleDateSelect} 
          />
          
          <div className="overflow-x-auto">
            <div className="min-w-max relative">
              {/* Court rows with date headers over each column */}
              {courts.map((court) => (
                <div
                  key={court.id}
                  className="grid"
                  style={{
                    gridTemplateColumns: `150px repeat(${viewDays}, 1fr)`,
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
                        className="text-center font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors duration-200 p-2 mb-2 rounded"
                        onClick={() => handleDateHeaderClick(day)}
                        title="Click to view full day schedule"
                      >
                        {format(day, isMobile ? "MMM d" : "EEEE, MMM d")}
                      </div>
                      
                      {/* Time slots */}
                      <div className="space-y-1">
                        {(() => {
                          const timeSlotBlocks: Array<{
                            startHour: number;
                            endHour: number;
                            isClinic: boolean;
                            clinic: any;
                            slot: any;
                            available: boolean;
                            reserved: boolean;
                            blocked: boolean;
                          }> = [];
                          
                          let currentBlock: any = null;
                          
                          // Group consecutive time slots into blocks
                          for (let i = 0; i < hours.length; i++) {
                            const hour = hours[i];
                            const { available, reserved, blocked, isClinic, slot } = getSlotStatus(court, day, hour);
                            const clinic = slot?.clinicId ? getClinicById(slot.clinicId) : null;
                            
                            if (isClinic && clinic) {
                              // If this is a clinic and it's the same clinic as the previous hour
                              if (currentBlock && 
                                  currentBlock.isClinic && 
                                  currentBlock.clinic?.id === clinic.id &&
                                  currentBlock.endHour === hour) {
                                // Extend the current block
                                currentBlock.endHour = hour + 1;
                              } else {
                                // Start a new clinic block
                                if (currentBlock) {
                                  timeSlotBlocks.push(currentBlock);
                                }
                                currentBlock = {
                                  startHour: hour,
                                  endHour: hour + 1,
                                  isClinic: true,
                                  clinic,
                                  slot,
                                  available,
                                  reserved,
                                  blocked
                                };
                              }
                            } else {
                              // If this is not a clinic, add the previous block and create a new single-hour block
                              if (currentBlock) {
                                timeSlotBlocks.push(currentBlock);
                                currentBlock = null;
                              }
                              
                              timeSlotBlocks.push({
                                startHour: hour,
                                endHour: hour + 1,
                                isClinic: false,
                                clinic: null,
                                slot,
                                available,
                                reserved,
                                blocked
                              });
                            }
                          }
                          
                          // Add the last block if it exists
                          if (currentBlock) {
                            timeSlotBlocks.push(currentBlock);
                          }
                          
                          return timeSlotBlocks.map((block, blockIndex) => {
                            const isPast = isTimeSlotInPast(day, block.startHour);
                            const duration = block.endHour - block.startHour;
                            const isMultiHour = duration > 1;
                            
                            return (
                              <div
                                key={`${court.id}-${day.toString()}-${block.startHour}-${block.endHour}`}
                                className={cn(
                                  "text-xs text-center rounded cursor-pointer transition-all duration-200 hover:scale-105 relative p-2",
                                  block.slot ? getTimeSlotStatusClasses(block.slot, isPast) : "bg-gray-100 text-gray-400 cursor-not-allowed",
                                  !isPast && block.available && !block.blocked && !block.reserved && !block.isClinic
                                    ? "hover:bg-primary/20 hover:border-primary/50"
                                    : "",
                                  isMultiHour && "flex items-center justify-center border-2 shadow-sm",
                                  isMultiHour && block.isClinic && "border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-yellow-500/30 hover:from-yellow-500/30 hover:to-yellow-500/40",
                                  isMultiHour && !block.isClinic && "border-gray-300/50 bg-gray-100/50"
                                )}
                                style={{
                                  height: isMultiHour ? `${duration * 2.5}rem` : undefined,
                                  minHeight: isMultiHour ? undefined : "2.5rem",
                                  marginBottom: isMultiHour ? "0.25rem" : undefined
                                }}
                                onClick={() => {
                                  if (block.isClinic && isMultiHour) {
                                    const slot = getFirstAvailableSlotForBlock(court, day, block.startHour, block.endHour);
                                    if (slot) {
                                      onSelectTimeSlot(slot);
                                    }
                                  } else {
                                    handleTimeSlotClick(court, day, block.startHour);
                                  }
                                }}
                                title={
                                  block.clinic 
                                    ? `${block.clinic.name}: ${block.clinic.description} ($${block.clinic.price})`
                                    : `${block.startHour}:00 - ${block.endHour}:00`
                                }
                              >
                                {isMultiHour ? (
                                  <div className="flex flex-col items-center">
                                    <span className="font-medium">{block.startHour}:00</span>
                                    <span className="text-xs opacity-75">to</span>
                                    <span className="font-medium">{block.endHour}:00</span>
                                    {block.isClinic && (
                                      <span className="text-xs mt-1 px-2 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30 text-yellow-800 font-medium">
                                        Clinic
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span>{block.startHour}:00</span>
                                )}
                                
                                {block.isClinic && block.clinic && (
                                  <div className="absolute -top-1 -right-1">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full border border-white"></div>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day View Modal */}
      {selectedDateForDayView && (
        <DayView
          selectedDate={selectedDateForDayView}
          onClose={() => setSelectedDateForDayView(null)}
          courts={courts}
          timeSlots={timeSlots}
          reservations={reservations}
          clinics={clinics}
          coaches={coaches}
        />
      )}
    </>
  );
};

export default HomeSchedulerView;