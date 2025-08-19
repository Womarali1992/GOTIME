import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { reservations, courts, timeSlots, users, coaches, clinics, addUser, addCoach, addClinic, addUserToReservation, blockTimeSlot, unblockTimeSlot, updateReservationComments, updateUserComments, updateTimeSlotComments, getAllItemsWithComments, getTimeSlotsWithNotes } from "@/lib/data";
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
import CommentForm from "@/components/CommentForm";
import AdminSettings from "@/components/AdminSettings";
// import EditNotesForm from "@/components/EditNotesForm"; // Deprecated - using CommentForm instead
import { Clock, User, GraduationCap, StickyNote } from "lucide-react";
import { ReservationSettings } from "@/lib/types";
import type { Comment as AppComment } from "@/lib/types";

const Admin = () => {
  const [editingCourt, setEditingCourt] = useState<any>(null);
  const [schedulingCourt, setSchedulingCourt] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [showAddUserToReservation, setShowAddUserToReservation] = useState(false);
  const [selectedTimeSlotForForm, setSelectedTimeSlotForForm] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Comments editing state
  const [editingReservationComments, setEditingReservationComments] = useState<any>(null);
  const [editingUserComments, setEditingUserComments] = useState<any>(null);
  const [editingTimeSlotComments, setEditingTimeSlotComments] = useState<any>(null);
  

  
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

  const handleUpdateReservationComments = (comments: AppComment[]) => {
    if (editingReservationComments && updateReservationComments(editingReservationComments.id, comments)) {
      setRefreshKey(prev => prev + 1); // Force re-render
      console.log("Updated reservation comments:", comments);
    }
  };

  const handleUpdateUserComments = (comments: AppComment[]) => {
    if (editingUserComments && updateUserComments(editingUserComments.id, comments)) {
      setRefreshKey(prev => prev + 1); // Force re-render
      console.log("Updated user comments:", comments);
    }
  };

  const handleUpdateTimeSlotComments = (comments: AppComment[]) => {
    if (editingTimeSlotComments && updateTimeSlotComments(editingTimeSlotComments.id, comments)) {
      setRefreshKey(prev => prev + 1); // Force re-render
      console.log("Updated time slot comments:", comments);
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
            <TabsTrigger value="notes">Notes</TabsTrigger>
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
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Time Slots Overview
                </h2>
                <div className="text-sm text-muted-foreground mt-1">
                  {reservations.filter(r => r.comments && r.comments.length > 0).length} reservation{reservations.filter(r => r.comments && r.comments.length > 0).length !== 1 ? 's' : ''} with notes
                </div>
              </div>
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
                                         <div>
                                           <span className="text-base font-medium !text-foreground">
                                             {slot.available ? "Available" : "Blocked"}
                                           </span>
                                           {slot.comments && slot.comments.length > 0 && (
                                             <div className="text-sm text-muted-foreground mt-1">
                                               <span className="text-xs font-medium text-blue-600">
                                                 {slot.comments.length} comment{slot.comments.length !== 1 ? 's' : ''}:
                                               </span>
                                               <span className="ml-1">{slot.comments[slot.comments.length - 1].text}</span>
                                             </div>
                                           )}
                                         </div>
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
                                        <div className="flex items-center gap-2">
                                          {(!reservation.comments || reservation.comments.length === 0) && (
                                            <Badge
                                              variant="outline"
                                              className="text-sm shrink-0 min-w-[80px] justify-center bg-blue-500/20 !text-blue-700 border-blue-500/30"
                                            >
                                              Reserved
                                            </Badge>
                                          )}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const court = courts.find(c => c.id === reservation.courtId);
                                              const timeSlot = timeSlots.find(ts => ts.id === reservation.timeSlotId);
                                              setEditingReservationComments({
                                                ...reservation,
                                                court: court?.name,
                                                date: timeSlot?.date,
                                                time: timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : '',
                                              });
                                            }}
                                            className={`h-6 px-2 text-xs ${
                                              reservation.comments && reservation.comments.length > 0
                                                ? 'border-yellow-300 hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800 bg-yellow-100' 
                                                : 'border-yellow-300 hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800'
                                            }`}
                                          >
                                            <StickyNote className="h-3 w-3 mr-1" />
                                            {reservation.comments && reservation.comments.length > 0 ? `Notes (${reservation.comments.length})` : 'Add Notes'}
                                          </Button>
                                        </div>
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
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  const court = courts.find(c => c.id === slot.courtId);
                                                  setEditingTimeSlotComments({
                                                    id: slot.id,
                                                    comments: slot.comments || [],
                                                    court: court?.name,
                                                    date: slot.date,
                                                    time: `${slot.startTime} - ${slot.endTime}`,
                                                  });
                                                }}
                                                className="text-blue-600 focus:text-blue-600"
                                              >
                                                <StickyNote className="h-3 w-3 mr-1" />
                                                Add Note
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                          {slot.comments && slot.comments.length > 0 && (
                                            <div className="text-sm text-muted-foreground mt-1">
                                              <span className="text-xs font-medium text-blue-600">
                                                {slot.comments.length} comment{slot.comments.length !== 1 ? 's' : ''}:
                                              </span>
                                              <span className="ml-1">{slot.comments[slot.comments.length - 1].text}</span>
                                            </div>
                                          )}
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
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Users
                </h2>
                <div className="text-sm text-muted-foreground mt-1">
                  {users.filter(u => u.comments && u.comments.length > 0).length} user{users.filter(u => u.comments && u.comments.length > 0).length !== 1 ? 's' : ''} with notes
                </div>
              </div>
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
                  <CardContent className="space-y-3">
                    {user.comments && user.comments.length > 0 && (
                      <div className="p-3 bg-yellow-200 border border-yellow-300 rounded text-sm text-yellow-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <StickyNote className="h-4 w-4" />
                            <span className="font-medium">Admin Comments:</span>
                          </div>
                          <span className="text-xs font-medium">
                            {user.comments.length} comment{user.comments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-yellow-700 mb-1">
                          Latest: {new Date(user.comments[user.comments.length - 1].createdAt).toLocaleDateString()}
                        </div>
                        {user.comments[user.comments.length - 1].text}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUserComments(user)}
                        className="border-yellow-300 hover:bg-yellow-50"
                      >
                        <StickyNote className="h-4 w-4 mr-2" />
                        {user.comments && user.comments.length > 0 ? `Edit Comments (${user.comments.length})` : 'Add Comments'}
                      </Button>
                    </div>
                  </CardContent>
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

          <TabsContent value="notes" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Notes Overview
                </h2>
                <div className="text-sm text-muted-foreground mt-1">
                  All items with admin notes and time slots with blocked/clinic status
                </div>
              </div>
            </div>
            
            {/* Time Slots with Notes Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Time Slots with Special Status</h3>
              {getTimeSlotsWithNotes().map((slot) => (
                <Card key={slot.id} className="border border-input bg-card shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {slot.courtName} - {format(new Date(slot.date), 'MMM d, yyyy')}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={slot.status === 'blocked' ? 'destructive' : slot.status === 'clinic' ? 'default' : 'secondary'}
                            className={
                              slot.status === 'blocked' ? 'bg-red-500/20 text-red-700 border-red-500/30' : 
                              slot.status === 'clinic' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' :
                              'bg-blue-500/20 text-blue-700 border-blue-500/30'
                            }
                          >
                            {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {slot.reservation && (
                            <span className="text-sm text-muted-foreground">
                              Player: {slot.reservation.playerName}
                            </span>
                          )}
                          {slot.clinic && (
                            <span className="text-sm text-muted-foreground">
                              Coach: {coaches.find(c => c.id === slot.clinic.coachId)?.name}
                            </span>
                          )}
                        </CardDescription>
                      </div>

                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`border rounded-md p-4 ${
                      slot.status === 'blocked' ? 'bg-red-50 border-red-200' :
                      slot.status === 'clinic' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <p className={`text-sm whitespace-pre-wrap ${
                        slot.status === 'blocked' ? 'text-red-800' :
                        slot.status === 'clinic' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {slot.notes}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getTimeSlotsWithNotes().length === 0 && (
                <Card className="border border-input bg-card shadow-sm">
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No time slots with notes</p>
                      <p className="text-sm">Time slots will appear here when they are blocked or have clinics.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Other Items with Notes Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Other Items with Notes</h3>
              {getAllItemsWithComments().filter(item => item.type !== 'timeSlot').map((item) => (
                <Card key={item.id} className="border border-input bg-card shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={item.type === 'reservation' ? 'secondary' : 'outline'}
                            className={
                              item.type === 'reservation' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' : 
                              'bg-green-500/20 text-green-700 border-green-500/30'
                            }
                          >
                            {item.type === 'reservation' ? 'Notes' : 'User'}
                          </Badge>
                          <span>{item.subtitle}</span>
                          {item.court && (
                            <span className="text-sm text-muted-foreground">
                              Court: {item.court}
                            </span>
                          )}
                          {item.date && (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(item.date), 'MMM d, yyyy')}
                            </span>
                          )}
                          {item.time && (
                            <span className="text-sm text-muted-foreground">
                              {item.time}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (item.type === 'reservation') {
                            const reservation = reservations.find(r => r.id === item.id);
                            if (reservation) {
                              const court = courts.find(c => c.id === reservation.courtId);
                              const timeSlot = timeSlots.find(ts => ts.id === reservation.timeSlotId);
                              setEditingReservationComments({
                                ...reservation,
                                court: court?.name,
                                date: timeSlot?.date,
                                time: timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : '',
                              });
                            }
                          } else if (item.type === 'user') {
                            const user = users.find(u => u.id === item.id);
                            if (user) {
                              setEditingUserComments(user);
                            }
                          }
                        }}
                        className="h-8 px-3 text-sm border-yellow-300 hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800"
                      >
                        <StickyNote className="h-4 w-4 mr-2" />
                        {item.commentCount > 0 ? `Edit Comments (${item.commentCount})` : 'Add Comments'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-yellow-700 font-medium">
                          {item.commentCount} comment{item.commentCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-yellow-600">
                          Latest: {new Date(item.comments[item.comments.length - 1].createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                        {item.latestComment}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getAllItemsWithComments().filter(item => item.type !== 'timeSlot').length === 0 && (
                <Card className="border border-input bg-card shadow-sm">
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No other items with notes</p>
                      <p className="text-sm">Notes will appear here when you add them to reservations or users.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
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

      {/* Comments Forms */}
      {editingReservationComments && (
        <CommentForm
          isOpen={!!editingReservationComments}
          onClose={() => setEditingReservationComments(null)}
          onSave={handleUpdateReservationComments}
          currentComments={editingReservationComments.comments || []}
          title="Edit Reservation Comments"
          description="Add or update admin comments for this reservation. These comments are only visible to administrators."
          type="reservation"
          data={{
            name: editingReservationComments.playerName,
            email: editingReservationComments.playerEmail,
            date: editingReservationComments.date,
            time: editingReservationComments.time,
            court: editingReservationComments.court,
          }}
        />
      )}

      {editingUserComments && (
        <CommentForm
          isOpen={!!editingUserComments}
          onClose={() => setEditingUserComments(null)}
          onSave={handleUpdateUserComments}
          currentComments={editingUserComments.comments || []}
          title="Edit User Comments"
          description="Add or update admin comments for this user. These comments are only visible to administrators."
          type="user"
          data={{
            name: editingUserComments.name,
            email: editingUserComments.email,
            membershipType: editingUserComments.membershipType,
          }}
        />
      )}

      {editingTimeSlotComments && (
        <CommentForm
          isOpen={!!editingTimeSlotComments}
          onClose={() => setEditingTimeSlotComments(null)}
          onSave={handleUpdateTimeSlotComments}
          currentComments={editingTimeSlotComments.comments || []}
          title="Edit Time Slot Comments"
          description="Add or update admin comments for this time slot. These comments are only visible to administrators."
          type="timeSlot"
          data={{
            name: "Time Slot",
            date: editingTimeSlotComments.date,
            time: editingTimeSlotComments.time,
            court: editingTimeSlotComments.court,
          }}
        />
       )}


    </div>
  );
};

export default Admin;
