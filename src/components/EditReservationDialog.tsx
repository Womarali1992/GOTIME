import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Reservation } from "@/lib/types";

interface EditReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservationId: string, updates: Partial<Reservation>) => Promise<void>;
  onDelete?: (reservationId: string) => Promise<void>;
  reservation: Reservation | null;
}

const EditReservationDialog = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  reservation,
}: EditReservationDialogProps) => {
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [players, setPlayers] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Populate form when reservation changes
  useEffect(() => {
    if (reservation) {
      setPlayerName(reservation.playerName || "");
      setPlayerEmail(reservation.playerEmail || "");
      setPlayerPhone(reservation.playerPhone || "");
      setPlayers(reservation.players || 1);
    }
  }, [reservation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!reservation) return;

    // Validate form data
    const errors: string[] = [];
    if (!playerName.trim()) {
      errors.push("Player name is required");
    }
    if (!playerEmail.trim()) {
      errors.push("Player email is required");
    }
    if (!playerPhone.trim()) {
      errors.push("Player phone is required");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error("Validation Error", {
        description: errors.join(", ")
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(reservation.id, {
        playerName: playerName.trim(),
        playerEmail: playerEmail.trim(),
        playerPhone: playerPhone.trim(),
        players,
      });
      toast.success("Reservation Updated", {
        description: `Successfully updated reservation for ${playerName}`
      });
      onClose();
    } catch (error) {
      console.error("Error updating reservation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to Update Reservation", {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!reservation || !onDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the reservation for ${reservation.playerName}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onDelete(reservation.id);
      toast.success("Reservation Deleted", {
        description: `Successfully deleted reservation for ${reservation.playerName}`
      });
      onClose();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to Delete Reservation", {
        description: errorMessage
      });
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPlayerName("");
    setPlayerEmail("");
    setPlayerPhone("");
    setPlayers(1);
    setIsSubmitting(false);
    setValidationErrors([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!reservation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-2 sm:px-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold">Edit Reservation</DialogTitle>
          <DialogDescription className="text-sm">
            Update the reservation details or delete the reservation.
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

          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="playerName" className="text-sm">Player Name</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name"
              className="text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Player Email */}
          <div className="space-y-2">
            <Label htmlFor="playerEmail" className="text-sm">Player Email</Label>
            <Input
              id="playerEmail"
              type="email"
              value={playerEmail}
              onChange={(e) => setPlayerEmail(e.target.value)}
              placeholder="Enter player email"
              className="text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Player Phone */}
          <div className="space-y-2">
            <Label htmlFor="playerPhone" className="text-sm">Player Phone</Label>
            <Input
              id="playerPhone"
              value={playerPhone}
              onChange={(e) => setPlayerPhone(e.target.value)}
              placeholder="Enter player phone"
              className="text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Number of Players */}
          <div className="space-y-2">
            <Label className="text-sm">Number of Players</Label>
            <Select
              value={players.toString()}
              onValueChange={(value) => setPlayers(parseInt(value))}
              disabled={isSubmitting}
            >
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
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between pt-4 border-t">
            <div>
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto text-sm"
                >
                  Delete Reservation
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto text-sm"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditReservationDialog;
