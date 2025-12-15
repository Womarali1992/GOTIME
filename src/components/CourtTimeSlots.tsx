import { format, addDays, subDays } from "date-fns";
import { Clock, GraduationCap, StickyNote, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Court, TimeSlot, Reservation, Coach, Clinic, Comment } from "@/lib/types";

type ReservationCommentContext = {
  id: string;
  comments: Comment[];
  playerName: string;
  playerEmail: string;
  date?: string;
  time?: string;
  court?: string;
};

type TimeSlotCommentContext = {
  id: string;
  comments: Comment[];
  date: string;
  time: string;
  court?: string;
};

interface CourtTimeSlotsProps {
  courts: Court[];
  timeSlots: TimeSlot[];
  reservations: Reservation[];
  coaches: Coach[];
  clinics: Clinic[];
  onAddUserToReservationRequested: (timeSlotId?: string) => void;
  onOpenReservationComments: (context: ReservationCommentContext) => void;
  onOpenTimeSlotComments: (context: TimeSlotCommentContext) => void;
  onBlockTimeSlot: (timeSlotId: string) => void;
  onUnblockTimeSlot: (timeSlotId: string) => void;
  onCreateClinicForTimeSlot: (timeSlotId: string) => void;
  onConvertToSocial: (reservationId: string) => void;
}

