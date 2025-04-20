
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reservations, courts, timeSlots } from "@/lib/data";
import { format } from "date-fns";
import AdminCalendarView from "@/components/AdminCalendarView";
import { useState } from "react";
import EditCourtForm from "@/components/EditCourtForm";
import ScheduleCourtForm from "@/components/ScheduleCourtForm";

const Admin = () => {
  const [editingCourt, setEditingCourt] = useState<any>(null);
  const [schedulingCourt, setSchedulingCourt] = useState<any>(null);
  
  const handleEditCourt = (courtData: any) => {
    console.log("Editing court:", courtData);
    // In a real app, this would update the court in the database
  };

  const handleScheduleCourt = (scheduleData: any) => {
    console.log("Scheduling court:", scheduleData);
    // In a real app, this would update the court's schedule in the database
  };

  // Group reservations by date for easier display
  const reservationsByDate: Record<string, typeof reservations> = {};
  
  reservations.forEach(reservation => {
    const timeSlot = timeSlots.find(ts => ts.id === reservation.timeSlotId);
    if (!timeSlot) return;
    
    if (!reservationsByDate[timeSlot.date]) {
      reservationsByDate[timeSlot.date] = [];
    }
    
    reservationsByDate[timeSlot.date].push(reservation);
  });
  
  // Sort dates in ascending order
  const sortedDates = Object.keys(reservationsByDate).sort();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background/95 to-background/90">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage courts, view reservations, and configure system settings.
          </p>
        </div>
        
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/50">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="space-y-6">
            <AdminCalendarView />
          </TabsContent>

          <TabsContent value="reservations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Upcoming Reservations
              </h2>
              <Button className="bg-primary/90 hover:bg-primary/80">Add Reservation</Button>
            </div>
            
            {sortedDates.length > 0 ? (
              sortedDates.map(date => (
                <Card key={date} className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5">
                  <CardHeader>
                    <CardTitle>{format(new Date(date), "EEEE, MMMM d, yyyy")}</CardTitle>
                    <CardDescription>
                      {reservationsByDate[date].length} reservations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 divide-y divide-border/50">
                      {reservationsByDate[date].map(reservation => {
                        const timeSlot = timeSlots.find(ts => ts.id === reservation.timeSlotId);
                        const court = courts.find(c => c.id === reservation.courtId);
                        
                        return (
                          <div 
                            key={reservation.id} 
                            className="flex flex-col md:flex-row justify-between pt-4 first:pt-0 items-start md:items-center"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{reservation.playerName}</h3>
                                <Badge variant="outline" className="border-primary/20">
                                  {reservation.players} player{reservation.players !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {reservation.playerEmail} • {reservation.playerPhone}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2 md:mt-0">
                              <div className="text-sm text-right">
                                <div className="font-medium">{court?.name}</div>
                                <div className="text-muted-foreground">
                                  {timeSlot?.startTime} - {timeSlot?.endTime}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="hover:bg-primary/10">Edit</Button>
                                <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No reservations found</p>
              </div>
            )}
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
          
          <TabsContent value="settings">
            <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure global settings for the reservation system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-muted-foreground text-sm">
                  Settings functionality will be implemented in a future update.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />

      {/* Court Edit Dialog */}
      {editingCourt && (
        <EditCourtForm
          court={editingCourt}
          isOpen={!!editingCourt}
          onClose={() => setEditingCourt(null)}
          onSave={handleEditCourt}
        />
      )}

      {/* Court Schedule Dialog */}
      {schedulingCourt && (
        <ScheduleCourtForm
          court={schedulingCourt}
          isOpen={!!schedulingCourt}
          onClose={() => setSchedulingCourt(null)}
          onSave={handleScheduleCourt}
        />
      )}
    </div>
  );
};

export default Admin;
