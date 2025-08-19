
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeSlot, Court } from "@/lib/types";
import { getCourtById, mockCreateReservation, getClinicById, getCoachById } from "@/lib/data";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ReservationFormProps {
  selectedTimeSlot: TimeSlot;
  onCancel: () => void;
  onComplete: (reservationId: string) => void;
  isOpen: boolean;
}

const ReservationForm = ({ selectedTimeSlot, onCancel, onComplete, isOpen }: ReservationFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [players, setPlayers] = useState("2");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const court = getCourtById(selectedTimeSlot.courtId);
  const date = new Date(selectedTimeSlot.date);
  const clinic = selectedTimeSlot.clinicId ? getClinicById(selectedTimeSlot.clinicId) : null;
  const coach = clinic ? getCoachById(clinic.coachId) : null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app this would be an API call
      const reservation = mockCreateReservation(
        selectedTimeSlot.id,
        name,
        email,
        phone,
        parseInt(players)
      );
      
      // Simulate API delay
      setTimeout(() => {
        onComplete(reservation.id);
        setIsSubmitting(false);
      }, 800);
    } catch (error) {
      console.error("Error creating reservation", error);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setName("");
    setEmail("");
    setPhone("");
    setPlayers("2");
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-2 sm:px-0">
          <DialogTitle className="text-xl sm:text-2xl font-semibold leading-tight">
            {clinic ? `Book ${clinic.name}` : "Complete Your Reservation"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {clinic 
              ? `Join this clinic to improve your skills. Please provide your information to secure your spot.`
              : "Please provide your information to book this court."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-2 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm sm:text-base">
                {clinic ? "Clinic Details" : "Reservation Details"}
              </h3>
              <div className="bg-muted p-3 rounded-md text-xs sm:text-sm space-y-1">
                <p className="break-words"><span className="font-medium">Court:</span> {court?.name}</p>
                <p className="break-words"><span className="font-medium">Date:</span> {format(date, "EEEE, MMMM d, yyyy")}</p>
                <p className="break-words"><span className="font-medium">Time:</span> {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}</p>
                <p className="break-words"><span className="font-medium">Location:</span> {court?.location} ({court?.indoor ? "Indoor" : "Outdoor"})</p>
                {clinic && (
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                    <p className="break-words"><span className="font-medium">Clinic:</span> {clinic.name}</p>
                    <p className="break-words text-muted-foreground">{clinic.description}</p>
                    <p className="break-words"><span className="font-medium">Price:</span> ${clinic.price}</p>
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
            
            <div className="space-y-2">
              <Label htmlFor="players" className="text-sm">
                {clinic ? "Number of Participants" : "Number of Players"}
              </Label>
              {clinic ? (
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded-md text-xs sm:text-sm">
                    <p className="break-words"><span className="font-medium">Current Participants:</span> {clinic.maxParticipants - 2} / {clinic.maxParticipants}</p>
                    <p className="text-muted-foreground">You'll be joining as 1 participant</p>
                  </div>
                  <Select 
                    value={players} 
                    onValueChange={setPlayers}
                  >
                    <SelectTrigger id="players" className="text-sm">
                      <SelectValue placeholder="Select number of participants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Participant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Select 
                  value={players} 
                  onValueChange={setPlayers}
                >
                  <SelectTrigger id="players" className="text-sm">
                    <SelectValue placeholder="Select number of players" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Player</SelectItem>
                    <SelectItem value="2">2 Players</SelectItem>
                    <SelectItem value="4">4 Players</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto text-sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto text-sm">
                {isSubmitting 
                  ? (clinic ? "Booking..." : "Booking...") 
                  : (clinic ? "Book Clinic" : "Complete Booking")
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
