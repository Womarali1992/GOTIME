import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialsSection from "@/components/SocialsSection";
import { socialRepository } from "@/lib/data";
import type { Social, CreateSocial } from "@/lib/validation/schemas";
import { toast } from "sonner";
import { useDataService } from "@/hooks/use-data-service";

const Socials = () => {
  const [socials, setSocials] = useState<Social[]>([]);
  const [currentUserId] = useState("user-1"); // In a real app, get from auth context
  const [currentUserName] = useState("Guest Player"); // In a real app, get from auth context
  const dataService = useDataService();

  useEffect(() => {
    // Load upcoming socials
    loadSocials();
  }, []);

  const loadSocials = () => {
    const upcomingSocials = socialRepository.findUpcoming();
    setSocials(upcomingSocials);
  };

  const handleCreateSocial = (data: CreateSocial) => {
    try {
      const newSocial = socialRepository.create(data);

      // Create time slots for all voting options on the schedule
      // Use the courtId from the social data
      if (data.courtId) {
        newSocial.timeSlots.forEach((timeSlot) => {
          const [hours, minutes] = timeSlot.time.split(':');
          const startHour = parseInt(hours);
          const endTime = `${(startHour + 1).toString().padStart(2, '0')}:${minutes}`;

          try {
            dataService.createTimeSlot({
              courtId: data.courtId,
              date: newSocial.date,
              startTime: timeSlot.time,
              endTime: endTime,
              available: true,
              blocked: false,
              type: 'social',
              socialId: newSocial.id,
              comments: []
            });
          } catch (error) {
            console.error("Error creating time slot:", error);
          }
        });
      }

      toast.success("Social created! Time slots added to schedule.");
      loadSocials();
    } catch (error) {
      toast.error("Failed to create social");
      console.error(error);
    }
  };

  const handleVoteForTimeSlot = (socialId: string, timeSlotId: string) => {
    try {
      socialRepository.voteForTimeSlot(socialId, timeSlotId, currentUserId);
      toast.success("Vote recorded!");
      loadSocials();
    } catch (error) {
      toast.error("Failed to vote");
      console.error(error);
    }
  };

  const handleLockTimeSlot = (socialId: string, timeSlotId: string) => {
    try {
      const social = socialRepository.findById(socialId);
      if (!social) {
        toast.error("Social not found");
        return;
      }

      // Lock the time slot in the social
      socialRepository.lockTimeSlot(socialId, timeSlotId);

      // Find the selected time slot
      const selectedSlot = social.timeSlots.find(s => s.id === timeSlotId);
      if (!selectedSlot) {
        toast.error("Time slot not found");
        return;
      }

      // Remove all time slots for this social from the schedule
      const allTimeSlots = dataService.timeSlotService.getAllTimeSlots();
      const socialTimeSlots = allTimeSlots.filter(
        slot => slot.type === 'social' && slot.socialId === socialId
      );

      socialTimeSlots.forEach(slot => {
        // Keep only the locked time slot, delete others
        if (slot.startTime !== selectedSlot.time) {
          dataService.deleteTimeSlot(slot.id);
        }
      });

      toast.success("Time locked in! Other time options removed from schedule.");
      loadSocials();
    } catch (error) {
      toast.error("Failed to lock time");
      console.error(error);
    }
  };

  const handleUnlockTimeSlot = (socialId: string) => {
    try {
      const social = socialRepository.findById(socialId);
      if (!social) {
        toast.error("Social not found");
        return;
      }

      // Unlock the time slot
      socialRepository.unlockTimeSlot(socialId);

      // Re-add all time slots to the schedule
      const courts = dataService.courts;
      if (courts.length > 0) {
        const firstCourt = courts[0];

        social.timeSlots.forEach((timeSlot) => {
          const [hours, minutes] = timeSlot.time.split(':');
          const startHour = parseInt(hours);
          const endTime = `${(startHour + 1).toString().padStart(2, '0')}:${minutes}`;

          // Check if time slot already exists
          const existingSlot = dataService.timeSlotService.getAllTimeSlots().find(
            slot => slot.courtId === firstCourt.id &&
                    slot.date === social.date &&
                    slot.startTime === timeSlot.time &&
                    slot.type === 'social' &&
                    slot.socialId === socialId
          );

          if (!existingSlot) {
            try {
              dataService.createTimeSlot({
                courtId: firstCourt.id,
                date: social.date,
                startTime: timeSlot.time,
                endTime: endTime,
                available: true,
                blocked: false,
                type: 'social',
                socialId: social.id,
                comments: []
              });
            } catch (error) {
              console.error("Error creating time slot:", error);
            }
          }
        });
      }

      toast.success("Social unlocked! All time options restored to schedule.");
      loadSocials();
    } catch (error) {
      toast.error("Failed to unlock time");
      console.error(error);
    }
  };

  const handleDeleteSocial = (socialId: string) => {
    try {
      const social = socialRepository.findById(socialId);
      if (!social) {
        toast.error("Social not found");
        return;
      }

      // Remove all time slots for this social from the schedule
      const allTimeSlots = dataService.timeSlotService.getAllTimeSlots();
      const socialTimeSlots = allTimeSlots.filter(
        slot => slot.type === 'social' && slot.socialId === socialId
      );

      socialTimeSlots.forEach(slot => {
        dataService.deleteTimeSlot(slot.id);
      });

      // Delete the social
      socialRepository.delete(socialId);

      // Prevent sample socials from being recreated on refresh
      localStorage.setItem('picklepop_skip_sample_socials', 'true');

      // Ensure data consistency through time slot service
      dataService.timeSlotService.ensureDataConsistency();

      toast.success("Social deleted successfully!");
      loadSocials();
    } catch (error) {
      toast.error("Failed to delete social");
      console.error('Error deleting social:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />

      <main className="flex-1 container py-4 sm:py-8 px-4 sm:px-6">
        <SocialsSection
          socials={socials}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          courts={dataService.courts}
          onCreateSocial={handleCreateSocial}
          onVoteForTimeSlot={handleVoteForTimeSlot}
          onLockTimeSlot={handleLockTimeSlot}
          onUnlockTimeSlot={handleUnlockTimeSlot}
          onDeleteSocial={handleDeleteSocial}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Socials;
