import { useState } from "react";
import HomeSchedulerView from "@/components/HomeSchedulerView";
import ReservationForm from "@/components/ReservationForm";
import ConfirmationModal from "@/components/ConfirmationModal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TimeSlot } from "@/lib/types";

const Index = () => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [confirmedReservationId, setConfirmedReservationId] = useState<string | null>(null);
  
  const handleSelectTimeSlot = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const handleCancelReservation = () => {
    setSelectedTimeSlot(null);
  };
  
  const handleCompleteReservation = (reservationId: string) => {
    setConfirmedReservationId(reservationId);
    setSelectedTimeSlot(null);
  };
  
  const handleCloseConfirmation = () => {
    setConfirmedReservationId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      
      <main className="flex-1 container py-4 sm:py-8 px-4 sm:px-6">
        {selectedTimeSlot ? (
          <ReservationForm
            selectedTimeSlot={selectedTimeSlot}
            onCancel={handleCancelReservation}
            onComplete={handleCompleteReservation}
            isOpen={true}
          />
        ) : (
          <div className="paper-card rounded-2xl overflow-hidden">
            <HomeSchedulerView 
              onSelectTimeSlot={handleSelectTimeSlot} 
            />
          </div>
        )}
      </main>
      
      <Footer />
      
      <ConfirmationModal
        open={confirmedReservationId !== null}
        onClose={handleCloseConfirmation}
        reservationId={confirmedReservationId || ""}
      />
    </div>
  );
};

export default Index;

