import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, User, GraduationCap } from "lucide-react";
import { TimeSlot, User as UserType, Clinic, Court } from "@/lib/types";

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
  }) => void;
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(preSelectedTimeSlot || "");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [customPlayerName, setCustomPlayerName] = useState("");
  const [customPlayerEmail, setCustomPlayerEmail] = useState("");
  const [customPlayerPhone, setCustomPlayerPhone] = useState("");
  const [players, setPlayers] = useState(1);
  const [useCustomPlayer, setUseCustomPlayer] = useState(false);

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

  const availableTimeSlots = timeSlots.filter(slot => 
    slot.available || slot.type === 'clinic'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTimeSlot || !selectedSlot) return;

    const reservationData = {
      timeSlotId: selectedTimeSlot,
      courtId: selectedSlot.courtId,
      playerName: useCustomPlayer ? customPlayerName : selectedUserData?.name || "",
      playerEmail: useCustomPlayer ? customPlayerEmail : selectedUserData?.email || "",
      playerPhone: useCustomPlayer ? customPlayerPhone : selectedUserData?.phone || "",
      players,
    };

    onSave(reservationData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedTimeSlot(preSelectedTimeSlot || "");
    setSelectedUser("");
    setCustomPlayerName("");
    setCustomPlayerEmail("");
    setCustomPlayerPhone("");
    setPlayers(1);
    setUseCustomPlayer(false);
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

          {/* User Selection */}
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
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                !selectedTimeSlot || 
                (!useCustomPlayer && !selectedUser) ||
                (useCustomPlayer && (!customPlayerName || !customPlayerEmail || !customPlayerPhone))
              }
              className="w-full sm:w-auto text-sm"
            >
              Add to Reservation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserToReservationForm;
