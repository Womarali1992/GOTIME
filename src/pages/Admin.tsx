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
import SchedulerChart from "@/components/SchedulerChart";

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background/95 to-background/90">
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
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scheduler" className="space-y-6">
            <SchedulerChart 
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
                All Time Slots
              </h2>
              <Button className="bg-primary hover:bg-primary/90">Add Reservation</Button>
            </div>
            
            {sortedDates.length > 0 ? (
              sortedDates.map(date => (
                <Card key={date} className="border border-input bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-foreground">{format(new Date(date), "EEEE, MMMM d, yyyy")}</CardTitle>
                    <CardDescription>
                      {slotsByDate[date].length} time slots
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slotsByDate[date].map(slot => {
                        const court = courts.find(c => c.id === slot.courtId);
                        const reservation = reservations.find(r => r.timeSlotId === slot.id);
                        
                        return (
                          <div 
                            key={slot.id} 
                            className={`rounded-lg p-4 transition-all duration-300 ${
                              reservation 
                                ? 'bg-secondary/20 text-secondary-foreground' 
                                : slot.available 
                                  ? 'bg-primary/20 text-primary-foreground'
                                  : 'bg-muted/30 text-muted-foreground'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">
                                  {court?.name}
                                </span>
                                <Badge variant={slot.available ? "outline" : "secondary"} className="text-foreground">
                                  {reservation ? "Reserved" : slot.available ? "Available" : "Blocked"}
                                </Badge>
                              </div>
                              
                              <div className="text-sm space-y-1">
                                <div className="font-medium text-foreground">
                                  {slot.startTime} - {slot.endTime}
                                </div>
                                
                                {reservation && (
                                  <>
                                    <div className="flex items-center gap-2 text-foreground">
                                      <span className="font-medium">{reservation.playerName}</span>
                                      <Badge variant="outline">
                                        {reservation.players} player{reservation.players !== 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                    <div className="text-muted-foreground">
                                      {reservation.playerEmail} • {reservation.playerPhone}
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                {reservation ? (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-foreground hover:bg-primary/10"
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-destructive hover:bg-destructive/10"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : slot.available && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-primary hover:bg-primary/10"
                                  >
                                    Book
                                  </Button>
                                )}
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
                <p className="text-muted-foreground">No time slots found</p>
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
