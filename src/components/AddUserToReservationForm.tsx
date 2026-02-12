import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, User, GraduationCap, UserCheck } from "lucide-react";
import { TimeSlot, User as UserType, Clinic, Court } from "@/lib/types";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

interface AddUserToReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservationData: {
    timeSlotId: string;
    courtId: string;
    playerName: string;
    playerEmail: string;
    playerPhone: string;
    players: number;
  }) => Promise<void>;
  timeSlots: TimeSlot[];
  users: UserType[];
  clinics: Clinic[];
  courts: Court[];
  preSelectedTimeSlot?: string;
}

const AddUserToReservationForm = ({
  isOpen,
  onClose,
  onSave,
  timeSlots,
  users,
  clinics,
  courts,
  preSelectedTimeSlot,
}: AddUserToReservationFormProps) => {
  const { currentUser, isAuthenticated } = useUser();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(preSelectedTimeSlot || "");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [customPlayerName, setCustomPlayerName] = useState("");
  const [customPlayerEmail, setCustomPlayerEmail] = useState("");
  const [customPlayerPhone, setCustomPlayerPhone] = useState("");
  const [players, setPlayers] = useState(1);
  const [useCustomPlayer, setUseCustomPlayer] = useState(false);
  const [useCurrentUser, setUseCurrentUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const selectedSlot = timeSlots.find(slot => slot.id === selectedTimeSlot);
  const selectedUserData = users.find(user => user.id === selectedUser);
  const selectedCourt = courts.find(court => court.id === selectedSlot?.courtId);
  const selectedClinic = clinics.find(clinic => clinic.id === selectedSlot?.clinicId);

  // Update selected time slot when preSelectedTimeSlot changes
  useEffect(() => {
    if (preSelectedTimeSlot) {
      setSelectedTimeSlot(preSelectedTimeSlot);
    }
  }, [preSelectedTimeSlot]);

  // Auto-select current user when authenticated and useCurrentUser is true
  useEffect(() => {
    if (isAuthenticated && currentUser && useCurrentUser) {
      setSelectedUser(currentUser.id);
      setUseCustomPlayer(false);
    }
  }, [currentUser, isAuthenticated, useCurrentUser]);

  const availableTimeSlots = timeSlots.filter(slot => 
    slot.available || slot.type === 'clinic'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!selectedTimeSlot || !selectedSlot) {
      setValidationErrors(["Please select a time slot"]);
      return;
    }

    // Determine which user data to use
    let playerData;
    if (useCustomPlayer) {
      playerData = {
        playerName: customPlayerName,
        playerEmail: customPlayerEmail,
        playerPhone: customPlayerPhone,
      };
    } else if (useCurrentUser && currentUser) {
      playerData = {
        playerName: currentUser.name,
        playerEmail: currentUser.email,
        playerPhone: currentUser.phone,
      };
    } else {
      playerData = {
        playerName: selectedUserData?.name || "",
        playerEmail: selectedUserData?.email || "",
        playerPhone: selectedUserData?.phone || "",
      };
    }

    // Validate player data
    const errors: string[] = [];
    if (!playerData.playerName?.trim()) {
      errors.push("Player name is required");
    }
    if (!playerData.playerEmail?.trim()) {
      errors.push("Player email is required");
    }
    if (!playerData.playerPhone?.trim()) {
      errors.push("Player phone is required");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error("Validation Error", {
        description: errors.join(", ")
      });
      return;
    }

    const reservationData = {
      timeSlotId: selectedTimeSlot,
      courtId: selectedSlot.courtId,
      ...playerData,
      players,
      createdById: useCurrentUser && currentUser ? currentUser.id : (useCustomPlayer ? null : selectedUser),
    };

    setIsSubmitting(true);
    try {
      await onSave(reservationData);
      onClose();
      resetForm();
    } catch (error) {
      // Error is handled by parent component, just re-enable form
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedTimeSlot(preSelectedTimeSlot || "");
    setSelectedUser("");
    setCustomPlayerName("");
    setCustomPlayerEmail("");
    setCustomPlayerPhone("");
    setPlayers(1);
    setUseCustomPlayer(false);
    setUseCurrentUser(true);
    setIsSubmitting(false);
    setValidationErrors([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-2 sm:px-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold">Add User to Reservation</DialogTitle>
          <DialogDescription className="text-sm">
            Select an available time slot or clinic and add a user to it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-2 sm:px-0">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm font-medium text-destructive mb-1">Please fix the following errors:</p>
              <ul className="text-xs text-destructive space-y-1 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Select Time Slot</Label>
            <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.map((slot) => {
                  const court = courts.find(c => c.id === slot.courtId);
                  const clinic = clinics.find(cl => cl.id === slot.clinicId);
                  
                  return (
                    <SelectItem key={slot.id} value={slot.id} className="text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                        <span className="text-xs text-muted-foreground">
                          {court?.name} • {clinic ? clinic.name : 'Open Play'}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Current User Section */}
          {isAuthenticated && currentUser && (
            <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-sm">Book for Yourself</h3>
                  <Badge variant="secondary" className="text-xs">
                    {currentUser.membershipType}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUseCurrentUser(!useCurrentUser)}
                  className="text-xs"
                >
                  {useCurrentUser ? "Book for Others" : "Book for Me"}
                </Button>
              </div>
              {useCurrentUser && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✓ Booking for: <span className="font-medium">{currentUser.name}</span></p>
                  <p>Email: {currentUser.email}</p>
                  <p>Phone: {currentUser.phone}</p>
                  {currentUser.duprRating && (
                    <p>DUPR Rating: {currentUser.duprRating}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Selection */}
          {(!useCurrentUser || !isAuthenticated || !currentUser) && (
            <div className="space-y-2">
              <Label className="text-sm">Select User</Label>
            <div className="space-y-2">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{user.name}</span>
                        <Badge variant="secondary" className="text-xs">{user.email}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useCustomPlayer"
                  checked={useCustomPlayer}
                  onChange={(e) => setUseCustomPlayer(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="useCustomPlayer" className="text-sm">Add custom player instead</Label>
              </div>
            </div>
            </div>
          )}

          {/* Custom Player Fields */}
          {useCustomPlayer && (
            <div className="space-y-3 p-3 bg-muted rounded-md">
              <div className="space-y-2">
                <Label htmlFor="customName" className="text-sm">Player Name</Label>
                <Input
                  id="customName"
                  value={customPlayerName}
                  onChange={(e) => setCustomPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customEmail" className="text-sm">Player Email</Label>
                <Input
                  id="customEmail"
                  type="email"
                  value={customPlayerEmail}
                  onChange={(e) => setCustomPlayerEmail(e.target.value)}
                  placeholder="Enter player email"
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customPhone" className="text-sm">Player Phone</Label>
                <Input
                  id="customPhone"
                  value={customPlayerPhone}
                  onChange={(e) => setCustomPlayerPhone(e.target.value)}
                  placeholder="Enter player phone"
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Number of Players */}
          <div className="space-y-2">
            <Label className="text-sm">Number of Players</Label>
            <Select value={players.toString()} onValueChange={(value) => setPlayers(parseInt(value))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select number of players" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((num) => (
                  <SelectItem key={num} value={num.toString()} className="text-sm">
                    {num} Player{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedTimeSlot ||
                (
                  !useCurrentUser && !useCustomPlayer && !selectedUser
                ) ||
                (useCustomPlayer && (!customPlayerName || !customPlayerEmail || !customPlayerPhone))
              }
              className="w-full sm:w-auto text-sm"
            >
              {isSubmitting ? "Creating..." : "Add to Reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserToReservationForm;
