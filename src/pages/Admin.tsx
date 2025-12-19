import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataService } from "@/hooks/use-data-service";
import { useBookings } from "@/hooks/use-bookings";
import { format } from "date-fns";
import AdminCalendarView from "@/components/AdminCalendarView";
import React, { useState } from "react";
import SchedulerChart from "@/components/SchedulerChart";
import AdminSettings from "@/components/AdminSettings";
import UserSearchForm from "@/components/UserSearchForm";
// import EditNotesForm from "@/components/EditNotesForm"; // Deprecated - using CommentForm instead
import { Clock, User, GraduationCap, StickyNote } from "lucide-react";
import { ReservationSettings } from "@/lib/types";
import type { Comment as AppComment } from "@/lib/types";
import CourtTimeSlots from "@/components/CourtTimeSlots";
import CourtsSection from "@/components/CourtsSection";
import UsersSection from "@/components/UsersSection";
import CoachesSection from "@/components/CoachesSection";
import ClinicsSection from "@/components/ClinicsSection";
import NotesSection from "@/components/NotesSection";
import AdminModalsController from "@/components/AdminModalsController";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const Admin = () => {
  const dataService = useDataService();
  const {
    createReservation,
    updateReservation,
    deleteReservation,
    updateSocial,
    deleteSocial,
  } = useBookings();

  const [editingCourt, setEditingCourt] = useState<any>(null);
  const [schedulingCourt, setSchedulingCourt] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [showAddUserToReservation, setShowAddUserToReservation] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any>(null);
  const [editingSocial, setEditingSocial] = useState<any>(null);
  const [viewingSocial, setViewingSocial] = useState<{social: any, reservation: any} | null>(null);
  const [selectedTimeSlotForForm, setSelectedTimeSlotForForm] = useState<string>("");

  // Comments editing state
  const [editingReservationComments, setEditingReservationComments] = useState<any>(null);
  const [editingUserComments, setEditingUserComments] = useState<any>(null);
  const [editingTimeSlotComments, setEditingTimeSlotComments] = useState<any>(null);

  // Destructure data from the service
  const {
    courts,
    timeSlots,
    reservations,
    users,
    coaches,
    clinics,
    refreshKey
  } = dataService;
  

  
  const handleEditCourt = (courtData: any) => {
    console.log("Editing court:", courtData);
    // In a real app, this would update the court in the database
  };

  const handleScheduleCourt = (scheduleData: any) => {
    console.log("Scheduling court:", scheduleData);
    // In a real app, this would update the court's schedule in the database
  };

  const handleAddUser = (userData: any) => {
    dataService.addUser(userData);
    console.log("Added user:", userData);
  };

  const handleAddCoach = (coachData: any) => {
    dataService.addCoach(coachData);
    console.log("Added coach:", coachData);
  };

  const handleAddClinic = (clinicData: any) => {
    console.log("handleAddClinic called with data:", clinicData);
    console.log("Current clinics count before adding:", clinics.length);
    try {
      const result = dataService.addClinic(clinicData);
      console.log("addClinic result:", result);
      if (result.success) {
        console.log("Successfully added clinic:", result.clinic);
        console.log("Current clinics count after adding:", clinics.length);
        // Force a manual refresh to see if the issue is with the refresh mechanism
        dataService.refresh();
        setTimeout(() => {
          console.log("Clinics count after timeout:", clinics.length);
        }, 100);
      } else {
        console.error("Failed to add clinic:", result.errors);
      }
      return result; // Return the result to the form
    } catch (error) {
      console.error("Exception in handleAddClinic:", error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error occurred'] };
    }
  };

  // Expose debug function to window for console testing
  React.useEffect(() => {
    (window as any).debugCreateClinic = (testData?: any) => {
      console.log("=== CONSOLE DEBUG CLINIC CREATION ===");
      const defaultTestData = {
        name: "Console Test Clinic " + Date.now(),
        description: "This is a test clinic created directly from the browser console to bypass form validation issues",
        coachId: coaches[0]?.id || "1",
        courtId: courts[0]?.id || "1",
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        startTime: "10:00",
        endTime: "11:00",
        maxParticipants: 6,
        price: 50
      };

      const clinicData = testData || defaultTestData;
      console.log("Using clinic data:", clinicData);

      handleAddClinic(clinicData);
    };

    console.log("Debug function exposed: call debugCreateClinic() in console to test clinic creation");
  }, [coaches, courts]);

  const handleAddUserToReservation = async (reservationData: any) => {
    console.log("Creating reservation with data:", reservationData);
    try {
      // Use centralized hook - auto-refreshes state across all views
      const reservation = await createReservation({
        timeSlotId: reservationData.timeSlotId,
        courtId: reservationData.courtId,
        playerName: reservationData.playerName,
        playerEmail: reservationData.playerEmail,
        playerPhone: reservationData.playerPhone,
        players: reservationData.players,
        participants: reservationData.participants || [],
        comments: reservationData.comments || [],
        createdById: reservationData.createdById,
      });
      console.log("Created reservation:", reservation);
      toast.success("Reservation Created", {
        description: `Successfully created reservation for ${reservationData.playerName}`
      });
    } catch (error) {
      console.error("Error creating reservation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to Create Reservation", {
        description: errorMessage
      });
      throw error;
    }
  };

  const handleBlockTimeSlot = (timeSlotId: string) => {
    const result = dataService.timeSlotService.blockTimeSlot(timeSlotId);
    if (!result.success) {
      console.error("Failed to block time slot:", result.error);
    }
  };

  const handleUnblockTimeSlot = (timeSlotId: string) => {
    const result = dataService.timeSlotService.unblockTimeSlot(timeSlotId);
    if (!result.success) {
      console.error("Failed to unblock time slot:", result.error);
    }
  };

  const handleUpdateReservationComments = (comments: AppComment[]) => {
    if (editingReservationComments) {
      dataService.reservationService.updateReservationComments(editingReservationComments.id, comments);
      dataService.refresh();
      console.log("Updated reservation comments:", comments);
    }
  };

  const handleUpdateUserComments = (comments: AppComment[]) => {
    if (editingUserComments) {
      dataService.userService.updateUserComments(editingUserComments.id, comments);
      dataService.refresh();
      console.log("Updated user comments:", comments);
    }
  };

  const handleUpdateTimeSlotComments = (comments: AppComment[]) => {
    if (editingTimeSlotComments) {
      dataService.timeSlotService.updateTimeSlotComments(editingTimeSlotComments.id, comments);
      dataService.refresh();
      console.log("Updated time slot comments:", comments);
    }
  };



  const handleCreateClinic = (timeSlotId: string) => {
    // Placeholder clinic id to mark this slot as clinic; in real app, create clinic first
    const clinicId = dataService.clinicService.getAllClinics()[0]?.id;
    if (!clinicId) {
      console.error("No clinic available to assign to time slot");
      return;
    }
    const result = dataService.timeSlotService.setTimeSlotAsClinic(timeSlotId, clinicId);
    if (!result.success) {
      console.error("Failed to set time slot as clinic:", result.error);
    }
  };

  const handleConvertToSocial = async (reservationId: string) => {
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        console.error("Reservation not found");
        return;
      }

      const timeSlot = timeSlots.find(ts => ts.id === reservation.timeSlotId);
      if (!timeSlot) {
        console.error("Time slot not found");
        return;
      }

      const court = courts.find(c => c.id === reservation.courtId);

      // This feature is deprecated - socials should be created from scratch
      console.log("Convert to social feature temporarily disabled during migration");
    } catch (error) {
      console.error("Error converting reservation to social:", error);
    }
  };

  const handleEditReservation = async (reservationId: string, updates: any) => {
    console.log("Updating reservation:", reservationId, updates);
    try {
      // Use centralized hook - auto-refreshes state across all views
      await updateReservation(reservationId, updates);
    } catch (error) {
      console.error("Error updating reservation:", error);
      throw error;
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    console.log("Deleting reservation:", reservationId);
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      // Use centralized hook - auto-refreshes state across all views
      await deleteReservation(reservationId);
      toast.success("Reservation Cancelled", {
        description: reservation
          ? `Successfully cancelled reservation for ${reservation.playerName}`
          : "Reservation cancelled successfully"
      });
    } catch (error) {
      console.error("Error deleting reservation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to Cancel Reservation", {
        description: errorMessage
      });
      throw error;
    }
  };

  const handleAddUserToSocial = async (socialId: string, userId: string) => {
    console.log("Adding user to social:", socialId, userId);
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error("User not found");
      }

      const socialReservation = reservations.find(r => r.socialId === socialId);
      if (!socialReservation) {
        throw new Error("Reservation not found for this social game");
      }

      const updatedParticipants = [
        ...(socialReservation.participants || []),
        {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isOrganizer: false
        }
      ];

      // Use centralized hook - auto-refreshes state across all views
      await updateReservation(socialReservation.id, {
        participants: updatedParticipants
      });

      // Update local viewing state to reflect changes immediately
      if (viewingSocial?.social.id === socialId) {
        const updatedReservation = { ...socialReservation, participants: updatedParticipants };
        setViewingSocial({ ...viewingSocial, reservation: updatedReservation });
      }
    } catch (error) {
      console.error("Error adding user to social:", error);
      throw error;
    }
  };

  const handleRemoveUserFromSocial = async (socialId: string, userId: string) => {
    console.log("Removing user from social:", socialId, userId);
    try {
      const socialReservation = reservations.find(r => r.socialId === socialId);
      if (!socialReservation) {
        throw new Error("Reservation not found for this social game");
      }

      const updatedParticipants = (socialReservation.participants || []).filter(
        (p: any) => p.id !== userId
      );

      // Use centralized hook - auto-refreshes state across all views
      await updateReservation(socialReservation.id, {
        participants: updatedParticipants
      });

      // Update local viewing state to reflect changes immediately
      if (viewingSocial?.social.id === socialId) {
        const updatedReservation = { ...socialReservation, participants: updatedParticipants };
        setViewingSocial({ ...viewingSocial, reservation: updatedReservation });
      }
    } catch (error) {
      console.error("Error removing user from social:", error);
      throw error;
    }
  };

  const handleEditSocial = async (socialId: string, updates: any) => {
    console.log("Updating social game:", socialId, updates);
    try {
      // Use centralized hook - auto-refreshes state across all views
      await updateSocial(socialId, updates);
      toast.success("Social Game Updated", {
        description: `Successfully updated social game: ${updates.title || 'Social game'}`
      });
    } catch (error) {
      console.error("Error updating social game:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to Update Social Game", {
        description: errorMessage
      });
      throw error;
    }
  };

  const handleDeleteSocial = async (socialId: string) => {
    console.log("Deleting social game:", socialId);
    try {
      const social = dataService.socials.find(s => s.id === socialId);
      const socialReservation = reservations.find(r => r.socialId === socialId);

      // Delete the reservation first if it exists (auto-refreshes state)
      if (socialReservation) {
        await deleteReservation(socialReservation.id);
      }

      // Then delete the social game (auto-refreshes state)
      await deleteSocial(socialId);

      toast.success("Social Game Cancelled", {
        description: social
          ? `Successfully cancelled social game: ${social.title}`
          : "Social game cancelled successfully"
      });
      setViewingSocial(null);
    } catch (error) {
      console.error("Error deleting social game:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to Cancel Social Game", {
        description: errorMessage
      });
      throw error;
    }
  };

  // Group ALL time slots by date, not just reservations
  const slotsByDate: Record<string, typeof timeSlots> = {};
  
  timeSlots.forEach(slot => {
    if (!slotsByDate[slot.date]) {
      slotsByDate[slot.date] = [];
    }
    slotsByDate[slot.date].push(slot);
  });
  
  // Sort dates in ascending order
  const sortedDates = Object.keys(slotsByDate).sort();

  // Function to get clinic for a time slot
  const getClinicForSlot = (slot: any) => {
    if (slot.type === 'clinic' && slot.clinicId) {
      return clinics.find(clinic => clinic.id === slot.clinicId);
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background/90 to-background/90">
      <Header />
      
      <main className="flex-1 container px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage courts, view reservations, and configure system settings.
          </p>
        </div>
        
        <Tabs defaultValue="reservations" className="space-y-4 sm:space-y-6">
          <div className="mb-4 sm:mb-6">
            {/* Mobile: Grid layout with 2 columns */}
            <div className="sm:hidden">
              <TabsList className="bg-gradient-to-r from-purple-50/80 via-orange-50/60 to-purple-50/80 backdrop-blur supports-[backdrop-filter]:bg-purple-50/60 border border-purple-200/50 grid grid-cols-2 gap-1 p-1 h-auto w-full">
                <TabsTrigger value="reservations" className="text-xs px-2 py-2 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Reservations</TabsTrigger>
                <TabsTrigger value="courts" className="text-xs px-2 py-2 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Courts</TabsTrigger>
                <TabsTrigger value="users" className="text-xs px-2 py-2 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Users</TabsTrigger>
                <TabsTrigger value="clinics" className="text-xs px-2 py-2 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Clinics</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs px-2 py-2 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Settings</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Desktop: Horizontal scrollable layout */}
            <div className="hidden sm:block overflow-x-auto scrollbar-hide">
              <TabsList className="bg-gradient-to-r from-purple-50/80 via-orange-50/60 to-purple-50/80 backdrop-blur supports-[backdrop-filter]:bg-purple-50/60 border border-purple-200/50 flex w-full h-auto p-2 gap-1">
                <TabsTrigger value="reservations" className="text-sm px-3 py-2 whitespace-nowrap flex-1 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Reservations</TabsTrigger>
                <TabsTrigger value="courts" className="text-sm px-3 py-2 whitespace-nowrap flex-1 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Courts</TabsTrigger>
                <TabsTrigger value="users" className="text-sm px-3 py-2 whitespace-nowrap flex-1 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Users</TabsTrigger>
                <TabsTrigger value="clinics" className="text-sm px-3 py-2 whitespace-nowrap flex-1 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Clinics</TabsTrigger>
                <TabsTrigger value="settings" className="text-sm px-3 py-2 whitespace-nowrap flex-1 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Settings</TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          <TabsContent value="reservations" className="space-y-6">
            <Tabs defaultValue="overview" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-gradient-to-r from-purple-50/80 via-orange-50/60 to-purple-50/80 backdrop-blur supports-[backdrop-filter]:bg-purple-50/60 border border-purple-200/50 flex w-full h-auto p-1 gap-1">
                  <TabsTrigger value="overview" className="text-sm px-3 py-2 whitespace-nowrap flex-1 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Overview</TabsTrigger>
                  <TabsTrigger value="scheduler" className="text-sm px-3 py-2 whitespace-nowrap flex-1 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Scheduler</TabsTrigger>
                  <TabsTrigger value="calendar" className="text-sm px-3 py-2 whitespace-nowrap flex-1 data-[state=active]:bg-green-400/60 data-[state=active]:text-green-900 data-[state=inactive]:text-purple-800 data-[state=inactive]:hover:bg-orange-100/50">Calendar</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <CourtTimeSlots
                  courts={courts}
                  timeSlots={timeSlots}
                  reservations={reservations}
                  coaches={coaches}
                  clinics={clinics}
                  users={users}
                  refreshKey={refreshKey}
                  onAddUserToReservationRequested={(timeSlotId) => {
                    setSelectedTimeSlotForForm(timeSlotId || "");
                    setShowAddUserToReservation(true);
                  }}
                  onOpenReservationComments={(context) => {
                    setEditingReservationComments(context);
                  }}
                  onOpenTimeSlotComments={(context) => {
                    setEditingTimeSlotComments(context);
                  }}
                  onBlockTimeSlot={handleBlockTimeSlot}
                  onUnblockTimeSlot={handleUnblockTimeSlot}
                  onCreateClinicForTimeSlot={handleCreateClinic}
                  onConvertToSocial={handleConvertToSocial}
                  onEditReservation={(reservation) => setEditingReservation(reservation)}
                  onCancelReservation={handleDeleteReservation}
                  onEditSocial={(social) => setEditingSocial(social)}
                  onCancelSocial={handleDeleteSocial}
                  onViewSocial={(social, reservation) => setViewingSocial({ social, reservation })}
                />
              </TabsContent>

              <TabsContent value="scheduler" className="space-y-6">
                <SchedulerChart
                  courts={courts}
                  timeSlots={timeSlots}
                  onScheduleCourt={setSchedulingCourt}
                  onAddUserToReservation={(timeSlotId) => {
                    setSelectedTimeSlotForForm(timeSlotId);
                    setShowAddUserToReservation(true);
                  }}
                />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-6">
                <AdminCalendarView
                  refreshKey={refreshKey}
                  onAddUserToReservation={(timeSlotId) => {
                    setSelectedTimeSlotForForm(timeSlotId);
                    setShowAddUserToReservation(true);
                  }}
                  onEditReservation={(reservation) => setEditingReservation(reservation)}
                  onCancelReservation={handleDeleteReservation}
                  onEditSocial={(social) => setEditingSocial(social)}
                  onCancelSocial={handleDeleteSocial}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="courts" className="space-y-6">
            <CourtsSection 
              courts={courts} 
              onEditCourt={(court) => setEditingCourt(court)} 
              onScheduleCourt={(court) => setSchedulingCourt(court)} 
            />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/50 inline-flex h-auto p-1 gap-1">
                <TabsTrigger value="users" className="text-sm px-3 py-2 whitespace-nowrap">Users</TabsTrigger>
                <TabsTrigger value="notes" className="text-sm px-3 py-2 whitespace-nowrap">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-6">
                <UsersSection 
                  users={users} 
                  onAddUser={() => setShowAddUser(true)} 
                  onEditUserComments={(user) => setEditingUserComments(user)} 
                />
              </TabsContent>

              <TabsContent value="notes" className="space-y-6">
                <NotesSection 
                  enrichedTimeSlots={dataService.getTimeSlotsWithNotes()}
                  itemsWithComments={dataService.getAllItemsWithComments()}
                  courts={courts}
                  timeSlots={timeSlots}
                  reservations={reservations}
                  users={users}
                  coaches={coaches}
                  onOpenReservationComments={(ctx) => setEditingReservationComments(ctx)}
                  onOpenUserComments={(user) => setEditingUserComments(user)}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="clinics" className="space-y-6">
            <Tabs defaultValue="clinics" className="space-y-4">
              <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/50 inline-flex h-auto p-1 gap-1">
                <TabsTrigger value="clinics" className="text-sm px-3 py-2 whitespace-nowrap">Clinics</TabsTrigger>
                <TabsTrigger value="coaches" className="text-sm px-3 py-2 whitespace-nowrap">Coaches</TabsTrigger>
              </TabsList>

              <TabsContent value="clinics" className="space-y-6">
                <ClinicsSection clinics={clinics} coaches={coaches} courts={courts} onAddClinic={() => setShowAddClinic(true)} />
              </TabsContent>

              <TabsContent value="coaches" className="space-y-6">
                <CoachesSection coaches={coaches} onAddCoach={() => setShowAddCoach(true)} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <AdminSettings onSettingsUpdate={(updatedSettings) => {
                console.log('Settings updated:', updatedSettings);
                // Trigger calendar refresh
                setCalendarRefreshKey(prev => prev + 1);
              }} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
      <Toaster />

      <AdminModalsController
        editingCourt={editingCourt}
        onCloseEditCourt={() => setEditingCourt(null)}
        onSaveEditCourt={handleEditCourt}
        schedulingCourt={schedulingCourt}
        onCloseScheduleCourt={() => setSchedulingCourt(null)}
        onSaveScheduleCourt={handleScheduleCourt}
        showAddUser={showAddUser}
        onCloseAddUser={() => setShowAddUser(false)}
        onSaveAddUser={handleAddUser}
        showAddCoach={showAddCoach}
        onCloseAddCoach={() => setShowAddCoach(false)}
        onSaveAddCoach={handleAddCoach}
        showAddClinic={showAddClinic}
        onCloseAddClinic={() => setShowAddClinic(false)}
        onSaveAddClinic={handleAddClinic}
        showAddUserToReservation={showAddUserToReservation}
        onCloseAddUserToReservation={() => {
          setShowAddUserToReservation(false);
          setSelectedTimeSlotForForm("");
        }}
        onSaveAddUserToReservation={handleAddUserToReservation}
        editingReservation={editingReservation}
        onCloseEditReservation={() => setEditingReservation(null)}
        onSaveEditReservation={handleEditReservation}
        onDeleteReservation={handleDeleteReservation}
        editingSocial={editingSocial}
        onCloseEditSocial={() => setEditingSocial(null)}
        onSaveEditSocial={handleEditSocial}
        onDeleteSocial={handleDeleteSocial}
        onEditSocialRequested={(social) => {
          setViewingSocial(null);
          setEditingSocial(social);
        }}
        viewingSocial={viewingSocial}
        onCloseViewSocial={() => setViewingSocial(null)}
        onAddUserToSocial={handleAddUserToSocial}
        onRemoveUserFromSocial={handleRemoveUserFromSocial}
        timeSlots={timeSlots}
        users={users}
        clinics={clinics}
        courts={courts}
        preSelectedTimeSlot={selectedTimeSlotForForm}
        editingReservationComments={editingReservationComments}
        onCloseReservationComments={() => setEditingReservationComments(null)}
        onSaveReservationComments={handleUpdateReservationComments}
        editingUserComments={editingUserComments}
        onCloseUserComments={() => setEditingUserComments(null)}
        onSaveUserComments={handleUpdateUserComments}
        editingTimeSlotComments={editingTimeSlotComments}
        onCloseTimeSlotComments={() => setEditingTimeSlotComments(null)}
        onSaveTimeSlotComments={handleUpdateTimeSlotComments}
      />


    </div>
  );
};

export default Admin;
