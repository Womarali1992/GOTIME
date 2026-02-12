import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { apiDataService } from '@/lib/services/api-data-service';
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
import type { EnrichedTimeSlot, ItemsWithComments } from '@/types/enriched-data';

// Types for booking operations
type CreateReservationData = Omit<Reservation, 'id' | 'createdAt'>;
type UpdateReservationData = Partial<Reservation>;

interface TimeSlotServiceType {
  getTimeSlotsForDate: (date: string, courtId?: string) => TimeSlot[];
}

interface PrivateSessionServiceType {
  isCoachAvailable: (coachId: string, date: string, startTime: string, endTime: string) => boolean;
}

interface DataServiceContextType {
  // Data
  courts: Court[];
  timeSlots: TimeSlot[];
  reservations: Reservation[];
  users: User[];
  coaches: Coach[];
  clinics: Clinic[];
  reservationSettings: any;
  isLoading: boolean;

  // Reservation Actions (Single Source of Truth)
  createReservation: (data: CreateReservationData) => Promise<Reservation>;
  updateReservation: (id: string, data: UpdateReservationData) => Promise<Reservation | undefined>;
  deleteReservation: (id: string) => Promise<boolean>;
  joinOpenPlay: (reservationId: string, participant: { name: string; email: string; phone: string }) => Promise<Reservation>;

  // Time Slot Actions
  createTimeSlot: (data: Omit<TimeSlot, 'id' | 'createdAt'>) => Promise<TimeSlot>;
  updateTimeSlot: (id: string, data: Partial<TimeSlot>) => Promise<TimeSlot | undefined>;
  deleteTimeSlot: (id: string) => Promise<boolean>;

  // User/Coach/Clinic Actions
  addUser: (userData: CreateUser) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<User | undefined>;
  deleteUser: (id: string) => Promise<boolean>;
  addCoach: (coachData: CreateCoach) => Promise<Coach>;
  updateCoach: (id: string, data: Partial<Coach>) => Promise<Coach>;
  deleteCoach: (id: string) => Promise<boolean>;
  addClinic: (clinicData: CreateClinic) => Promise<Clinic>;

  // Settings Actions
  updateSettings: (settings: any) => Promise<any>;

  // Utility
  refresh: () => void;
  refreshKey: number;

