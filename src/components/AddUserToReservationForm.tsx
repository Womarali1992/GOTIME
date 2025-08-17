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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add User to Reservation</DialogTitle>
          <DialogDescription>
            Select an available time slot or clinic and add a user to it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Time Slot Selection */}
          <div className="space-y-3">
            <Label htmlFor="timeSlot">Select Time Slot or Clinic</Label>
            <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot or clinic" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.map((slot) => {
                  const court = courts.find(c => c.id === slot.courtId);
                  const clinic = clinics.find(c => c.id === slot.clinicId);
                  const reservation = slot.type === 'reservation';
                  
                  return (
                    <SelectItem key={slot.id} value={slot.id}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="font-medium">
                            {court?.name} • {slot.date} • {slot.startTime}-{slot.endTime}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {clinic ? (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                {clinic.name} (Clinic)
                              </span>
                            ) : reservation ? (
                              <span className="text-orange-600">Reserved</span>
                            ) : (
                              <span className="text-green-600">Available</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Slot Info */}
          {selectedSlot && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Selected Slot Details</h4>
                <Badge variant={selectedClinic ? "default" : "outline"}>
                  {selectedClinic ? "Clinic" : "Time Slot"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Court:</span> {selectedCourt?.name}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {selectedSlot.date}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {selectedSlot.startTime} - {selectedSlot.endTime}
                </div>
                {selectedClinic && (
                  <>
                    <div>
                      <span className="font-medium">Clinic:</span> {selectedClinic.name}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> ${selectedClinic.price}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Player Selection */}
          <div className="space-y-3">
            <Label>Player Information</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustomPlayer"
                checked={useCustomPlayer}
                onChange={(e) => setUseCustomPlayer(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="useCustomPlayer">Add custom player (not in system)</Label>
            </div>

            {!useCustomPlayer ? (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user from the system" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customPlayerName">Player Name</Label>
                  <Input
                    id="customPlayerName"
                    value={customPlayerName}
                    onChange={(e) => setCustomPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customPlayerEmail">Email</Label>
                  <Input
                    id="customPlayerEmail"
                    type="email"
                    value={customPlayerEmail}
                    onChange={(e) => setCustomPlayerEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customPlayerPhone">Phone</Label>
                  <Input
                    id="customPlayerPhone"
                    value={customPlayerPhone}
                    onChange={(e) => setCustomPlayerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Number of Players */}
          <div className="space-y-3">
            <Label htmlFor="players">Number of Players</Label>
            <Select value={players.toString()} onValueChange={(value) => setPlayers(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} player{num !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                !selectedTimeSlot || 
                (!useCustomPlayer && !selectedUser) ||
                (useCustomPlayer && (!customPlayerName || !customPlayerEmail || !customPlayerPhone))
              }
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
