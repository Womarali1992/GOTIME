
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reservations, courts, timeSlots } from "@/lib/data";
import { format } from "date-fns";

const Admin = () => {
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage courts, view reservations, and configure system settings.
          </p>
        </div>
        
        <Tabs defaultValue="reservations">
          <TabsList className="mb-6">
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reservations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Upcoming Reservations</h2>
              <Button>Add Reservation</Button>
            </div>
            
            {sortedDates.length > 0 ? (
              sortedDates.map(date => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle>{format(new Date(date), "EEEE, MMMM d, yyyy")}</CardTitle>
                    <CardDescription>
                      {reservationsByDate[date].length} reservations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reservationsByDate[date].map(reservation => {
                        const timeSlot = timeSlots.find(ts => ts.id === reservation.timeSlotId);
                        const court = courts.find(c => c.id === reservation.courtId);
                        
                        return (
                          <div 
                            key={reservation.id} 
                            className="flex flex-col md:flex-row justify-between border-b pb-4 items-start md:items-center"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{reservation.playerName}</h3>
                                <Badge variant="outline">
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
                                <Button variant="ghost" size="sm">Edit</Button>
                                <Button variant="ghost" size="sm">Cancel</Button>
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
              <h2 className="text-2xl font-bold">Courts</h2>
              <Button>Add Court</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courts.map(court => (
                <Card key={court.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{court.name}</CardTitle>
                      <Badge variant={court.indoor ? "secondary" : "outline"}>
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
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Schedule</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
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
    </div>
  );
};

export default Admin;
