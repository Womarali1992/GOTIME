
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TimeSlot } from "@/lib/types";
import HomeSchedulerView from "@/components/HomeSchedulerView";
import ReservationForm from "@/components/ReservationForm";
import BookPrivateSessionDialog from "@/components/BookPrivateSessionDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useDataService } from "@/hooks/use-data-service";
import { useUser } from "@/contexts/UserContext";

const Index = () => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [confirmedReservationId, setConfirmedReservationId] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'regular' | 'private' | null>(null);
  const dataService = useDataService();
  const { currentUser } = useUser();
  const isAdmin = currentUser?.membershipType === 'admin';

  const handleSelectTimeSlot = (timeSlot: TimeSlot) => {
    // Check isAvailable (calculated) or available (raw) - API returns both
    const slotIsAvailable = (timeSlot as any).isAvailable !== undefined
      ? (timeSlot as any).isAvailable
      : timeSlot.available;

    // Don't show booking options for clinic or blocked slots
    if (timeSlot.type === 'clinic') {
      setSelectedTimeSlot(timeSlot);
      setBookingType('regular');
    } else if ((timeSlot.blocked || !slotIsAvailable) && !isAdmin) {
      // Only block non-admins from booking unavailable/blocked slots
      return;
    } else {
      // Show booking type selection for available slots (or for admins even if blocked/unavailable)
      setSelectedTimeSlot(timeSlot);
      setBookingType(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelReservation = () => {
    setSelectedTimeSlot(null);
    setBookingType(null);
  };

  const handleCompleteReservation = (reservationId?: string) => {
    if (reservationId) {
      setConfirmedReservationId(reservationId);
    }
    setSelectedTimeSlot(null);
    setBookingType(null);
    // Refresh data to show the new reservation in the UI
    // Using shared context ensures all components see the update
    dataService.refresh();
  };

  const handleCloseConfirmation = () => {
    setConfirmedReservationId(null);
  };

  const handleSelectBookingType = (type: 'regular' | 'private') => {
    setBookingType(type);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />

      <main className="flex-1 container py-4 sm:py-8 px-4 sm:px-6">
        <HomeSchedulerView onSelectTimeSlot={handleSelectTimeSlot} />
      </main>

      <Footer />

      {/* Booking Type Selection Dialog */}
      {selectedTimeSlot && bookingType === null && (
        <Dialog open={true} onOpenChange={handleCancelReservation}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Choose Booking Type</DialogTitle>
              <DialogDescription>
                Would you like to book this time for regular play or a private coaching session?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-blue-50 hover:border-blue-500"
                onClick={() => handleSelectBookingType('regular')}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Regular Court Booking</h3>
                    <p className="text-sm text-gray-600">Book the court for yourself and friends</p>
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-green-50 hover:border-green-500"
                onClick={() => handleSelectBookingType('private')}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Private Coaching Session</h3>
                    <p className="text-sm text-gray-600">Book one-on-one time with a coach</p>
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Regular Reservation Form */}
      {selectedTimeSlot && bookingType === 'regular' && (
        <ReservationForm
          selectedTimeSlot={selectedTimeSlot}
          onCancel={handleCancelReservation}
          onComplete={handleCompleteReservation}
          isOpen={true}
        />
      )}

      {/* Private Session Booking Form */}
      {selectedTimeSlot && bookingType === 'private' && (
        <BookPrivateSessionDialog
          selectedTimeSlot={selectedTimeSlot}
          isOpen={true}
          onClose={handleCancelReservation}
          onComplete={handleCompleteReservation}
        />
      )}
    </div>
  );
};

export default Index;
