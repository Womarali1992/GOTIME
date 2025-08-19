
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
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto bounce-in">
        <DialogHeader className="flex flex-col items-center px-2 sm:px-0">
          <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-primary mb-2" />
          <DialogTitle className="text-lg sm:text-xl text-center">Reservation Confirmed!</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Your court has been successfully booked. We've sent a confirmation email with all the details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-3 sm:p-4 rounded-md text-xs sm:text-sm space-y-1 my-4 mx-2 sm:mx-0">
          <p className="break-words"><span className="font-medium">Confirmation Code:</span> {reservationId}</p>
          <p className="text-muted-foreground text-xs mt-2">
            Please save this code for your records. You'll need it if you need to modify or cancel your reservation.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between px-2 sm:px-0">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto text-sm" 
            onClick={handleViewDashboard}
          >
            View My Bookings
          </Button>
          <Button 
            className="w-full sm:w-auto text-sm" 
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
