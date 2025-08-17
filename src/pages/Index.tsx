
import { useState } from "react";
import CourtCalendar from "@/components/CourtCalendar";
import HomeSchedulerView from "@/components/HomeSchedulerView";
import ReservationForm from "@/components/ReservationForm";
import ConfirmationModal from "@/components/ConfirmationModal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TimeSlot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar, Grid3X3 } from "lucide-react";

const Index = () => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [confirmedReservationId, setConfirmedReservationId] = useState<string | null>(null);
  const [isSchedulerView, setIsSchedulerView] = useState<boolean>(true);
  
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
      
      <main className="flex-1 container py-8">
        <div className="mb-8 text-center">
          <div className="paper-card p-8 rounded-2xl">
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">
              Book Your Pickleball Court
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              Browse available courts, select your preferred time, and secure your spot in just a few clicks.
            </p>
          </div>
        </div>

        {selectedTimeSlot ? (
          <div className="paper-card rounded-2xl">
            <ReservationForm
              selectedTimeSlot={selectedTimeSlot}
              onCancel={handleCancelReservation}
              onComplete={handleCompleteReservation}
            />
          </div>
        ) : (
          <>
            {/* View Toggle */}
            <div className="flex justify-center mb-8">
              <div className="paper-card flex items-center space-x-1 p-2 rounded-xl">
                <Button
                  variant={isSchedulerView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsSchedulerView(true)}
                  className="flex items-center space-x-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Scheduler View</span>
                </Button>
                <Button
                  variant={!isSchedulerView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsSchedulerView(false)}
                  className="flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Calendar View</span>
                </Button>
              </div>
            </div>

            {/* Content based on selected view */}
            <div className="paper-card rounded-2xl overflow-hidden">
              {isSchedulerView ? (
                <HomeSchedulerView onSelectTimeSlot={handleSelectTimeSlot} />
              ) : (
                <CourtCalendar onSelectTimeSlot={handleSelectTimeSlot} />
              )}
            </div>
          </>
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
