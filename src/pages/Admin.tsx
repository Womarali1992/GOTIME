import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDataService } from "@/hooks/use-data-service";
import { format } from "date-fns";
import AdminCalendarView from "@/components/AdminCalendarView";
import { useState } from "react";
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

const Admin = () => {
  const dataService = useDataService();
  const [editingCourt, setEditingCourt] = useState<any>(null);
  const [schedulingCourt, setSchedulingCourt] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [showAddUserToReservation, setShowAddUserToReservation] = useState(false);
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
    dataService.addClinic(clinicData);
    console.log("Added clinic:", clinicData);
  };

  const handleAddUserToReservation = (reservationData: any) => {
    try {
      const result = dataService.reservationService.createReservation({
        timeSlotId: reservationData.timeSlotId,
        courtId: reservationData.courtId,
        playerName: reservationData.playerName,
        playerEmail: reservationData.playerEmail,
        playerPhone: reservationData.playerPhone,
        players: reservationData.players,
      });
      if (!result.success) {
        console.error("Error creating reservation:", result.error);
      } else {
        console.log("Added user to reservation:", result.reservation);
      }
      dataService.refresh();
    } catch (error) {
      console.error("Error adding user to reservation:", error);
      // In a real app, you'd show a toast notification here
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
      
      <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage courts, view reservations, and configure system settings.
          </p>
        </div>
        
        <Tabs defaultValue="scheduler" className="space-y-6">
          <div className="mb-6 overflow-x-auto scrollbar-hide flex justify-center">
            <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/50 inline-flex h-auto p-2 gap-1 min-w-max">
              <TabsTrigger value="scheduler" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Scheduler</TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Calendar</TabsTrigger>
              <TabsTrigger value="reservations" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Reservations</TabsTrigger>
              <TabsTrigger value="courts" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Courts</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Users</TabsTrigger>
              <TabsTrigger value="coaches" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Coaches</TabsTrigger>
              <TabsTrigger value="clinics" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Clinics</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Notes</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Settings</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="scheduler" className="space-y-6">
            <SchedulerChart
              key={refreshKey}
              courts={courts}
              timeSlots={timeSlots}
              onScheduleCourt={setSchedulingCourt}
              onDateChange={(date) => {
                // Ensure time slots exist for the selected date range
                const startDate = date;
                const endDate = new Date(date);
                endDate.setDate(endDate.getDate() + 6); // Generate slots for a week
                dataService.ensureTimeSlotsForDateRange(startDate, endDate);
              }}
            />
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-6">
            <AdminCalendarView />
          </TabsContent>



          <TabsContent value="reservations" className="space-y-6">
            <CourtTimeSlots
              courts={courts}
              timeSlots={timeSlots}
              reservations={reservations}
              coaches={coaches}
              clinics={clinics}
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
            />
          </TabsContent>
          
          <TabsContent value="courts" className="space-y-6">
            <CourtsSection 
              courts={courts} 
              onEditCourt={(court) => setEditingCourt(court)} 
              onScheduleCourt={(court) => setSchedulingCourt(court)} 
            />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <UsersSection 
              users={users} 
              onAddUser={() => setShowAddUser(true)} 
              onEditUserComments={(user) => setEditingUserComments(user)} 
            />
          </TabsContent>

          <TabsContent value="coaches" className="space-y-6">
            <CoachesSection coaches={coaches} onAddCoach={() => setShowAddCoach(true)} />
          </TabsContent>

          <TabsContent value="clinics" className="space-y-6">
            <ClinicsSection clinics={clinics} coaches={coaches} courts={courts} onAddClinic={() => setShowAddClinic(true)} />
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

          <TabsContent value="settings">
            <AdminSettings onSettingsUpdate={(updatedSettings) => {
              console.log('Settings updated:', updatedSettings);
              // In a real app, you might want to refresh data or show a notification
            }} />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />

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