  // Legacy compatibility services
  timeSlotService: TimeSlotServiceType;
  privateSessionService: PrivateSessionServiceType;
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
  const [reservationSettings, setReservationSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Full refresh - reloads all data (use sparingly)
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Selective refresh functions for better performance
  const refreshReservationsAndSlots = useCallback(async () => {
    const [reservationsData, timeSlotsData] = await Promise.all([
      apiDataService.getAllReservations(),
      apiDataService.getAllTimeSlots(),
    ]);
    setReservations(reservationsData);
    setTimeSlots(timeSlotsData);
  }, []);

  const refreshTimeSlots = useCallback(async () => {
    const timeSlotsData = await apiDataService.getAllTimeSlots();
    setTimeSlots(timeSlotsData);
  }, []);

  const refreshUsers = useCallback(async () => {
    const usersData = await apiDataService.getAllUsers();
    setUsers(usersData);
  }, []);

  const refreshCoaches = useCallback(async () => {
    const coachesData = await apiDataService.getAllCoaches();
    setCoaches(coachesData);
  }, []);

  const refreshClinics = useCallback(async () => {
    const clinicsData = await apiDataService.getAllClinics();
    setClinics(clinicsData);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Health check (replaces DataProvider)
        await apiDataService.initialize();
        setIsConnected(true);

        const [courtsData, timeSlotsData, reservationsData, usersData, coachesData, clinicsData, settingsData] = await Promise.all([
          apiDataService.getAllCourts(),
          apiDataService.getAllTimeSlots(),
          apiDataService.getAllReservations(),
          apiDataService.getAllUsers(),
          apiDataService.getAllCoaches(),
          apiDataService.getAllClinics(),
          apiDataService.getReservationSettings(),
        ]);
        setCourts(courtsData);
        setTimeSlots(timeSlotsData);
        setReservations(reservationsData);
        setUsers(usersData);
        setCoaches(coachesData);
        setClinics(clinicsData);
        setReservationSettings(settingsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        setIsConnected(true); // Show app even if data load fails
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  const addUser = useCallback(async (userData: CreateUser) => {
    const user = await apiDataService.createUser(userData);
    await refreshUsers();
    return user;
  }, [refreshUsers]);

  const updateUser = useCallback(async (id: string, data: Partial<User>) => {
    const result = await apiDataService.updateUser(id, data);
    await refreshUsers();
    return result;
  }, [refreshUsers]);

  const deleteUser = useCallback(async (id: string) => {
    const result = await apiDataService.deleteUser(id);
    await refreshUsers();
    return result;
  }, [refreshUsers]);

  const addCoach = useCallback(async (coachData: CreateCoach) => {
    const coach = await apiDataService.createCoach(coachData);
    await refreshCoaches();
    return coach;
  }, [refreshCoaches]);

  const updateCoach = useCallback(async (id: string, data: Partial<Coach>) => {
    const result = await apiDataService.updateCoach(id, data);
    await refreshCoaches();
    return result;
  }, [refreshCoaches]);

  const deleteCoach = useCallback(async (id: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/coaches/${id}`, { method: 'DELETE' });
    await refreshCoaches();
    return response.ok;
  }, [refreshCoaches]);

  const addClinic = useCallback(async (clinicData: CreateClinic) => {
    const clinic = await apiDataService.createClinic(clinicData);
    await refreshClinics();
    return clinic;
  }, [refreshClinics]);

  const updateSettings = useCallback(async (newSettings: any) => {
    const result = await apiDataService.updateReservationSettings(newSettings);
    setReservationSettings(result);
    // Settings changes (e.g. operating hours) affect time slot generation,
    // so bump refreshKey so consumers like HomeSchedulerView reload slots.
    setRefreshKey(prev => prev + 1);
    return result;
  }, []);

  const deleteTimeSlot = useCallback(async (id: string) => {
    const result = await apiDataService.deleteTimeSlot(id);
    await refreshTimeSlots();
    return result;
  }, [refreshTimeSlots]);

  const createTimeSlot = useCallback(async (data: Omit<TimeSlot, 'id' | 'createdAt'>) => {
    const result = await apiDataService.createTimeSlot(data);
    await refreshTimeSlots();
    return result;
  }, [refreshTimeSlots]);

  const updateTimeSlot = useCallback(async (id: string, data: Partial<TimeSlot>) => {
    const result = await apiDataService.updateTimeSlot(id, data);
    await refreshTimeSlots();
    return result;
  }, [refreshTimeSlots]);

  // Reservation Actions - Single Source of Truth
  const createReservation = useCallback(async (data: CreateReservationData) => {
    const result = await apiDataService.createReservation(data);
    await refreshReservationsAndSlots();
    return result;
  }, [refreshReservationsAndSlots]);

  const updateReservation = useCallback(async (id: string, data: UpdateReservationData) => {
    const result = await apiDataService.updateReservation(id, data);
    await refreshReservationsAndSlots();
    return result;
  }, [refreshReservationsAndSlots]);

  const deleteReservation = useCallback(async (id: string) => {
    const result = await apiDataService.deleteReservation(id);
    await refreshReservationsAndSlots();
    return result;
  }, [refreshReservationsAndSlots]);

  const joinOpenPlay = useCallback(async (reservationId: string, participant: { name: string; email: string; phone: string }) => {
    const result = await apiDataService.joinOpenPlay(reservationId, participant);
    await refreshReservationsAndSlots();
    return result;
  }, [refreshReservationsAndSlots]);

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

  // Legacy compatibility service objects
  const timeSlotService: TimeSlotServiceType = useMemo(() => ({
    getTimeSlotsForDate: (date: string, courtId?: string) => {
      return timeSlots.filter(ts => {
        if (ts.date !== date) return false;
        if (courtId && ts.courtId !== courtId) return false;
        return true;
      });
    },
  }), [timeSlots]);

  const privateSessionService: PrivateSessionServiceType = useMemo(() => ({
    isCoachAvailable: (_coachId: string, _date: string, _startTime: string, _endTime: string) => {
      return true;
    },
  }), []);

  const value: DataServiceContextType = {
    courts,
    timeSlots,
    reservations,
    users,
    coaches,
    clinics,
    reservationSettings,
    isLoading,

    createReservation,
    updateReservation,
    deleteReservation,
    joinOpenPlay,

    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,

    addUser,
    updateUser,
    deleteUser,
    addCoach,
    updateCoach,
    deleteCoach,
    addClinic,
    updateSettings,

    refresh,
    refreshKey,

    timeSlotService,
    privateSessionService,
    getAllItemsWithComments,
    getTimeSlotsWithNotes,
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Connecting to server...</p>
        </div>
      </div>
    );
  }

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
