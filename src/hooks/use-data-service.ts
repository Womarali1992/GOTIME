import { dataService } from '@/lib/services/data-service';
import { socialRepository } from '@/lib/data';
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
  Comment
} from '@/lib/types';
import type { EnrichedTimeSlot, EnrichedCommentItem, ItemsWithComments } from '@/types/enriched-data';

/**
 * Custom hook to provide data service functionality to components
 * This replaces the old direct data imports and provides a clean interface
 */
export function useDataService() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Force re-render when data changes
  const refresh = () => {
    setRefreshKey(prev => prev + 1);
    dataService.refreshData();
  };

  useEffect(() => {
    // Set up periodic refresh
    const interval = setInterval(() => {
      dataService.refreshData();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  return {
    // Data getters
    courts: dataService.getAllCourts(),
    timeSlots: dataService.timeSlotService.getAllTimeSlots(),
    reservations: dataService.reservationService.getAllReservations(),
    users: dataService.userService.getAllUsers(),
    coaches: dataService.coachService.getAllCoaches(),
    clinics: dataService.clinicService.getAllClinics(),
    socials: socialRepository.findUpcoming(),

    // Settings
    reservationSettings: dataService.getReservationSettings(),
    
    // Services
    reservationService: dataService.reservationService,
    timeSlotService: dataService.timeSlotService,
    userService: dataService.userService,
    coachService: dataService.coachService,
    clinicService: dataService.clinicService,
    privateSessionService: dataService.privateSessionService,
    
    // Actions
    addUser: (userData: CreateUser) => {
      const user = dataService.userService.createUser(userData);
      refresh();
      return user;
    },
    
    addCoach: (coachData: CreateCoach) => {
      const coach = dataService.coachService.createCoach(coachData);
      refresh();
      return coach;
    },
    
    addClinic: (clinicData: CreateClinic) => {
      console.log("useDataService.addClinic called with:", clinicData);
      const result = dataService.clinicService.createClinic(clinicData);
      console.log("clinicService.createClinic returned:", result);
      refresh();
      return result;
    },
    
    addUserToReservation: (reservationId: string, userId: string) => {
      // This would need to be implemented in the reservation service
      // For now, we'll just refresh
      refresh();
    },
    
    // Block/unblock methods would be implemented here when needed
    
    // Comment update methods would be implemented here when needed
    
    // DUPR Rating management
    updateUserDuprRating: (userId: string, duprRating: number) => {
      const result = dataService.updateUserDuprRating(userId, duprRating);
      if (result.success) {
        refresh();
      }
      return result;
    },
    
    getUsersByDuprRange: (minRating?: number, maxRating?: number) => {
      return dataService.getUsersByDuprRange(minRating, maxRating);
    },
    
    getUsersWithoutDuprRating: () => {
      return dataService.getUsersWithoutDuprRating();
    },
    
    getDuprStats: () => {
      return dataService.getDuprStats();
    },
    
    getAllItemsWithComments: (): ItemsWithComments => {
      // Return all items that have comments in a flattened format
      const reservationsWithComments: EnrichedCommentItem[] = dataService.reservationService.getAllReservations()
        .filter(r => r.comments && r.comments.length > 0)
        .map(r => ({
          ...r,
          type: 'reservation' as const,
          title: `Reservation by ${r.playerName}`,
          subtitle: `${r.players} player${r.players > 1 ? 's' : ''}`,
          court: dataService.getAllCourts().find(c => c.id === r.courtId)?.name || 'Unknown Court',
          date: dataService.timeSlotService.getTimeSlotById(r.timeSlotId)?.date || 'Unknown Date',
          time: (() => {
            const timeSlot = dataService.timeSlotService.getTimeSlotById(r.timeSlotId);
            return timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : 'Unknown Time';
          })(),
          commentCount: r.comments.length,
          latestComment: r.comments[r.comments.length - 1]?.text || ''
        }));
      
      const usersWithComments: EnrichedCommentItem[] = dataService.userService.getAllUsers()
        .filter(u => u.comments && u.comments.length > 0)
        .map(u => ({
          ...u,
          type: 'user' as const,
          title: u.name,
          subtitle: `${u.membershipType} member`,
          court: '',
          date: u.createdAt,
          time: '',
          commentCount: u.comments.length,
          latestComment: u.comments[u.comments.length - 1]?.text || ''
        }));
      
      return {
        reservations: reservationsWithComments,
        users: usersWithComments,
        timeSlots: [] // Time slots are handled separately
      };
    },
    
    getTimeSlotsWithNotes: (): EnrichedTimeSlot[] => {
      // Return time slots that have comments (notes) with enriched data
      return dataService.timeSlotService.getAllTimeSlots()
        .filter(ts => ts.comments && ts.comments.length > 0)
        .map(ts => {
          const court = dataService.getAllCourts().find(c => c.id === ts.courtId);
          const reservation = dataService.reservationService.getAllReservations()
            .find(r => r.timeSlotId === ts.id);
          const clinic = ts.clinicId ? dataService.clinicService.getAllClinics()
            .find(c => c.id === ts.clinicId) : null;

          return {
            ...ts,
            courtName: court?.name || 'Unknown Court',
            status: (ts.blocked ? 'blocked' : (ts.available ? 'available' : 'reserved')) as 'blocked' | 'available' | 'reserved' | 'clinic',
            reservation,
            clinic,
            notes: ts.comments.map(c => c.text).join('; ') // Legacy notes format
          };
        });
    },
    
    // Time slot management
    deleteTimeSlot: (id: string) => {
      const result = dataService.deleteTimeSlot(id);
      refresh();
      return result;
    },

    createTimeSlot: (data: Omit<TimeSlot, 'id' | 'createdAt'>) => {
      const result = dataService.createTimeSlot(data);
      refresh();
      return result;
    },

    // Time slot generation utilities
    ensureTimeSlotsForDate: (date: Date) => {
      // Time slots are automatically generated by the data service
      refresh();
    },
    ensureTimeSlotsForDateRange: (startDate: Date, endDate: Date) => {
      // Time slots are automatically generated by the data service
      refresh();
    },

    // Utility functions
    refresh,
    refreshKey,
    
    // Data integrity functions
    validateDataIntegrity: () => dataService.validateDataIntegrity(),
    fixDataInconsistencies: () => {
      dataService.fixDataInconsistencies();
      refresh();
    },
    
    getSystemStats: () => dataService.getSystemStats()
  };
}