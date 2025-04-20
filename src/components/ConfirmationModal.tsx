
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  reservationId: string;
}

const ConfirmationModal = ({ open, onClose, reservationId }: ConfirmationModalProps) => {
  const navigate = useNavigate();
  
  const handleViewDashboard = () => {
    // In a real app, this would navigate to a user dashboard
    // For now, we'll just close the modal
    onClose();
  };
  
  const handleBookAnother = () => {
    onClose();
    // Just refresh the current page
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bounce-in">
        <DialogHeader className="flex flex-col items-center">
          <CheckCircle className="h-16 w-16 text-primary mb-2" />
          <DialogTitle className="text-xl text-center">Reservation Confirmed!</DialogTitle>
          <DialogDescription className="text-center">
            Your court has been successfully booked. We've sent a confirmation email with all the details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-md text-sm space-y-1 my-4">
          <p><span className="font-medium">Confirmation Code:</span> {reservationId}</p>
          <p className="text-muted-foreground text-xs mt-2">
            Please save this code for your records. You'll need it if you need to modify or cancel your reservation.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto" 
            onClick={handleViewDashboard}
          >
            View My Bookings
          </Button>
          <Button 
            className="w-full sm:w-auto" 
            onClick={handleBookAnother}
          >
            Book Another Court
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
