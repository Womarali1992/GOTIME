
import { useState } from "react";
import CourtCalendar from "@/components/CourtCalendar";
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Book Your Pickleball Court
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse available courts, select your preferred time, and secure your spot in just a few clicks.
          </p>
        </div>
        
        {selectedTimeSlot ? (
          <ReservationForm
            selectedTimeSlot={selectedTimeSlot}
            onCancel={handleCancelReservation}
            onComplete={handleCompleteReservation}
          />
        ) : (
          <CourtCalendar onSelectTimeSlot={handleSelectTimeSlot} />
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
