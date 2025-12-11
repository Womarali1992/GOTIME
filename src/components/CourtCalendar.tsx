
import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSlot, Court } from "@/lib/types";
import { dataService } from "@/lib/services/data-service";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-mobile";
import CourtHeader from "./CourtHeader";

interface CourtCalendarProps {
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
  selectedDate?: Date;
  // Navigation props
  weekOffset?: number;
  onWeekChange?: (offset: number) => void;
  viewDays?: number;
  onViewDaysChange?: (days: number) => void;
  legendFilters?: {
    available: boolean;
    clinic: boolean;
    myReservations: boolean;
  };
  onLegendFiltersChange?: (filters: { available: boolean; clinic: boolean; myReservations: boolean; }) => void;
  selectedCourt?: string | undefined;
  onCourtChange?: (courtId: string | undefined) => void;
  onDateChange?: (date: Date) => void;
}

const CourtCalendar = ({ 
  onSelectTimeSlot, 
  selectedDate: propSelectedDate,
  weekOffset = 0,
  onWeekChange,
  viewDays = 0,
  onViewDaysChange,
  legendFilters = { available: true, clinic: true, myReservations: true },
  onLegendFiltersChange,
  selectedCourt: propSelectedCourt,
  onCourtChange,
  onDateChange
}: CourtCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(propSelectedDate || new Date());
  const [selectedCourt, setSelectedCourt] = useState<string | undefined>(propSelectedCourt || undefined);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Update internal selectedDate when prop changes
  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  // Update internal selectedCourt when prop changes
  useEffect(() => {
    setSelectedCourt(propSelectedCourt);
  }, [propSelectedCourt]);

  // Handle date selection with callback to parent
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateChange) {
      onDateChange(date);
    }
  };

  // Handle court selection with callback to parent
  const handleCourtSelect = (courtId: string | undefined) => {
    setSelectedCourt(courtId);
    if (onCourtChange) {
      onCourtChange(courtId);
    }
  };

  // Generate time slots for the selected date when it changes
  const [currentDateSlots, setCurrentDateSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const slots = dataService.timeSlotService.getTimeSlotsForDate(formattedDate);
      setCurrentDateSlots(slots);
    }
  }, [selectedDate]);

  // Format the date as YYYY-MM-DD for our data functions
  const formattedDate = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  // Get all time slots for the selected date and court (not just available ones)
  const getAllTimeSlots = (date: string, courtId?: string): TimeSlot[] => {
    // Use currentDateSlots if available, otherwise get from service
    const slotsToFilter = currentDateSlots.length > 0 
      ? currentDateSlots 
      : dataService.timeSlotService.getTimeSlotsForDate(date);
    return slotsToFilter.filter(
      slot => slot.date === date && (!courtId || slot.courtId === courtId)
    );
  };

  // Get all time slots with reservation status for the selected date and court
  const getTimeSlotsWithStatus = (date: string, courtId?: string) => {
    return dataService.timeSlotService.getTimeSlotsForDate(date, courtId);
  };

  // Get all time slots for the selected date and court
  const allSlots = getAllTimeSlots(formattedDate, selectedCourt);
  
  // Get time slots with status for better reservation handling
  const slotsWithStatus = getTimeSlotsWithStatus(formattedDate, selectedCourt);
  
  // Group time slots by court
  const slotsByCourtId: Record<string, TimeSlot[]> = {};
  
  allSlots.forEach(slot => {
    if (!slotsByCourtId[slot.courtId]) {
      slotsByCourtId[slot.courtId] = [];
    }
    slotsByCourtId[slot.courtId].push(slot);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Note: CourtHeader is now handled by parent HomeSchedulerView to avoid duplication */}
        


        <div className={`grid gap-4 sm:gap-6 md:gap-8 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-12'}`}>
          {/* Calendar Sidebar - BOLD DESIGN */}
          <div className={isMobile ? 'w-full' : 'lg:col-span-4'}>
            <Card className="sticky top-6 bg-white border-0 w-full calendar-container">
              <CardHeader className="text-center pb-4 pt-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <CalendarIcon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                  <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Select Date</h2>
                </div>
                <p className="text-sm sm:text-base text-foreground/80 font-semibold">
                  Choose when you'd like to play
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 w-full bg-white">
                <div className="w-full overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="w-full bg-white"
                    disabled={{ before: new Date() }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className={`space-y-4 sm:space-y-6 ${isMobile ? 'w-full' : 'lg:col-span-8'}`}>




            {/* Court Time Slots */}
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(slotsByCourtId).map(([courtId, slots]) => {
                const court = dataService.getCourtById(courtId);
                return (
                  <Card key={courtId} className="overflow-hidden bg-card/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-4 sm:p-6 border-b border-border/20">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/20 rounded-lg">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="text-center sm:text-left">
                            <h3 className="text-lg sm:text-xl font-bold text-foreground">
                              {court?.name}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {court?.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-end">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            court?.indoor
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {court?.indoor ? "Indoor" : "Outdoor"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-2 sm:space-y-3">
                                              {slots.map(slot => {
                        const isClinic = slot.type === 'clinic';
                        const clinic = isClinic ? dataService.clinicService.getClinicById(slot.clinicId!) : null;
                        const coach = clinic ? dataService.coachService.getCoachById(clinic.coachId) : null;
                        
                        // Use centralized status determination - get the enriched slot with status
                        const enrichedSlot = dataService.timeSlotService.getTimeSlotsForDate(slot.date, slot.courtId)
                          .find(s => s.id === slot.id);
                          
                          let statusText = "Available";
                          let statusClass = "bg-green-500/20 text-green-700 border border-green-500/30";
                          let isClickable = true;
                          let statusIcon = "🎾";
                          
                          if (enrichedSlot) {
                            statusText = enrichedSlot.status.charAt(0).toUpperCase() + enrichedSlot.status.slice(1);
                            
                            if (enrichedSlot.isBlocked) {
                              statusClass = "bg-gray-500/30 text-gray-100 border border-gray-500/50";
                              isClickable = false;
                              statusIcon = "🚫";
                            } else if (enrichedSlot.isClinic) {
                              statusClass = "bg-yellow-500/30 text-yellow-800 border border-yellow-500/50";
                              statusIcon = "🏆";
                            } else if (enrichedSlot.isReserved) {
                              statusClass = "bg-blue-500/20 text-blue-700 border border-blue-500/30";
                              isClickable = false;
                              statusIcon = "✅";
                            }
                          }
                          
                          return (
                            <div
                              key={slot.id}
                              className={`min-h-[3rem] sm:min-h-[4rem] rounded-sm flex items-center px-3 sm:px-4 transition-all duration-300 ${statusClass} ${
                                isClickable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed'
                              }`}
                              onClick={() => isClickable && onSelectTimeSlot(slot)}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-4">
                                <div className="min-w-0 flex-1">
                                  {clinic ? (
                                    <div className="text-center sm:text-left">
                                      <span className="font-semibold text-sm sm:text-base flex items-center gap-2 justify-center sm:justify-start">
                                        🏆 {clinic.name}
                                      </span>
                                      <div className="text-xs sm:text-sm text-muted-foreground">
                                        Coach: {coach?.name}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-sm sm:text-base font-medium text-center sm:text-left block">
                                      {statusText}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 justify-center">
                                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                                  <span className="text-lg sm:text-xl font-bold whitespace-nowrap">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                </div>

                                <div className="text-sm shrink-0 min-w-[60px] sm:min-w-[80px] text-center">
                                  {statusIcon}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {Object.keys(slotsByCourtId).length === 0 && (
                <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <div className="text-4xl sm:text-6xl mb-4">📅</div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Courts Available</h3>
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      No courts found for the selected date.
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Please select another date or check back later.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Enhanced Legend */}
              <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-semibold text-center mb-4">Legend</h4>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500/20 border border-green-500/30"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500/30 border border-yellow-500/50"></div>
                      <span>Clinic</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500/30 border border-gray-500/50"></div>
                      <span>Blocked</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtCalendar;
