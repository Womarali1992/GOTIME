import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { useBookings } from "@/hooks/use-bookings";
import type { Reservation, TimeSlot, Court } from "@/lib/types";

interface JoinOpenPlayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
  timeSlot: TimeSlot;
  court: Court;
}

const JoinOpenPlayDialog = ({ isOpen, onClose, reservation, timeSlot, court }: JoinOpenPlayDialogProps) => {
  const { currentUser, isAuthenticated } = useUser();
  const { joinOpenPlay } = useBookings();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { reservations } = useBookings();
  const maxPlayers = (reservation as any).maxOpenPlayers || 8;
  const groupId = (reservation as any).openPlayGroupId;
  const groupTotal = groupId
    ? reservations.filter(r => (r as any).openPlayGroupId === groupId).reduce((s, r) => s + (r.players || 1), 0)
    : reservation.players || 1;
  const slotsOpen = maxPlayers - groupTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const submitName = isAuthenticated && currentUser ? currentUser.name : name.trim();
    const submitEmail = isAuthenticated && currentUser ? currentUser.email : email.trim();
    const submitPhone = isAuthenticated && currentUser ? currentUser.phone : phone.trim();

    if (!submitName || !submitEmail || !submitPhone) {
      setError("Please fill in all fields");
      setIsSubmitting(false);
      return;
    }

    try {
      await joinOpenPlay(reservation.id, {
        name: submitName,
        email: submitEmail,
        phone: submitPhone,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPhone("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-3rem)] max-w-xs sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-teal-600" />
            Join Open Play
          </DialogTitle>
          <DialogDescription>
            Join {reservation.playerName}'s game
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">You're in! See you on the court.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Game details */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm space-y-1">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <p><span className="font-medium">Court:</span> {court.name}</p>
              <p><span className="font-medium">Date:</span> {format(new Date(timeSlot.date), "MMM d")}</p>
              <p><span className="font-medium">Time:</span> {timeSlot.startTime} - {timeSlot.endTime}</p>
              <p><span className="font-medium">Organizer:</span> {reservation.playerName}</p>
            </div>
            <div className="pt-2 border-t border-teal-200 mt-2">
              <span className="font-semibold text-teal-700">
                {slotsOpen > 0 ? `${slotsOpen} of ${maxPlayers} spots remaining` : "Full"}
              </span>
            </div>
            {reservation.participants && reservation.participants.length > 0 && (
              <div className="text-xs text-teal-600">
                Players: {reservation.playerName}{reservation.participants.filter(p => !p.isOrganizer).map(p => `, ${p.name}`).join('')}
              </div>
            )}
          </div>

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-3">
              {isAuthenticated && currentUser ? (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-muted-foreground text-xs">{currentUser.email}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="join-name" className="text-sm">Name</Label>
                    <Input id="join-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="join-email" className="text-sm">Email</Label>
                    <Input id="join-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="join-phone" className="text-sm">Phone</Label>
                    <Input id="join-phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="555-123-4567" className="text-sm" />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  {isSubmitting ? "Joining..." : "Join Game"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinOpenPlayDialog;
