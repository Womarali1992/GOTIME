import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TimeSlot, Participant } from "@/lib/types";
import { useBookings } from "@/hooks/use-bookings";
import { apiDataService } from "@/lib/services/api-data-service";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUser } from "@/contexts/UserContext";
import { Badge } from "@/components/ui/badge";
import { User, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FriendSelector from "./FriendSelector";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

interface ReservationFormProps {
  selectedTimeSlot: TimeSlot;
  onCancel: () => void;
  onComplete: (reservationId: string) => void;
  isOpen: boolean;
}

type ReservationStep = 'details';

const ReservationForm = ({ selectedTimeSlot, onCancel, onComplete, isOpen }: ReservationFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [players, setPlayers] = useState("2");
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useProfileInfo, setUseProfileInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ReservationStep>('details');
  const [friendSelectorExpanded, setFriendSelectorExpanded] = useState(false);
  const [isOpenPlay, setIsOpenPlay] = useState(false);
  const [openPlaySlots, setOpenPlaySlots] = useState(2);
  const [maxOpenPlayers, setMaxOpenPlayers] = useState(4);

  const { currentUser, isAuthenticated } = useUser();
  const {
    users,
    courts,
    createReservation
  } = useBookings();

  const [clinic, setClinic] = useState<any>(null);
  const [coach, setCoach] = useState<any>(null);
  const date = new Date(selectedTimeSlot.date);
  const court = courts.find(c => c.id === selectedTimeSlot.courtId);

  // Load clinic/coach data on mount (if applicable)
  useEffect(() => {
    const loadClinicData = async () => {
      if (selectedTimeSlot.clinicId) {
        const clinicData = await apiDataService.getClinicById(selectedTimeSlot.clinicId);
        setClinic(clinicData);
        if (clinicData) {
          const coachData = await apiDataService.getCoachById(clinicData.coachId);
          setCoach(coachData);
        }
      }
    };
    loadClinicData();
  }, [selectedTimeSlot.clinicId]);

  // Auto-populate form fields from user profile when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && currentUser && useProfileInfo) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
    } else {
      // Clear fields for guests
      if (!isAuthenticated || !currentUser) {
        setName("");
        setEmail("");
        setPhone("");
        setUseProfileInfo(false);
      }
    }
  }, [currentUser, isAuthenticated, useProfileInfo]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Calculate total players (organizer + selected participants)
      const totalPlayers = 1 + selectedParticipants.length;

      // Validate form data
      if (!name.trim()) {
        throw new Error("Name is required");
      }
      if (!email.trim()) {
        throw new Error("Email is required");
      }
      if (!phone.trim()) {
        throw new Error("Phone number is required");
      }

      // Generate a group ID so all courts in this open play session are linked
      const groupId = isOpenPlay
        ? `opg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        : undefined;

      // Create reservation on the selected court
      const reservationData = {
        timeSlotId: selectedTimeSlot.id,
        courtId: selectedTimeSlot.courtId,
        playerName: name.trim(),
        playerEmail: email.trim(),
        playerPhone: phone.trim(),
        players: totalPlayers,
        participants: selectedParticipants,
        isOpenPlay,
        openPlaySlots: isOpenPlay ? openPlaySlots : undefined,
        maxOpenPlayers: isOpenPlay ? (maxOpenPlayers === 999 ? 999 : maxOpenPlayers * openPlaySlots) : undefined,
        openPlayGroupId: groupId,
      };

      const reservation = await createReservation(reservationData);

      if (!reservation) {
        throw new Error("Failed to create reservation");
      }

      // If Open Play with multiple courts, reserve additional courts at the same time
      if (isOpenPlay && openPlaySlots > 1) {
        const hour = parseInt(selectedTimeSlot.startTime.split(":")[0]);
        const dateSlots = await apiDataService.getTimeSlotsForDate(selectedTimeSlot.date);

        // Find available slots at the same hour on other courts
        const availableOtherSlots = dateSlots.filter(
          (s: any) =>
            s.courtId !== selectedTimeSlot.courtId &&
            parseInt(s.startTime.split(":")[0]) === hour &&
            s.available &&
            !s.blocked &&
            !s.reservation
        );

        const additionalCourts = availableOtherSlots.slice(0, openPlaySlots - 1);

        for (const otherSlot of additionalCourts) {
          try {
            await createReservation({
              ...reservationData,
              timeSlotId: otherSlot.id,
              courtId: otherSlot.courtId,
            });
          } catch (err) {
            console.warn(`Could not reserve additional court ${otherSlot.courtId}:`, err);
          }
        }

        const totalSpots = maxOpenPlayers === 999 ? 'unlimited' : `${maxOpenPlayers * openPlaySlots}`;
        if (additionalCourts.length < openPlaySlots - 1) {
          const booked = 1 + additionalCourts.length;
          setSuccess(`Reserved ${booked} of ${openPlaySlots} courts — ${totalSpots} spots!`);
        } else {
          setSuccess(`Reserved ${openPlaySlots} courts — ${totalSpots} spots!`);
        }
      } else {
        const totalSpots = maxOpenPlayers === 999 ? 'unlimited spots' : `${maxOpenPlayers} spots`;
        setSuccess(isOpenPlay ? `Open Play created — ${totalSpots}!` : "Reservation created successfully!");
      }

      setTimeout(() => {
        onComplete(reservation.id);
        setIsSubmitting(false);
      }, 800);

    } catch (error) {
      console.error("Error creating reservation", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };



  const handleClose = () => {
    // Reset form when closing
    setName("");
    setEmail("");
    setPhone("");
    setPlayers("2");
    setSelectedParticipants([]);
    setIsOpenPlay(false);
    setOpenPlaySlots(2);
    setUseProfileInfo(true);
    setError(null);
    setSuccess(null);
    setCurrentStep('details');
    onCancel();
  };

  const toggleUseProfileInfo = () => {
    setUseProfileInfo(!useProfileInfo);
    if (!useProfileInfo && isAuthenticated && currentUser) {
      // Re-populate with profile info
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
    } else if (useProfileInfo) {
      // Clear fields for manual entry
      setName("");
      setEmail("");
      setPhone("");
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-3rem)] max-w-xs sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden mx-auto">
        <DialogHeader className="px-2 sm:px-0">
          <DialogTitle className="text-xl sm:text-2xl font-semibold leading-tight">
            {clinic ? `Book ${clinic.name}` : ""}
          </DialogTitle>
          {clinic && (
            <DialogDescription className="text-sm leading-relaxed">
              Join this clinic to improve your skills. Please provide your information to secure your spot.
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="px-2 sm:px-0 overflow-x-hidden">
          {/* Error and Success Messages */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 overflow-x-hidden">
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm sm:text-base">
                  {clinic ? "Clinic Details" : "Reservation Details"}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p className="break-words"><span className="font-medium">Court:</span> {court?.name}</p>
                  <p className="break-words"><span className="font-medium">Date:</span> {format(date, "MMM d")}</p>
                  <p className="break-words"><span className="font-medium">Time:</span> {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}</p>
                  <p className="break-words"><span className="font-medium">Location:</span> {court?.location} ({court?.indoor ? "Indoor" : "Outdoor"})</p>
                </div>
                {clinic && (
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                    <p className="break-words"><span className="font-medium">Clinic:</span> {clinic.name}</p>
                    <p className="break-words text-muted-foreground">{clinic.description}</p>
                    <p className="break-words"><span className="font-medium">Max Participants:</span> {clinic.maxParticipants}</p>
                    {coach && (
                      <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                        <p className="break-words"><span className="font-medium">Coach:</span> {coach.name}</p>
                        <p className="break-words text-muted-foreground">{coach.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Information Section - Only show if logged in */}
            {isAuthenticated && currentUser && (
              <div className="space-y-2 max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-sm sm:text-base">Profile Information</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] cursor-pointer hover:bg-gray-100 transition-colors px-2 py-0.5 text-gray-600 border-gray-300"
                    onClick={toggleUseProfileInfo}
                  >
                    {useProfileInfo ? "Enter Manually" : "Use Profile"}
                  </Badge>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                {useProfileInfo && (
                  <div className="text-xs text-muted-foreground">
                    <div className="grid grid-cols-[1.5fr_1fr] gap-x-4 gap-y-3">
                      <div>
                        <div className="font-medium">Name:</div>
                        <div>{currentUser.name}</div>
                      </div>
                      <div>
                        <div className="font-medium">Phone:</div>
                        <div>{currentUser.phone}</div>
                      </div>
                      <div>
                        <div className="font-medium">Email:</div>
                        <div className="break-all">{currentUser.email}</div>
                      </div>
                      {currentUser.duprRating && (
                        <div>
                          <div className="font-medium">DUPR Rating:</div>
                          <div>{currentUser.duprRating}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
            
            {/* Guest booking message */}
            {!isAuthenticated && (
              <div className="space-y-2 max-w-md mx-auto">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Booking as a guest?</strong> No problem! Just fill in your details below. 
                    You can sign in later to save your information for faster bookings.
                  </p>
                </div>
              </div>
            )}
            
{/* Show form fields when NOT using profile info OR when guest */}
            {(!useProfileInfo || !isAuthenticated || !currentUser) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Full Name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                  <Input
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="555-123-4567"
                    className="text-sm"
                  />
                </div>
              </>
            )}
            
            {/* Friend Selection for Regular Reservations - Only show if logged in */}
            {!clinic && isAuthenticated && currentUser && (
              <div className="max-w-md mx-auto overflow-x-hidden">
                <FriendSelector
                  users={users}
                  selectedParticipants={selectedParticipants}
                  onParticipantsChange={setSelectedParticipants}
                  maxParticipants={4}
                  className="border rounded-lg p-4 bg-muted/20 overflow-x-hidden"
                  isExpanded={friendSelectorExpanded}
                  onExpandedChange={setFriendSelectorExpanded}
                />
              </div>
            )}

            {/* Open Play Toggle - Available for all users booking non-clinic slots */}
            {!clinic && (
              <div className="max-w-md mx-auto">
                <div className="border rounded-lg p-4 bg-teal-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="open-play" className="text-sm font-medium">Open Play</Label>
                      <p className="text-xs text-muted-foreground">Allow others to join your game</p>
                    </div>
                    <Switch
                      id="open-play"
                      checked={isOpenPlay}
                      onCheckedChange={setIsOpenPlay}
                    />
                  </div>
                  {isOpenPlay && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">How many courts?</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3].map((n) => (
                            <Button
                              key={n}
                              type="button"
                              variant={openPlaySlots === n ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() => setOpenPlaySlots(n)}
                            >
                              {n}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Players per court</Label>
                        <div className="flex gap-2">
                          {([4, 5, 999] as const).map((n) => (
                            <Button
                              key={n}
                              type="button"
                              variant={maxOpenPlayers === n ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() => setMaxOpenPlayers(n)}
                            >
                              {n === 999 ? '∞' : n}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-teal-700 font-medium">
                        {maxOpenPlayers === 999 ? 'Unlimited' : maxOpenPlayers * openPlaySlots} spots — players can join on any court
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4 max-w-md mx-auto">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-32 text-sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-32 text-sm">
                {isSubmitting
                  ? (clinic ? "Processing..." : "Booking...")
                  : (clinic ? "Book Clinic" : "Book")
                }
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationForm;
