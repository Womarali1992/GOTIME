import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useDataService } from '@/hooks/use-data-service';
import { Reservation, TimeSlot } from '@/lib/types';

interface FindPlayersProps {
  onSelectReservation?: (reservation: Reservation, timeSlot: TimeSlot) => void;
}

const FindPlayers: React.FC<FindPlayersProps> = ({ onSelectReservation }) => {
  const dataService = useDataService();

  // Get reservations with open spots (where actual participants < total players needed)
  const reservationsWithOpenSpots = dataService.reservations
    .filter(reservation => {
      // Calculate actual participant count (organizer + participants)
      const actualParticipants = 1 + (reservation.participants?.length || 0);
      // Check if there are open spots
      return actualParticipants < reservation.players;
    })
    .map(reservation => {
      const timeSlot = dataService.timeSlots.find(ts => ts.id === reservation.timeSlotId);
      const court = dataService.courts.find(c => c.id === reservation.courtId);
      return {
        reservation,
        timeSlot,
        court,
        actualParticipants: 1 + (reservation.participants?.length || 0),
        openSpots: reservation.players - (1 + (reservation.participants?.length || 0))
      };
    })
    .filter(item => item.timeSlot && item.court); // Only show if we have valid time slot and court

  // Only show if there are reservations with open spots
  if (reservationsWithOpenSpots.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Find Players
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reservations with Open Spots Section */}
        {reservationsWithOpenSpots.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Open Spots</h3>
            {reservationsWithOpenSpots.map(({ reservation, timeSlot, court, actualParticipants, openSpots }) => {
              if (!timeSlot || !court) return null;

              return (
                <div
                  key={reservation.id}
                  className="p-4 rounded-lg border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                  onClick={() => onSelectReservation?.(reservation, timeSlot)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900">{court.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-blue-700">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(timeSlot.date), "MMM d")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeSlot.startTime} - {timeSlot.endTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {court.location}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-blue-600">
                        Hosted by {reservation.playerName}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-200 text-blue-900 border-blue-300">
                      {openSpots} {openSpots === 1 ? 'spot' : 'spots'} open
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FindPlayers;
