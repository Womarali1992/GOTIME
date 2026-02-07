import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDataService } from '@/hooks/use-data-service';
import { GraduationCap } from 'lucide-react';
import { TimeSlot } from '@/lib/types';
import CoachSchedulerView from '@/components/CoachSchedulerView';
import BookPrivateSessionDialog from '@/components/BookPrivateSessionDialog';

export default function CoachBooking() {
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const { coaches: allCoaches } = useDataService();

  // Get all active coaches
  const coaches = allCoaches.filter(c => c.isActive);
  const selectedCoach = selectedCoachId ? allCoaches.find(c => c.id === selectedCoachId) : null;

  // Handle time slot selection - directly open private session dialog
  const handleSelectTimeSlot = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseDialog = () => {
    setSelectedTimeSlot(null);
  };

  const handleCompleteBooking = () => {
    setSelectedTimeSlot(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      <main className="flex-1 container py-4 sm:py-8 px-4 sm:px-6">
        {/* Coach Selection Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Book Private Coaching</h1>
                  <p className="text-gray-600 text-sm">Select a coach to view their availability</p>
                </div>
              </div>

              <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Choose a coach" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{coach.name}</span>
                        <span className="ml-4 text-sm text-gray-500">
                          ${coach.coachingRate || coach.hourlyRate}/hr
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coach Details */}
            {selectedCoach && (
              <div className="mt-6 pt-6 border-t">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">{selectedCoach.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{selectedCoach.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCoach.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Weekly Availability</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                        const avail = selectedCoach.availability?.find(a => a.dayOfWeek === day);
                        return (
                          <div key={day} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="capitalize font-medium">{day.slice(0, 3)}</span>
                            <span className="text-gray-600">
                              {avail?.isAvailable ? `${avail.startTime}-${avail.endTime}` : 'Closed'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduler View */}
        {selectedCoach ? (
          <CoachSchedulerView
            onSelectTimeSlot={handleSelectTimeSlot}
            selectedCoach={selectedCoach}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Coach</h3>
              <p className="text-gray-600">
                Choose a coach from the dropdown above to view their availability and book a session
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />

      {/* Private Session Booking Dialog */}
      {selectedTimeSlot && selectedCoachId && (
        <BookPrivateSessionDialog
          selectedTimeSlot={selectedTimeSlot}
          isOpen={true}
          onClose={handleCloseDialog}
          onComplete={handleCompleteBooking}
          preselectedCoachId={selectedCoachId}
        />
      )}
    </div>
  );
}
