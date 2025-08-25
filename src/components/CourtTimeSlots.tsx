import { format } from "date-fns";
import { Clock, GraduationCap, StickyNote } from "lucide-react";
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
}: CourtTimeSlotsProps) => {
  // Group all time slots by date
  const slotsByDate: Record<string, TimeSlot[]> = {};
  timeSlots.forEach((slot) => {
    if (!slotsByDate[slot.date]) {
      slotsByDate[slot.date] = [];
    }
    slotsByDate[slot.date].push(slot);
  });

  const sortedDates = Object.keys(slotsByDate).sort();

  const getClinicForSlot = (slot: TimeSlot) => {
    if ((slot as any).type === "clinic" && (slot as any).clinicId) {
      return clinics.find((clinic) => clinic.id === (slot as any).clinicId) || null;
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Time Slots Overview</h2>
          <div className="text-sm text-muted-foreground mt-1">
            {reservations.filter((r) => r.comments && r.comments.length > 0).length} reservation
            {reservations.filter((r) => r.comments && r.comments.length > 0).length !== 1 ? "s" : ""} with notes
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

      <div className="text-sm text-muted-foreground mb-4">
        💡 Click on available time slots or clinics to add users to them. You can also use the "Add User to Reservation" button above.
      </div>

      {courts.map((court) => (
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
              {sortedDates.map((date) => {
                const courtSlots = slotsByDate[date].filter((slot) => slot.courtId === court.id);
                if (courtSlots.length === 0) return null;

                return (
                  <div key={date} className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {format(new Date(date), "EEEE, MMMM d, yyyy")}
                    </h3>
                    <div className="space-y-2">
                      {courtSlots.map((slot) => {
                        const reservation = reservations.find((r) => r.timeSlotId === slot.id);
                        const clinic = getClinicForSlot(slot);

                        return (
                          <div
                            key={slot.id}
                            className={`min-h-[4rem] rounded-lg p-3 sm:p-4 transition-all duration-300 hover:scale-[1.01] ${
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
                              <div className="flex items-center gap-2 sm:order-2 sm:flex-1 sm:justify-center">
                                <Clock className="h-4 w-4 text-foreground" />
                                <span className="text-lg sm:text-xl font-extrabold text-foreground">
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
                                    {(!reservation.comments || reservation.comments.length === 0) && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs sm:text-sm shrink-0 min-w-[60px] sm:min-w-[80px] justify-center bg-blue-500/20 !text-blue-700 border-blue-500/30"
                                      >
                                        Reserved
                                      </Badge>
                                    )}
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


