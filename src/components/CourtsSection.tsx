import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Court } from "@/lib/types";

interface CourtsSectionProps {
  courts: Court[];
  onEditCourt: (court: Court) => void;
  onScheduleCourt: (court: Court) => void;
}

const CourtsSection = ({ courts, onEditCourt, onScheduleCourt }: CourtsSectionProps) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Courts
        </h2>
        <Button className="bg-primary/90 hover:bg-primary/80 text-sm sm:text-base">Add Court</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {courts.map((court) => (
          <Card
            key={court.id}
            className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {court.name}
                </CardTitle>
                <Badge
                  variant={court.indoor ? "secondary" : "outline"}
                  className={court.indoor ? "bg-secondary/20" : "border-primary/20"}
                >
                  {court.indoor ? "Indoor" : "Outdoor"}
                </Badge>
              </div>
              <CardDescription>{court.location}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="text-sm text-muted-foreground">ID: {court.id}</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditCourt(court)}
                  className="border-primary/20 hover:bg-primary/10 text-xs sm:text-sm"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onScheduleCourt(court)}
                  className="border-primary/20 hover:bg-primary/10 text-xs sm:text-sm"
                >
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default CourtsSection;


