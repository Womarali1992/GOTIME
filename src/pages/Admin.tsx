import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { reservations, courts, timeSlots, users, coaches, clinics, addUser, addCoach, addClinic, addUserToReservation, blockTimeSlot, unblockTimeSlot } from "@/lib/data";
import { format } from "date-fns";
import AdminCalendarView from "@/components/AdminCalendarView";
import { useState } from "react";
import EditCourtForm from "@/components/EditCourtForm";
import ScheduleCourtForm from "@/components/ScheduleCourtForm";
import SchedulerChart from "@/components/SchedulerChart";
import AddUserForm from "@/components/AddUserForm";
import AddCoachForm from "@/components/AddCoachForm";
import AddClinicForm from "@/components/AddClinicForm";
import AddUserToReservationForm from "@/components/AddUserToReservationForm";
import AdminSettings from "@/components/AdminSettings";
import { Clock, User, GraduationCap } from "lucide-react";
import { ReservationSettings } from "@/lib/types";

const Admin = () => {
  const [editingCourt, setEditingCourt] = useState<any>(null);
  const [schedulingCourt, setSchedulingCourt] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [showAddUserToReservation, setShowAddUserToReservation] = useState(false);
  const [selectedTimeSlotForForm, setSelectedTimeSlotForForm] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleEditCourt = (courtData: any) => {
    console.log("Editing court:", courtData);
    // In a real app, this would update the court in the database
  };

  const handleScheduleCourt = (scheduleData: any) => {
    console.log("Scheduling court:", scheduleData);
    // In a real app, this would update the court's schedule in the database
  };

  const handleAddUser = (userData: any) => {
    addUser(userData);
    console.log("Added user:", userData);
  };

  const handleAddCoach = (coachData: any) => {
    addCoach(coachData);
    console.log("Added coach:", coachData);
  };

  const handleAddClinic = (clinicData: any) => {
    addClinic(clinicData);
    setRefreshKey(prev => prev + 1); // Force re-render
    console.log("Added clinic:", clinicData);
  };

  const handleAddUserToReservation = (reservationData: any) => {
    try {
      addUserToReservation(
        reservationData.timeSlotId,
        reservationData.courtId,
        reservationData.playerName,
        reservationData.playerEmail,
        reservationData.playerPhone,
        reservationData.players
      );
      setRefreshKey(prev => prev + 1); // Force re-render
      console.log("Added user to reservation:", reservationData);
    } catch (error) {
      console.error("Error adding user to reservation:", error);
      // In a real app, you'd show a toast notification here
    }
  };

  const handleBlockTimeSlot = (timeSlotId: string) => {
    if (blockTimeSlot(timeSlotId)) {
      setRefreshKey(prev => prev + 1); // Force re-render
      console.log("Blocked time slot:", timeSlotId);
    }
  };

  const handleUnblockTimeSlot = (timeSlotId: string) => {
    if (unblockTimeSlot(timeSlotId)) {
      setRefreshKey(prev => prev + 1); // Force re-render
      console.log("Unblocked time slot:", timeSlotId);
    }
  };

  const handleCreateClinic = (timeSlotId: string) => {
    // In a real app, this would open a clinic creation form
    console.log("Creating clinic for time slot:", timeSlotId);
    // For now, just block the slot to simulate clinic creation
    if (blockTimeSlot(timeSlotId)) {
      setRefreshKey(prev => prev + 1);
      console.log("Created clinic (blocked slot):", timeSlotId);
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
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage courts, view reservations, and configure system settings.
          </p>
        </div>
        
        <Tabs defaultValue="scheduler" className="space-y-6">
          <TabsList className="mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/50">
            <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="coaches">Coaches</TabsTrigger>
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scheduler" className="space-y-6">
            <SchedulerChart 
              key={refreshKey}
              courts={courts} 
              timeSlots={timeSlots} 
              onScheduleCourt={setSchedulingCourt} 
            />
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-6">
            <AdminCalendarView />
          </TabsContent>

          <TabsContent value="reservations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">
                Time Slots Overview
              </h2>
              <div className="flex gap-3">
                                 <Button 
                   className="bg-primary hover:bg-primary/90"
                   onClick={() => {
                     setSelectedTimeSlotForForm("");
                     setShowAddUserToReservation(true);
                   }}
                 >
                   Add User to Reservation
                 </Button>
                <Button className="bg-primary hover:bg-primary/90">Add Time Slot</Button>
              </div>
            </div>
            
                         <div className="text-sm text-muted-foreground mb-4">
               💡 Click on available time slots or clinics to add users to them. You can also use the "Add User to Reservation" button above.
             </div>
            
            {courts.map((court) => (
              <Card key={court.id} className="border border-input bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-foreground">{court.name}</CardTitle>
                  <CardDescription>
                    <Badge
                      variant={court.indoor ? "secondary" : "outline"}
                      className={court.indoor ? "bg-secondary/20" : "border-primary/20"}
                    >
                      {court.indoor ? "Indoor" : "Outdoor"}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sortedDates.map((date) => {
                      const courtSlots = slotsByDate[date].filter(
                        (slot) => slot.courtId === court.id
                      );

                      if (courtSlots.length === 0) return null;

                      return (
                        <div key={date} className="space-y-3">
                          <h3 className="text-base font-semibold text-foreground mb-2">
                            {format(new Date(date), "EEEE, MMMM d, yyyy")}
                          </h3>
                          <div className="space-y-2">
                            {courtSlots.map((slot) => {
                              const reservation = reservations.find(
                                (r) => r.timeSlotId === slot.id
                              );
                              const clinic = getClinicForSlot(slot);

                              return (
                                                                <div
                                  key={slot.id}
                                  className={`min-h-[4rem] rounded-sm flex items-center px-4 transition-all duration-300 hover:scale-[1.01] ${
                                    clinic
                                      ? "bg-yellow-500/30 text-yellow-800 border border-yellow-500/50 cursor-pointer"
                                      : reservation
                                      ? "bg-secondary/20 text-secondary-foreground"
                                      : slot.blocked
                                      ? "bg-red-500/20 text-red-800 border border-red-500/50"
                                      : slot.available
                                      ? "bg-primary/20 text-primary-foreground cursor-pointer"
                                      : "bg-muted/80 text-muted-foreground"
                                  }`}
                                                                     onClick={() => {
                                     if (slot.available && !slot.blocked) {
                                       setSelectedTimeSlotForForm(slot.id);
                                       setShowAddUserToReservation(true);
                                     }
                                   }}
                                >
                                  <div className="flex items-center justify-between w-full gap-4">
                                    <div className="min-w-[150px]">
                                      {clinic ? (
                                        <div>
                                          <span className="font-semibold text-base">
                                            {clinic.name}
                                          </span>
                                          <div className="text-sm text-muted-foreground">
                                            Coach: {coaches.find(c => c.id === clinic.coachId)?.name}
                                          </div>
                                        </div>
                                      ) : reservation ? (
                                        <div>
                                          <span className="font-semibold text-base">
                                            {reservation.playerName}
                                          </span>
                                          <div className="text-sm text-muted-foreground">
                                            ({reservation.players} player{reservation.players !== 1 ? 's' : ''})
                                          </div>
                                        </div>
                                                                             ) : (
                                         <span className="text-base font-medium !text-foreground">
                                           {slot.available ? "Available" : "Blocked"}
                                         </span>
                                       )}
                                    </div>
                                    
                                                                         <div className="flex items-center gap-2 flex-1 justify-center">
                                       <Clock className="h-5 w-5" />
                                       <span className="text-lg font-semibold whitespace-nowrap !text-foreground">
                                         {slot.startTime} - {slot.endTime}
                                       </span>
                                     </div>

                                    <div className="flex items-center gap-2">
                                      {clinic ? (
                                        <Badge
                                          variant="default"
                                          className="text-sm shrink-0 min-w-[80px] justify-center bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
                                        >
                                          Clinic
                                        </Badge>
                                                                             ) : reservation ? (
                                         <Badge
                                           variant="outline"
                                           className="text-sm shrink-0 min-w-[80px] justify-center bg-blue-500/20 !text-blue-700 border-blue-500/30"
                                         >
                                           Reserved
                                         </Badge>
                                      ) : slot.blocked ? (
                                        <div className="relative">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger>
                                                                                             <Badge
                                                 variant="destructive"
                                                 className="text-sm shrink-0 min-w-[80px] justify-center cursor-pointer hover:bg-red-500/20"
                                               >
                                                 Blocked
                                               </Badge>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent 
                                              align="end" 
                                              className="z-[9999]"
                                              sideOffset={5}
                                            >
                                              <DropdownMenuItem
                                                onClick={() => handleUnblockTimeSlot(slot.id)}
                                                className="text-green-600 focus:text-green-600"
                                              >
                                                Unblock
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      ) : (
                                        <div className="relative">
                                          <DropdownMenu>
                                                                                         <DropdownMenuTrigger>
                                               <Badge
                                                 variant="outline"
                                                 className="text-sm shrink-0 min-w-[80px] justify-center cursor-pointer bg-green-500/20 !text-green-700 border-green-500/30 hover:bg-green-500/30"
                                               >
                                                 Available
                                               </Badge>
                                             </DropdownMenuTrigger>
                                            <DropdownMenuContent 
                                              align="end" 
                                              className="z-[9999]"
                                              sideOffset={5}
                                            >
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setSelectedTimeSlotForForm(slot.id);
                                                  setShowAddUserToReservation(true);
                                                }}
                                              >
                                                Book
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => handleCreateClinic(slot.id)}
                                              >
                                                Create Clinic
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => handleBlockTimeSlot(slot.id)}
                                                className="text-red-600 focus:text-red-600"
                                              >
                                                Block
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="courts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Courts
              </h2>
              <Button className="bg-primary/90 hover:bg-primary/80">Add Court</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courts.map(court => (
                <Card key={court.id} className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {court.name}
                      </CardTitle>
                      <Badge variant={court.indoor ? "secondary" : "outline"} className={court.indoor ? "bg-secondary/20" : "border-primary/20"}>
                        {court.indoor ? "Indoor" : "Outdoor"}
                      </Badge>
                    </div>
                    <CardDescription>{court.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      ID: {court.id}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingCourt(court)}
                        className="border-primary/20 hover:bg-primary/10"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSchedulingCourt(court)}
                        className="border-primary/20 hover:bg-primary/10"
                      >
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Users
              </h2>
              <Button className="bg-primary/90 hover:bg-primary/80" onClick={() => setShowAddUser(true)}>
                Add User
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <Card key={user.id} className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {user.name}
                      </CardTitle>
                      <Badge variant={user.membershipType === 'premium' ? 'default' : user.membershipType === 'admin' ? 'secondary' : 'outline'}>
                        {user.membershipType}
                      </Badge>
                    </div>
                    <CardDescription>
                      <div className="space-y-1">
                        <div>{user.email}</div>
                        <div>{user.phone}</div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="coaches" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Coaches
              </h2>
              <Button className="bg-primary/90 hover:bg-primary/80" onClick={() => setShowAddCoach(true)}>
                Add Coach
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coaches.map(coach => (
                <Card key={coach.id} className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {coach.name}
                      </CardTitle>
                      <Badge variant="secondary">${coach.hourlyRate}/hr</Badge>
                    </div>
                    <CardDescription>
                      <div className="space-y-2">
                        <div>{coach.email}</div>
                        <div>{coach.phone}</div>
                        <div className="text-sm">{coach.bio}</div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {coach.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="clinics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Clinics
              </h2>
              <Button className="bg-primary/90 hover:bg-primary/80" onClick={() => setShowAddClinic(true)}>
                Add Clinic
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clinics.map(clinic => {
                const coach = coaches.find(c => c.id === clinic.coachId);
                const court = courts.find(c => c.id === clinic.courtId);
                
                return (
                  <Card key={clinic.id} className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5">
                    <CardHeader>
                      <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {clinic.name}
                      </CardTitle>
                      <CardDescription>
                        <div className="space-y-1">
                          <div className="font-medium">Coach: {coach?.name}</div>
                          <div>Court: {court?.name}</div>
                          <div>{clinic.date} • {clinic.startTime} - {clinic.endTime}</div>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{clinic.description}</p>
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">Max: {clinic.maxParticipants} players</Badge>
                          <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">${clinic.price}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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

      {/* Forms */}
      {editingCourt && (
        <EditCourtForm
          court={editingCourt}
          isOpen={!!editingCourt}
          onClose={() => setEditingCourt(null)}
          onSave={handleEditCourt}
        />
      )}

      {schedulingCourt && (
        <ScheduleCourtForm
          court={schedulingCourt}
          isOpen={!!schedulingCourt}
          onClose={() => setSchedulingCourt(null)}
          onSave={handleScheduleCourt}
        />
      )}

      {showAddUser && (
        <AddUserForm
          isOpen={showAddUser}
          onClose={() => setShowAddUser(false)}
          onSave={handleAddUser}
        />
      )}

      {showAddCoach && (
        <AddCoachForm
          isOpen={showAddCoach}
          onClose={() => setShowAddCoach(false)}
          onSave={handleAddCoach}
        />
      )}

      {showAddClinic && (
        <AddClinicForm
          isOpen={showAddClinic}
          onClose={() => setShowAddClinic(false)}
          onSave={handleAddClinic}
        />
      )}

             {showAddUserToReservation && (
         <AddUserToReservationForm
           isOpen={showAddUserToReservation}
           onClose={() => {
             setShowAddUserToReservation(false);
             setSelectedTimeSlotForForm("");
           }}
           onSave={handleAddUserToReservation}
           timeSlots={timeSlots}
           users={users}
           clinics={clinics}
           courts={courts}
           preSelectedTimeSlot={selectedTimeSlotForForm}
         />
       )}
    </div>
  );
};

export default Admin;
