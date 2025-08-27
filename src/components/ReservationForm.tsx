
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeSlot, Court, Participant } from "@/lib/types";
import { dataService } from "@/lib/services/data-service";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUser } from "@/contexts/UserContext";
import { Badge } from "@/components/ui/badge";
import { User, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FriendSelector from "./FriendSelector";
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

  const { currentUser, isAuthenticated } = useUser();
  const users = dataService.userService.getAllUsers();
  const court = dataService.getCourtById(selectedTimeSlot.courtId);
  const date = new Date(selectedTimeSlot.date);
  const clinic = selectedTimeSlot.clinicId ? dataService.clinicService.getClinicById(selectedTimeSlot.clinicId) : null;
  const coach = clinic ? dataService.coachService.getCoachById(clinic.coachId) : null;

  // Auto-populate form fields from user profile when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && currentUser && useProfileInfo) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
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

      // Create the reservation directly (all clinics are now free)
      const result = dataService.reservationService.createReservation({
        timeSlotId: selectedTimeSlot.id,
        courtId: selectedTimeSlot.courtId,
        playerName: name.trim(),
        playerEmail: email.trim(),
        playerPhone: phone.trim(),
        players: totalPlayers,
        participants: selectedParticipants
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create reservation");
      }

      setSuccess("Reservation created successfully!");
      setTimeout(() => {
        onComplete(result.reservation!.id);
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
            
            {/* Profile Information Section */}
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
            
{/* Only show form fields when NOT using profile info */}
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
            
            {/* Friend Selection for Regular Reservations */}
            {!clinic && (
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
