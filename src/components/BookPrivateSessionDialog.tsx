import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TimeSlot, Coach } from "@/lib/types";
import { useBookings } from "@/hooks/use-bookings";
import { useDataService } from "@/hooks/use-data-service";
import { format } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { GraduationCap, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface BookPrivateSessionDialogProps {
  selectedTimeSlot: TimeSlot;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  preselectedCoachId?: string;
}

export default function BookPrivateSessionDialog({
  selectedTimeSlot,
  isOpen,
  onClose,
  onComplete,
  preselectedCoachId,
}: BookPrivateSessionDialogProps) {
  const { currentUser, isAuthenticated } = useUser();
  const { courts, coaches } = useDataService();
  const { createReservation, updateTimeSlot } = useBookings();

  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const court = courts.find(c => c.id === selectedTimeSlot.courtId);
  const date = new Date(selectedTimeSlot.date);

  // Get day of week for availability check
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[date.getDay()];

  // Get available coaches for this time slot
  const allCoaches = coaches.filter(c => c.isActive);

  // Filter coaches by availability for this day and time
  const availableCoaches = allCoaches.filter(coach => {
    // Check if coach is available on this day
    const availability = coach.availability?.find(a => a.dayOfWeek === dayOfWeek);
    if (!availability || !availability.isAvailable) return false;

    // Check if time slot falls within coach's available hours
    const slotStart = selectedTimeSlot.startTime;
    const slotEnd = selectedTimeSlot.endTime;

    if (slotStart < availability.startTime || slotEnd > availability.endTime) {
      return false;
    }

    // Note: Coach session conflict checking would need backend support
    return true;
  });

  const selectedCoach = selectedCoachId
    ? coaches.find(c => c.id === selectedCoachId)
    : null;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCoachId(preselectedCoachId || "");
      setNotes("");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, preselectedCoachId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!isAuthenticated || !currentUser) {
        throw new Error("You must be logged in to book a session");
      }

      if (!selectedCoachId) {
        throw new Error("Please select a coach");
      }

      // Create a private coaching session as a reservation
      const reservation = await createReservation({
        timeSlotId: selectedTimeSlot.id,
        courtId: selectedTimeSlot.courtId,
        playerName: currentUser.name,
        playerEmail: currentUser.email,
        playerPhone: currentUser.phone,
        players: 1,
        participants: [{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          isOrganizer: true,
        }],
        notes: notes.trim() || undefined,
      });

      if (!reservation) {
        throw new Error("Failed to book coaching session");
      }

      // Update the time slot to mark it as a coaching session
      await updateTimeSlot(selectedTimeSlot.id, {
        type: 'coaching',
        available: false,
      });

      setSuccess(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1500);

    } catch (error) {
      console.error("Error booking session:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Book Private Coaching Session
          </DialogTitle>
          <DialogDescription>
            Select a coach and book a one-on-one session
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Session Booked!</h3>
            <p className="text-gray-600">
              Your private coaching session has been confirmed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Session Details */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Time:</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Court:</span>
                <span className="font-medium">{court?.name}</span>
              </div>
            </div>

            {/* Coach Selection - only show if not preselected */}
            {!preselectedCoachId && (
              <div className="space-y-2">
                <Label htmlFor="coach">Select Coach</Label>
                {availableCoaches.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No coaches are available for this time slot. Please try a different time.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCoaches.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{coach.name}</span>
                            <span className="ml-4 text-sm text-gray-500">
                              ${coach.coachingRate || coach.hourlyRate}/hr
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Coach Details */}
            {selectedCoach && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{selectedCoach.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{selectedCoach.bio}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCoach.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="text-lg font-semibold text-green-600">
                    ${selectedCoach.coachingRate || selectedCoach.hourlyRate}
                  </span>
                  <span className="text-sm text-gray-600">for this session</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific goals or areas you'd like to work on?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedCoachId || availableCoaches.length === 0
                }
                className="flex-1"
              >
                {isSubmitting ? "Booking..." : "Book Session"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
