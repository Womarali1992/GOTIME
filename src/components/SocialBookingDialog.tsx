import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Calendar, Clock, MapPin, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { useBookings } from "@/hooks/use-bookings";
import type { Social, TimeSlot, Court, Reservation } from "@/lib/types";

interface SocialBookingDialogProps {
  social: Social;
  reservation: Reservation;
  timeSlot: TimeSlot;
  court: Court;
  isOpen: boolean;
  onClose: () => void;
}

export default function SocialBookingDialog({
  social,
  reservation,
  timeSlot,
  court,
  isOpen,
  onClose,
}: SocialBookingDialogProps) {
  const { currentUser, isAuthenticated } = useUser();
  const { updateReservation } = useBookings();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const date = new Date(timeSlot.date);
  const participants = reservation.participants || [];
  const isHost = currentUser?.id === social.hostId;
  const hasJoined = participants.some(p => p.email === currentUser?.email);
  const canJoin = isAuthenticated && !hasJoined && !isHost && participants.length < 4;

  const handleJoin = async () => {
    if (!currentUser || !isAuthenticated) {
      setError("You must be logged in to join");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const newParticipant = {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        isOrganizer: false,
      };

      const updatedParticipants = [...participants, newParticipant];

      // Use centralized hook - auto-refreshes state across all views
      const updatedReservation = await updateReservation(reservation.id, {
        participants: updatedParticipants,
        players: updatedParticipants.length + 1,
      });

      if (!updatedReservation) {
        throw new Error("Failed to join social game");
      }

      setSuccess("Successfully joined the social game!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error joining social:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            {social.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Details */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span className="font-medium">Date:</span>
                <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-medium">Time:</span>
                <span>{timeSlot.startTime} - {timeSlot.endTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-600" />
                <span className="font-medium">Court:</span>
                <span>{court.name} ({court.location})</span>
              </div>
            </div>
          </div>

          {/* Host Information */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Host</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                {social.hostName}
              </Badge>
              {isHost && <Badge variant="outline">You</Badge>}
            </div>
          </div>

          {/* Participants */}
          <div>
            <h3 className="font-semibold mb-2 text-sm flex items-center justify-between">
              <span>Players ({participants.length + 1}/4)</span>
              {participants.length + 1 >= 4 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Full
                </Badge>
              )}
            </h3>
            <div className="space-y-2">
              {/* Host */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm">{social.hostName}</span>
                <Badge variant="outline" className="ml-auto text-xs">Host</Badge>
              </div>

              {/* Other participants */}
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">{participant.name}</span>
                  {participant.email === currentUser?.email && (
                    <Badge variant="outline" className="ml-auto text-xs">You</Badge>
                  )}
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 3 - participants.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="flex items-center gap-2 p-2 bg-gray-100 rounded border-2 border-dashed border-gray-300">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Open spot</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            {canJoin && (
              <Button
                onClick={handleJoin}
                disabled={isJoining}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isJoining ? "Joining..." : "Join Game"}
              </Button>
            )}
            {isHost && (
              <Badge variant="outline" className="flex items-center px-4">
                You're hosting this game
              </Badge>
            )}
            {hasJoined && !isHost && (
              <Badge variant="secondary" className="flex items-center px-4 bg-green-100 text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                You've joined
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
