import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Clinic, Coach, Court } from "@/lib/types";

interface ClinicsSectionProps {
  clinics: Clinic[];
  coaches: Coach[];
  courts: Court[];
  onAddClinic: () => void;
}

const ClinicsSection = ({ clinics, coaches, courts, onAddClinic }: ClinicsSectionProps) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Clinics
        </h2>
        <div className="flex gap-2">
          <Button className="bg-primary/90 hover:bg-primary/80 text-sm sm:text-base" onClick={onAddClinic}>
            Add Clinic
          </Button>
          <Button 
            variant="outline" 
            className="text-sm sm:text-base" 
            onClick={() => {
              // Test clinic creation with hardcoded data
              console.log("=== DIRECT CLINIC CREATION TEST ===");
              const testClinic = {
                name: "Direct Test Clinic " + Date.now(),
                description: "This is a direct test clinic to debug the creation process without the form",
                coachId: coaches[0]?.id || "1",
                courtId: courts[0]?.id || "1", 
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                startTime: "10:00",
                endTime: "11:00",
                maxParticipants: 6,
                price: 50
              };
              console.log("Direct test clinic data:", testClinic);
              
              // Directly call the clinic creation (this should trigger all our debug logs)
              try {
                // We need to access the dataService from the parent component
                // For now, let's just open the form
                onAddClinic();
                
                // Log instructions for manual testing
                console.log("=== MANUAL TEST INSTRUCTIONS ===");
                console.log("1. Fill the form with this data:");
                console.log("   Name:", testClinic.name);
                console.log("   Description:", testClinic.description);
                console.log("   Coach: First coach in dropdown");
                console.log("   Court: First court in dropdown");
                console.log("   Date:", testClinic.date);
                console.log("   Start Time:", testClinic.startTime);
                console.log("   End Time:", testClinic.endTime);
                console.log("   Max Participants:", testClinic.maxParticipants);
                console.log("   Price:", testClinic.price);
                console.log("2. Click 'Add Clinic' and watch console for detailed logs");
              } catch (error) {
                console.error("Error in direct test:", error);
              }
            }}
          >
            Debug Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {clinics.map((clinic) => {
          const coach = coaches.find((c) => c.id === clinic.coachId);
          const court = courts.find((c) => c.id === clinic.courtId);
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
                    <div>
                      {clinic.date} • {clinic.startTime} - {clinic.endTime}
                    </div>
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
    </>
  );
};

export default ClinicsSection;


