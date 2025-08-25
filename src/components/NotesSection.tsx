import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, StickyNote } from "lucide-react";
import { format } from "date-fns";
import type { Court, TimeSlot, Reservation, User as AppUser, Coach, Comment } from "@/lib/types";
import type { EnrichedTimeSlot, ItemsWithComments } from "@/types/enriched-data";

type ReservationCommentContext = {
  id: string;
  comments: Comment[];
  playerName: string;
  playerEmail: string;
  date?: string;
  time?: string;
  court?: string;
};

interface NotesSectionProps {
  enrichedTimeSlots: EnrichedTimeSlot[];
  itemsWithComments: ItemsWithComments;
  courts: Court[];
  timeSlots: TimeSlot[];
  reservations: Reservation[];
  users: AppUser[];
  coaches: Coach[];
  onOpenReservationComments: (context: ReservationCommentContext) => void;
  onOpenUserComments: (user: AppUser) => void;
}

const NotesSection = ({
  enrichedTimeSlots,
  itemsWithComments,
  courts,
  timeSlots,
  reservations,
  users,
  coaches,
  onOpenReservationComments,
  onOpenUserComments,
}: NotesSectionProps) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notes Overview</h2>
          <div className="text-sm text-muted-foreground mt-1">
            All items with admin notes and time slots with blocked/clinic status
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Time Slots with Special Status</h3>
        {enrichedTimeSlots.map((slot) => (
          <Card key={slot.id} className="border border-input bg-card shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {slot.courtName} - {format(new Date(slot.date), "MMM d, yyyy")}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={slot.status === "blocked" ? "destructive" : slot.status === "clinic" ? "default" : "secondary"}
                      className={
                        slot.status === "blocked"
                          ? "bg-red-500/20 text-red-700 border-red-500/30"
                          : slot.status === "clinic"
                          ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
                          : "bg-blue-500/20 text-blue-700 border-blue-500/30"
                      }
                    >
                      {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    {slot.reservation && (
                      <span className="text-sm text-muted-foreground">Player: {slot.reservation.playerName}</span>
                    )}
                    {slot.clinic && (
                      <span className="text-sm text-muted-foreground">
                        Coach: {coaches.find((c) => c.id === slot.clinic.coachId)?.name}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`border rounded-md p-4 ${
                  slot.status === "blocked"
                    ? "bg-red-50 border-red-200"
                    : slot.status === "clinic"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <p
                  className={`text-sm whitespace-pre-wrap ${
                    slot.status === "blocked"
                      ? "text-red-800"
                      : slot.status === "clinic"
                      ? "text-yellow-800"
                      : "text-blue-800"
                  }`}
                >
                  {slot.notes}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {enrichedTimeSlots.length === 0 && (
          <Card className="border border-input bg-card shadow-sm">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">No time slots with notes</p>
                <p className="text-sm">Time slots will appear here when they are blocked or have clinics.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Other Items with Notes</h3>
        {Object.values(itemsWithComments)
          .flat()
          .map((item) => (
            <Card key={item.id} className="border border-input bg-card shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">{item.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={item.type === "reservation" ? "secondary" : "outline"}
                        className={
                          item.type === "reservation"
                            ? "bg-blue-500/20 text-blue-700 border-blue-500/30"
                            : "bg-green-500/20 text-green-700 border-green-500/30"
                        }
                      >
                        {item.type === "reservation" ? "Notes" : "User"}
                      </Badge>
                      <span>{item.subtitle}</span>
                      {item.court && <span className="text-sm text-muted-foreground">Court: {item.court}</span>}
                      {item.date && (
                        <span className="text-sm text-muted-foreground">{format(new Date(item.date), "MMM d, yyyy")}</span>
                      )}
                      {item.time && <span className="text-sm text-muted-foreground">{item.time}</span>}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (item.type === "reservation") {
                        const reservation = reservations.find((r) => r.id === item.id);
                        if (reservation) {
                          const court = courts.find((c) => c.id === reservation.courtId);
                          const timeSlot = timeSlots.find((ts) => ts.id === reservation.timeSlotId);
                          onOpenReservationComments({
                            ...reservation,
                            court: court?.name,
                            date: timeSlot?.date,
                            time: timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : "",
                          });
                        }
                      } else if (item.type === "user") {
                        const user = users.find((u) => u.id === item.id);
                        if (user) {
                          onOpenUserComments(user);
                        }
                      }
                    }}
                    className="h-8 px-3 text-sm border-yellow-300 hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800"
                  >
                    <StickyNote className="h-4 w-4 mr-2" />
                    {item.commentCount > 0 ? `Edit Comments (${item.commentCount})` : "Add Comments"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-yellow-700 font-medium">
                      {item.commentCount} comment{item.commentCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-yellow-600">
                      Latest: {new Date(item.comments[item.comments.length - 1].createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">{item.latestComment}</p>
                </div>
              </CardContent>
            </Card>
          ))}

        {Object.values(itemsWithComments).flat().length === 0 && (
          <Card className="border border-input bg-card shadow-sm">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">No other items with notes</p>
                <p className="text-sm">Notes will appear here when you add them to reservations or users.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default NotesSection;


