import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoach } from '@/contexts/CoachContext';
import { useDataService } from '@/hooks/use-data-service';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, Users, DollarSign, Clock } from 'lucide-react';

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { currentCoach, isAuthenticated, logout } = useCoach();
  const { clinics } = useDataService();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/coach-login');
    }
  }, [isAuthenticated, navigate]);

  if (!currentCoach) {
    return null;
  }

  // Get coach's clinics from context
  const coachClinics = clinics.filter(c => c.coachId === currentCoach.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Coach Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentCoach.name}!</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clinics</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coachClinics.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentCoach.hourlyRate}/hr</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentCoach.isActive ? 'Active' : 'Inactive'}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clinics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="clinics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Clinics</CardTitle>
                <CardDescription>Group training sessions you're coaching</CardDescription>
              </CardHeader>
              <CardContent>
                {coachClinics.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No clinics scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {coachClinics.map((clinic) => (
                      <div
                        key={clinic.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div>
                          <p className="font-medium">{clinic.name}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(clinic.date), 'MMM d, yyyy')} at{' '}
                            {clinic.startTime}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${clinic.price}</p>
                          <p className="text-xs text-gray-500">
                            Max {clinic.maxParticipants} participants
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your coach profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Basic Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{currentCoach.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Email:</dt>
                      <dd className="font-medium">{currentCoach.email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Phone:</dt>
                      <dd className="font-medium">{currentCoach.phone}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Hourly Rate:</dt>
                      <dd className="font-medium">${currentCoach.hourlyRate}/hr</dd>
                    </div>
                    {currentCoach.coachingRate && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Private Coaching Rate:</dt>
                        <dd className="font-medium">${currentCoach.coachingRate}/hr</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentCoach.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Bio</h3>
                  <p className="text-gray-600">{currentCoach.bio}</p>
                </div>
                <div className="pt-4">
                  <Button variant="outline" onClick={logout} className="w-full">
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