const CourtTimeSlots = ({
  courts,
  timeSlots,
  reservations,
  coaches,
  clinics,
  onAddUserToReservationRequested,
  onOpenReservationComments,
  onOpenTimeSlotComments,
  onBlockTimeSlot,
  onUnblockTimeSlot,
  onCreateClinicForTimeSlot,
  onConvertToSocial,
}: CourtTimeSlotsProps) => {
  // Filter state
  const [selectedCourt, setSelectedCourt] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [operatingHours, setOperatingHours] = useState<any[]>([]);

  // Navigation state for current date
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Load operating hours from backend (only once on mount)
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/settings');
        if (response.ok && isMounted) {
          const settings = await response.json();
          setOperatingHours(settings.operatingHours || []);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Group all time slots by date
  const slotsByDate: Record<string, TimeSlot[]> = {};
  timeSlots.forEach((slot) => {
    if (!slotsByDate[slot.date]) {
      slotsByDate[slot.date] = [];
    }
    slotsByDate[slot.date].push(slot);
  });

  const sortedDates = Object.keys(slotsByDate).sort();

  // Filter dates based on day view, current date navigation, and operating hours
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDateString = currentDate.toISOString().split('T')[0];

  const filteredDates = [currentDateString]
    .filter(date => sortedDates.includes(date))
    .filter(dateStr => {
    // Filter out closed days based on operating hours
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek];
    const daySettings = operatingHours.find(d => d.dayOfWeek === dayName);
    return daySettings && daySettings.isOpen;
  }).slice(0, 1); // Single-day view for this overview

  // Navigation functions
  const navigatePrevious = () => {
    const previousDate = subDays(currentDate, 1);
    // Don't go before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (previousDate >= today) {
      setCurrentDate(previousDate);
    }
  };

  const navigateNext = () => {
    const nextDate = addDays(currentDate, 1);
    setCurrentDate(nextDate);
  };

  const getClinicForSlot = (slot: TimeSlot) => {
    if ((slot as any).type === "clinic" && (slot as any).clinicId) {
      return clinics.find((clinic) => clinic.id === (slot as any).clinicId) || null;
    }
    return null;
  };

  const getSlotStatus = (slot: TimeSlot) => {
    const reservation = reservations.find((r) => r.timeSlotId === slot.id);
    const clinic = getClinicForSlot(slot);
    
    if (clinic) return "clinic";
    if (reservation) return "reserved";
    if ((slot as any).blocked) return "blocked";
    if ((slot as any).available) return "available";
    return "unavailable";
  };

  // Filter courts and slots based on selected filters
  const filteredCourts = selectedCourt === "all" 
    ? courts 
    : courts.filter(court => court.id === selectedCourt);

  const shouldShowSlot = (slot: TimeSlot) => {
    if (selectedStatus === "all") return true;
    return getSlotStatus(slot) === selectedStatus;
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-3 w-full">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold leading-tight text-foreground">Time Slots Overview</h2>
            <div className="text-sm text-muted-foreground mt-1">
              {reservations.filter((r) => r.comments && r.comments.length > 0).length} reservation
              {reservations.filter((r) => r.comments && r.comments.length > 0).length !== 1 ? "s" : ""} with notes
            </div>
          </div>
          
          {/* Navigation row separated to allow larger date text */}
          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={navigatePrevious}
              disabled={(() => {
                const previousDate = subDays(currentDate, 1);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return previousDate < today;
              })()}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-2xl sm:text-4xl font-semibold text-foreground min-w-[160px] text-center leading-tight">
              {format(currentDate, "MMM d, yyyy")}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            className="bg-primary hover:bg-primary/90 text-sm sm:text-base"
            onClick={() => onAddUserToReservationRequested("")}
          >
            Add User to Reservation
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-sm sm:text-base">Add Time Slot</Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4 sm:mb-6 p-3 sm:p-4 bg-card border border-border rounded-lg">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
          {/* Court Filter */}
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-xs font-medium text-foreground">Court</label>
            <Select value={selectedCourt} onValueChange={setSelectedCourt}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select court" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-xs font-medium text-foreground">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="clinic">Clinic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        💡 Click on available time slots or clinics to add users to them. You can also use the "Add User to Reservation" button above.
      </div>

      {filteredCourts.map((court) => (
        <Card key={court.id} className="border border-input bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">{court.name}</CardTitle>
            <CardDescription>
              <Badge
                variant={court.indoor ? "secondary" : "outline"}
                className={court.indoor ? "bg-secondary/20" : "border-primary/20"}
              >
                {court.indoor ? "Indoor" : "Outdoor"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDates.map((date) => {
                const courtSlots = slotsByDate[date]
                  ?.filter((slot) => slot.courtId === court.id)
                  ?.filter(shouldShowSlot) || [];
                if (courtSlots.length === 0) return null;

                return (
                  <div key={date} className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {format(new Date(date), "MMM d")}
                    </h3>
                    <div className="space-y-2">
                      {courtSlots.map((slot) => {
                        const reservation = reservations.find((r) => r.timeSlotId === slot.id);
                        const clinic = getClinicForSlot(slot);

                        return (
                          <div
                            key={slot.id}
                            className={`min-h-[4rem] rounded-lg p-2 sm:p-4 transition-all duration-300 hover:scale-[1.01] ${
                              clinic
                                ? "bg-yellow-500/30 text-yellow-800 border border-yellow-500/50 cursor-pointer"
                                : reservation
                                ? "bg-secondary/20 text-secondary-foreground"
                                : (slot as any).blocked
                                ? "bg-red-500/20 text-red-800 border border-red-500/50"
                                : (slot as any).available
                                ? "bg-primary/20 text-primary-foreground cursor-pointer"
                                : "bg-muted/80 text-muted-foreground"
                            }`}
                            onClick={() => {
                              if ((slot as any).available && !(slot as any).blocked) {
                                onAddUserToReservationRequested(slot.id);
                              }
                            }}
                          >
                            <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                              <div className="flex items-center gap-1 sm:gap-2 sm:order-2 sm:flex-1 sm:justify-center">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-foreground" />
                                <span className="text-sm sm:text-xl font-bold sm:font-extrabold text-foreground">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>

                              <div className="sm:order-1 sm:flex-1">
                                {clinic ? (
                                  <div>
                                    <span className="font-semibold text-base">{clinic.name}</span>
                                    <div className="text-sm text-muted-foreground">
                                      Coach: {coaches.find((c) => c.id === clinic.coachId)?.name}
                                    </div>
                                  </div>
                                ) : reservation ? (
                                  <div>
                                    <span className="font-semibold text-base">{reservation.playerName}</span>
                                    <div className="text-sm text-muted-foreground">
                                      ({reservation.players} player{reservation.players !== 1 ? "s" : ""})
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-base font-medium text-foreground">
                                      {(slot as any).available ? "Available" : "Blocked"}
                                    </span>
                                    {(slot as any).comments && (slot as any).comments.length > 0 && (
                                      <div className="text-sm text-muted-foreground mt-1">
                                        <span className="text-xs font-medium text-blue-600">
                                          {(slot as any).comments.length} comment
                                          {(slot as any).comments.length !== 1 ? "s" : ""}:
                                        </span>
                                        <span className="ml-1 break-words">{(slot as any).comments[(slot as any).comments.length - 1].text}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 sm:order-3 sm:flex-shrink-0">
                                {clinic ? (
                                  <Badge
                                    variant="default"
                                    className="text-xs sm:text-sm shrink-0 min-w-[60px] sm:min-w-[80px] justify-center bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
                                  >
                                    {clinic.name}
                                  </Badge>
                                ) : reservation ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Badge
                                          variant="outline"
                                          className="text-xs sm:text-sm shrink-0 min-w-[60px] sm:min-w-[80px] justify-center bg-blue-500/20 !text-blue-700 border-blue-500/30 cursor-pointer hover:bg-blue-500/30"
                                        >
                                          Reserved
                                          <ChevronDown className="ml-1 h-3 w-3" />
                                        </Badge>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="z-[9999]" sideOffset={5}>
                                        <DropdownMenuItem
                                          onClick={() => onConvertToSocial(reservation.id)}
                                          className="text-orange-600 focus:text-orange-600"
                                        >
                                          Convert to Social
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const courtRef = courts.find((c) => c.id === reservation.courtId);
                                        const timeSlot = timeSlots.find((ts) => ts.id === reservation.timeSlotId);
                                        onOpenReservationComments({
                                          ...reservation,
                                          court: courtRef?.name,
                                          date: timeSlot?.date || "",
                                          time: timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : "",
                                        });
                                      }}
                                      className={`h-8 px-2 sm:px-3 text-xs min-w-[60px] ${
                                        reservation.comments && reservation.comments.length > 0
                                          ? "border-yellow-300 hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800 bg-yellow-100"
                                          : "border-yellow-300 hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800"
                                      }`}
                                    >
                                      <StickyNote className="h-3 w-3 mr-1" />
                                      <span className="hidden sm:inline">
                                        {reservation.comments && reservation.comments.length > 0
                                          ? `Notes (${reservation.comments.length})`
                                          : "Add Notes"}
                                      </span>
                                      <span className="sm:hidden">
                                        {reservation.comments && reservation.comments.length > 0
                                          ? `(${reservation.comments.length})`
                                          : "Notes"}
                                      </span>
                                    </Button>
                                  </div>
                                ) : (slot as any).blocked ? (
                                  <div className="relative">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger>
                                        <Badge
                                          variant="destructive"
                                          className="text-xs sm:text-sm shrink-0 min-w-[60px] sm:min-w-[80px] justify-center cursor-pointer hover:bg-red-500/20"
                                        >
                                          Blocked
                                        </Badge>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="z-[9999]" sideOffset={5}>
                                        <DropdownMenuItem
                                          onClick={() => onUnblockTimeSlot(slot.id)}
                                          className="text-green-600 focus:text-green-600"
                                        >
                                          Unblock
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            const courtRef = courts.find((c) => c.id === slot.courtId);
                                            onOpenTimeSlotComments({
                                              id: slot.id,
                                              comments: (slot as any).comments || [],
                                              court: courtRef?.name,
                                              date: slot.date,
                                              time: `${slot.startTime} - ${slot.endTime}`,
                                            });
                                          }}
                                          className="text-blue-600 focus:text-blue-600"
                                        >
                                          <StickyNote className="h-3 w-3 mr-1" />
                                          Add Note
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    {(slot as any).comments && (slot as any).comments.length > 0 && (
                                      <div className="text-sm text-muted-foreground mt-1">
                                        <span className="text-xs font-medium text-blue-600">
                                          {(slot as any).comments.length} comment
                                          {(slot as any).comments.length !== 1 ? "s" : ""}:
                                        </span>
                                        <span className="ml-1">{(slot as any).comments[(slot as any).comments.length - 1].text}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger>
                                        <Badge
                                          variant="outline"
                                          className="text-xs sm:text-sm shrink-0 min-w-[60px] sm:min-w-[80px] justify-center cursor-pointer bg-green-500/20 !text-green-700 border-green-500/30 hover:bg-green-500/30"
                                        >
                                          Available
                                        </Badge>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="z-[9999]" sideOffset={5}>
                                        <DropdownMenuItem onClick={() => onAddUserToReservationRequested(slot.id)}>
                                          Book
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onCreateClinicForTimeSlot(slot.id)}>
                                          Create Clinic
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => onBlockTimeSlot(slot.id)}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          Block
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default CourtTimeSlots;


