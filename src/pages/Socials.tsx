import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialsSection from "@/components/SocialsSection";
import { apiDataService } from "@/lib/services/api-data-service";
import type { Social, CreateSocial } from "@/lib/validation/schemas";
import { toast } from "sonner";
import { useDataService } from "@/hooks/use-data-service";

const Socials = () => {
  const [currentUserId] = useState("user-1");
  const [currentUserName] = useState("Guest Player");
  const dataService = useDataService();
  const { socials, refresh } = dataService;

  const handleCreateSocial = async (data: CreateSocial) => {
    try {
      const newSocial = await apiDataService.createSocial(data as any);
      toast.success("Social created!");
      refresh();
    } catch (error) {
      toast.error("Failed to create social");
      console.error(error);
    }
  };

  const handleVoteForTimeSlot = async (socialId: string, timeSlotId: string) => {
    try {
      await apiDataService.addVoteToSocial(socialId, currentUserId, 'yes');
      toast.success("Vote recorded!");
      refresh();
    } catch (error) {
      toast.error("Failed to vote");
      console.error(error);
    }
  };

  const handleLockTimeSlot = async (socialId: string, timeSlotId: string) => {
    try {
      await apiDataService.updateSocial(socialId, { status: 'locked' });
      toast.success("Time slot locked!");
      refresh();
    } catch (error) {
      toast.error("Failed to lock time slot");
      console.error(error);
    }
  };

  const handleUnlockTimeSlot = async (socialId: string) => {
    try {
      await apiDataService.updateSocial(socialId, { status: 'active' });
      toast.success("Time slot unlocked!");
      refresh();
    } catch (error) {
      toast.error("Failed to unlock time slot");
      console.error(error);
    }
  };

  const handleDeleteSocial = async (socialId: string) => {
    try {
      await apiDataService.deleteSocial(socialId);
      toast.success("Social deleted!");
      refresh();
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
