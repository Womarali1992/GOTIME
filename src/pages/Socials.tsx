import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialsSection from "@/components/SocialsSection";
import { useBookings } from "@/hooks/use-bookings";
import type { CreateSocial } from "@/lib/validation/schemas";
import { toast } from "sonner";

const Socials = () => {
  const [currentUserId] = useState("user-1");
  const [currentUserName] = useState("Guest Player");
  const {
    socials,
    createSocial,
    updateSocial,
    deleteSocial,
    addVoteToSocial
  } = useBookings();

  const handleCreateSocial = async (data: CreateSocial) => {
    try {
      // Use centralized hook - auto-refreshes state
      await createSocial(data as any);
      toast.success("Social created!");
    } catch (error) {
      toast.error("Failed to create social");
      console.error(error);
    }
  };

  const handleVoteForTimeSlot = async (socialId: string, timeSlotId: string) => {
    try {
      // Use centralized hook - auto-refreshes state
      await addVoteToSocial(socialId, currentUserId, 'yes');
      toast.success("Vote recorded!");
    } catch (error) {
      toast.error("Failed to vote");
      console.error(error);
    }
  };

  const handleLockTimeSlot = async (socialId: string, timeSlotId: string) => {
    try {
      // Use centralized hook - auto-refreshes state
      await updateSocial(socialId, { status: 'locked' });
      toast.success("Time slot locked!");
    } catch (error) {
      toast.error("Failed to lock time slot");
      console.error(error);
    }
  };

  const handleUnlockTimeSlot = async (socialId: string) => {
    try {
      // Use centralized hook - auto-refreshes state
      await updateSocial(socialId, { status: 'active' });
      toast.success("Time slot unlocked!");
    } catch (error) {
      toast.error("Failed to unlock time slot");
      console.error(error);
    }
  };

  const handleDeleteSocial = async (socialId: string) => {
    try {
      // Use centralized hook - auto-refreshes state
      await deleteSocial(socialId);
      toast.success("Social deleted!");
    } catch (error) {
      toast.error("Failed to delete social");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8">
        <SocialsSection
          socials={socials}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
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
