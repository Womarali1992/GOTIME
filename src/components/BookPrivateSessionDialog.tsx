import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TimeSlot, Coach } from "@/lib/types";
import { dataService } from "@/lib/services/data-service";
import { apiDataService } from "@/lib/services/api-data-service";
import { format } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { GraduationCap, DollarSign, Clock, CheckCircle, AlertCircle, Users } from "lucide-react";

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
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSocialBooking, setIsSocialBooking] = useState(false);

  const court = dataService.getCourtById(selectedTimeSlot.courtId);
  const date = new Date(selectedTimeSlot.date);

  // Get day of week for availability check
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[date.getDay()];

  // Get available coaches for this time slot
  const allCoaches = dataService.coachService.getAllCoaches().filter(c => c.isActive);

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

    // Check if coach has conflicting sessions
    const isAvailable = dataService.privateSessionService.isCoachAvailable(
      coach.id,
      selectedTimeSlot.date,
      selectedTimeSlot.startTime,
      selectedTimeSlot.endTime
    );

    return isAvailable;
  });

  const selectedCoach = selectedCoachId
    ? dataService.coachService.getCoachById(selectedCoachId)
    : null;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCoachId(preselectedCoachId || "");
      setNotes("");
      setError(null);
      setSuccess(false);
      setIsSocialBooking(false);
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

      if (!isSocialBooking && !selectedCoachId) {
        throw new Error("Please select a coach");
      }

      if (isSocialBooking) {
        // Generate time slots for the social booking (minimum 3 required)
        const generateTimeSlots = () => {
          const slots = [];
          const [startHour, startMin] = selectedTimeSlot.startTime.split(':').map(Number);
          const [endHour, endMin] = selectedTimeSlot.endTime.split(':').map(Number);

          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          const duration = endMinutes - startMinutes;

          // Create 3 time slot options within the booking window
          if (duration >= 60) {
            // If booking is 1 hour or more, create slots at start, middle, and end
            for (let i = 0; i < 3; i++) {
              const offset = Math.floor((duration / 3) * i);
              const slotMinutes = startMinutes + offset;
              const hour = Math.floor(slotMinutes / 60);
              const min = slotMinutes % 60;
              const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

              slots.push({
                id: crypto.randomUUID(),
                time: timeStr,
                votes: i === 0 ? [currentUser.id] : [],
                isLocked: i === 0,
              });
            }
          } else {
            // For shorter durations, create the selected time and 2 nearby options
            slots.push({
              id: crypto.randomUUID(),
              time: selectedTimeSlot.startTime,
              votes: [currentUser.id],
              isLocked: true,
            });

            // Add a slot 15 minutes before if possible
            if (startMinutes >= 15) {
              const beforeMinutes = startMinutes - 15;
              const hour = Math.floor(beforeMinutes / 60);
              const min = beforeMinutes % 60;
              slots.unshift({
                id: crypto.randomUUID(),
                time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
                votes: [],
                isLocked: false,
              });
            }

            // Add a slot 15 minutes after
            const afterMinutes = Math.min(endMinutes, startMinutes + 15);
            const hour = Math.floor(afterMinutes / 60);
            const min = afterMinutes % 60;
            slots.push({
              id: crypto.randomUUID(),
              time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
              votes: [],
              isLocked: false,
            });
          }

          return slots;
        };

        const timeSlots = generateTimeSlots();
        const lockedSlot = timeSlots.find(slot => slot.isLocked);

        // Create a social booking via API
        const social = await apiDataService.createSocial({
          title: `Social Game - ${court?.name || 'Court'}`,
          description: notes || '',
          date: selectedTimeSlot.date,
          startTime: selectedTimeSlot.startTime,
          endTime: selectedTimeSlot.endTime,
          timeSlotId: selectedTimeSlot.id,
          status: 'active',
          votes: [],
          createdById: currentUser.id,
        });

        // Update the time slot to mark it as social
        dataService.timeSlotService.updateTimeSlot(selectedTimeSlot.id, {
          type: 'social',
          socialId: social.id,
          available: false,
        });

        // Create a reservation linked to the social
        const reservation = dataService.reservationService.createReservation({
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
          socialId: social.id,
        });

        if (!reservation.success) {
          throw new Error("Failed to create reservation for social booking");
        }
      } else {
        // Create a private coaching session
        const result = dataService.privateSessionService.createSession({
          coachId: selectedCoachId,
          clientId: currentUser.id,
          courtId: selectedTimeSlot.courtId,
          timeSlotId: selectedTimeSlot.id,
          date: selectedTimeSlot.date,
          startTime: selectedTimeSlot.startTime,
          endTime: selectedTimeSlot.endTime,
          price: selectedCoach?.coachingRate || selectedCoach?.hourlyRate || 0,
          notes: notes.trim() || undefined,
        });

        if (!result.success) {
          throw new Error(result.errors?.[0] || "Failed to book session");
        }
      }

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
            {isSocialBooking ? (
              <>
                <Users className="h-5 w-5" />
                Book Social Game
              </>
            ) : (
              <>
                <GraduationCap className="h-5 w-5" />
                Book Private Coaching Session
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSocialBooking
              ? "Book this time slot for a social game"
              : "Select a coach and book a one-on-one session"
            }
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isSocialBooking ? "Social Game Booked!" : "Session Booked!"}
            </h3>
            <p className="text-gray-600">
              {isSocialBooking
                ? "Your social game has been created successfully."
                : "Your private coaching session has been confirmed."}
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

            {/* Booking Type Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                {isSocialBooking ? (
                  <Users className="h-5 w-5 text-blue-600" />
                ) : (
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                )}
                <div>
                  <Label htmlFor="booking-type" className="text-base font-semibold">
                    {isSocialBooking ? "Social Booking" : "Private Coaching"}
                  </Label>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {isSocialBooking
                      ? "Book as a social game to play with friends"
                      : "Book as private coaching session with a coach"
                    }
                  </p>
                </div>
              </div>
              <Switch
                id="booking-type"
                checked={isSocialBooking}
                onCheckedChange={setIsSocialBooking}
              />
            </div>

            {/* Coach Selection - only show if not a social booking and not preselected */}
            {!isSocialBooking && !preselectedCoachId && (
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

            {/* Coach Details - only show if not a social booking */}
            {!isSocialBooking && selectedCoach && (
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
                placeholder={
                  isSocialBooking
                    ? "Add any notes about the social game..."
                    : "Any specific goals or areas you'd like to work on?"
                }
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
                  (!isSocialBooking && (!selectedCoachId || availableCoaches.length === 0))
                }
                className="flex-1"
              >
                {isSubmitting
                  ? "Booking..."
                  : isSocialBooking
                  ? "Book Social Game"
                  : "Book Session"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
