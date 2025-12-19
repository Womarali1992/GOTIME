import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiDataService } from '@/lib/services/api-data-service';
import type {
  Court,
  TimeSlot,
  Reservation,
  User,
  Coach,
  Clinic,
  Social,
  CreateUser,
  CreateCoach,
  CreateClinic,
} from '@/lib/types';
import type { EnrichedTimeSlot, ItemsWithComments } from '@/types/enriched-data';

// Types for booking operations
type CreateReservationData = Omit<Reservation, 'id' | 'createdAt'>;
type UpdateReservationData = Partial<Reservation>;
type CreateSocialData = Omit<Social, 'id' | 'createdAt'>;
type UpdateSocialData = Partial<Social>;

interface DataServiceContextType {
  // Data
  courts: Court[];
  timeSlots: TimeSlot[];
  reservations: Reservation[];
  users: User[];
  coaches: Coach[];
  clinics: Clinic[];
  socials: Social[];
  reservationSettings: any;
  isLoading: boolean;

  // Reservation Actions (Single Source of Truth)
  createReservation: (data: CreateReservationData) => Promise<Reservation>;
  updateReservation: (id: string, data: UpdateReservationData) => Promise<Reservation | undefined>;
  deleteReservation: (id: string) => Promise<boolean>;

  // Social Actions (Single Source of Truth)
  createSocial: (data: CreateSocialData) => Promise<Social>;
  updateSocial: (id: string, data: UpdateSocialData) => Promise<Social | undefined>;
  deleteSocial: (id: string) => Promise<boolean>;
  addVoteToSocial: (socialId: string, userId: string, vote: 'yes' | 'no') => Promise<Social | undefined>;

  // Time Slot Actions
  createTimeSlot: (data: Omit<TimeSlot, 'id' | 'createdAt'>) => Promise<TimeSlot>;
  updateTimeSlot: (id: string, data: Partial<TimeSlot>) => Promise<TimeSlot | undefined>;
  deleteTimeSlot: (id: string) => Promise<boolean>;

  // User/Coach/Clinic Actions
  addUser: (userData: CreateUser) => Promise<User>;
  addCoach: (coachData: CreateCoach) => Promise<Coach>;
  addClinic: (clinicData: CreateClinic) => Promise<Clinic>;

  // Utility
  refresh: () => void;
  refreshKey: number;

  // Legacy compatibility
  getAllItemsWithComments: () => ItemsWithComments;
  getTimeSlotsWithNotes: () => EnrichedTimeSlot[];
}

const DataServiceContext = createContext<DataServiceContextType | null>(null);

interface DataServiceProviderProps {
  children: ReactNode;
}

export function DataServiceProvider({ children }: DataServiceProviderProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [socials, setSocials] = useState<Social[]>([]);
  const [reservationSettings, setReservationSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
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
        // Filter out past socials (check both date and time)
        const now = new Date();
        const filteredSocials = socialsData.filter((s: Social) => {
          const socialDate = new Date(s.date);
          const [hours, minutes] = s.endTime.split(':').map(Number);
          socialDate.setHours(hours, minutes || 0, 0, 0);
          return socialDate >= now;
        }).sort((a: Social, b: Social) => {
          // Sort by date first, then by start time
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
        setSocials(filteredSocials);
        setReservationSettings(settingsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  const addUser = useCallback(async (userData: CreateUser) => {
    const user = await apiDataService.createUser(userData);
    refresh();
    return user;
  }, [refresh]);

  const addCoach = useCallback(async (coachData: CreateCoach) => {
    const coach = await apiDataService.createCoach(coachData);
    refresh();
    return coach;
  }, [refresh]);

  const addClinic = useCallback(async (clinicData: CreateClinic) => {
    const clinic = await apiDataService.createClinic(clinicData);
    refresh();
    return clinic;
  }, [refresh]);

  const deleteTimeSlot = useCallback(async (id: string) => {
    const result = await apiDataService.deleteTimeSlot(id);
    refresh();
    return result;
  }, [refresh]);

  const createTimeSlot = useCallback(async (data: Omit<TimeSlot, 'id' | 'createdAt'>) => {
    const result = await apiDataService.createTimeSlot(data);
    refresh();
    return result;
  }, [refresh]);

  const updateTimeSlot = useCallback(async (id: string, data: Partial<TimeSlot>) => {
    const result = await apiDataService.updateTimeSlot(id, data);
    refresh();
    return result;
  }, [refresh]);

  // ============================================
  // RESERVATION ACTIONS - Single Source of Truth
  // ============================================
  const createReservation = useCallback(async (data: CreateReservationData) => {
    const result = await apiDataService.createReservation(data);
    refresh();
    return result;
  }, [refresh]);

  const updateReservation = useCallback(async (id: string, data: UpdateReservationData) => {
    const result = await apiDataService.updateReservation(id, data);
    refresh();
    return result;
  }, [refresh]);

  const deleteReservation = useCallback(async (id: string) => {
    const result = await apiDataService.deleteReservation(id);
    refresh();
    return result;
  }, [refresh]);

  // ============================================
  // SOCIAL ACTIONS - Single Source of Truth
  // ============================================
  const createSocial = useCallback(async (data: CreateSocialData) => {
    const result = await apiDataService.createSocial(data);
    refresh();
    return result;
  }, [refresh]);

  const updateSocial = useCallback(async (id: string, data: UpdateSocialData) => {
    const result = await apiDataService.updateSocial(id, data);
    refresh();
    return result;
  }, [refresh]);

  const deleteSocial = useCallback(async (id: string) => {
    const result = await apiDataService.deleteSocial(id);
    refresh();
    return result;
  }, [refresh]);

  const addVoteToSocial = useCallback(async (socialId: string, userId: string, vote: 'yes' | 'no') => {
    const result = await apiDataService.addVoteToSocial(socialId, userId, vote);
    refresh();
    return result;
  }, [refresh]);

  const getAllItemsWithComments = useCallback((): ItemsWithComments => ({
    reservations: [],
    users: [],
    timeSlots: []
  }), []);

  const getTimeSlotsWithNotes = useCallback((): EnrichedTimeSlot[] => {
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
  }, [timeSlots, courts, reservations, clinics]);

  const value: DataServiceContextType = {
    // Data
    courts,
    timeSlots,
    reservations,
    users,
    coaches,
    clinics,
    socials,
    reservationSettings,
    isLoading,

    // Reservation Actions (Single Source of Truth)
    createReservation,
    updateReservation,
    deleteReservation,

    // Social Actions (Single Source of Truth)
    createSocial,
    updateSocial,
    deleteSocial,
    addVoteToSocial,

    // Time Slot Actions
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,

    // User/Coach/Clinic Actions
    addUser,
    addCoach,
    addClinic,

    // Utility
    refresh,
    refreshKey,
    getAllItemsWithComments,
    getTimeSlotsWithNotes,
  };

  return (
    <DataServiceContext.Provider value={value}>
      {children}
    </DataServiceContext.Provider>
  );
}

export function useDataServiceContext() {
  const context = useContext(DataServiceContext);
  if (!context) {
    throw new Error('useDataServiceContext must be used within a DataServiceProvider');
  }
  return context;
}




