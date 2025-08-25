import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import type { Coach } from "@/lib/types";

interface CoachesSectionProps {
  coaches: Coach[];
  onAddCoach: () => void;
}

const CoachesSection = ({ coaches, onAddCoach }: CoachesSectionProps) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Coaches
        </h2>
        <Button className="bg-primary/90 hover:bg-primary/80 text-sm sm:text-base" onClick={onAddCoach}>
          Add Coach
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {coaches.map((coach) => (
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
    </>
  );
};

export default CoachesSection;


