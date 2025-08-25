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
        <Button className="bg-primary/90 hover:bg-primary/80 text-sm sm:text-base" onClick={onAddClinic}>
          Add Clinic
        </Button>
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


