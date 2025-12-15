import { apiDataService } from '@/lib/services/api-data-service';
import { useState, useEffect } from 'react';
import type {
  Court,
  TimeSlot,
  Reservation,
  User,
  Coach,
  Clinic,
  CreateUser,
  CreateCoach,
  CreateClinic,
} from '@/lib/types';
import type { EnrichedTimeSlot, EnrichedCommentItem, ItemsWithComments } from '@/types/enriched-data';

/**
 * Custom hook providing unified data access through API service
 * All data comes from SQLite backend via REST API
 */
export function useDataService() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [socials, setSocials] = useState<any[]>([]);
  const [reservationSettings, setReservationSettings] = useState<any>(null);

  const refresh = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [courtsData, timeSlotsData, reservationsData, usersData, coachesData, clinicsData, socialsData, settingsData] = await Promise.all([
          apiDataService.getAllCourts(),
          apiDataService.getAllTimeSlots(),
          apiDataService.getAllReservations(),
          apiDataService.getAllUsers(),
          apiDataService.getAllCoaches(),
          apiDataService.getAllClinics(),
          apiDataService.getAllSocials(),
          apiDataService.getReservationSettings(),
        ]);
        setCourts(courtsData);
        setTimeSlots(timeSlotsData);
        setReservations(reservationsData);
        setUsers(usersData);
        setCoaches(coachesData);
        setClinics(clinicsData);
        const today = new Date().toISOString().split('T')[0];
        setSocials(socialsData.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date)));
        setReservationSettings(settingsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, [refreshKey]);

  return {
    // Data
    courts,
    timeSlots,
    reservations,
    users,
    coaches,
    clinics,
    socials,
    reservationSettings,

    // Actions
    addUser: async (userData: CreateUser) => {
      const user = await apiDataService.createUser(userData);
      refresh();
      return user;
    },

    addCoach: async (coachData: CreateCoach) => {
      const coach = await apiDataService.createCoach(coachData);
      refresh();
      return coach;
    },

    addClinic: async (clinicData: CreateClinic) => {
      const clinic = await apiDataService.createClinic(clinicData);
      refresh();
      return clinic;
    },

    // Time slot management
    deleteTimeSlot: async (id: string) => {
      const result = await apiDataService.deleteTimeSlot(id);
      refresh();
      return result;
    },

    createTimeSlot: async (data: Omit<TimeSlot, 'id' | 'createdAt'>) => {
      const result = await apiDataService.createTimeSlot(data);
      refresh();
      return result;
    },

    // Utility
    refresh,
    refreshKey,

    // Legacy compatibility - return empty/mock data
    getAllItemsWithComments: (): ItemsWithComments => ({
      reservations: [],
      users: [],
      timeSlots: []
    }),

    getTimeSlotsWithNotes: (): EnrichedTimeSlot[] => {
      return timeSlots
        .filter(ts => ts.comments && ts.comments.length > 0)
        .map(ts => {
          const court = courts.find(c => c.id === ts.courtId);
          const reservation = reservations.find(r => r.timeSlotId === ts.id);
          const clinic = ts.clinicId ? clinics.find(c => c.id === ts.clinicId) : null;

          return {
            ...ts,
            courtName: court?.name || 'Unknown Court',
            status: (ts.blocked ? 'blocked' : (ts.available ? 'available' : 'reserved')) as 'blocked' | 'available' | 'reserved' | 'clinic',
            reservation,
            clinic,
            notes: ts.comments?.map(c => c.text).join('; ') || ''
          };
        });
    },
  };
}
