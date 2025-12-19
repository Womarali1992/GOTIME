import { useDataServiceContext } from '@/contexts/DataServiceContext';
import type { Reservation, Social, TimeSlot } from '@/lib/types';

/**
 * Unified hook for all booking operations
 * Single source of truth for reservations and social games
 *
 * All CRUD operations automatically refresh state across all views
 */
export function useBookings() {
  const context = useDataServiceContext();

  return {
    // Data
    reservations: context.reservations,
    socials: context.socials,
    timeSlots: context.timeSlots,
    courts: context.courts,
    users: context.users,
    isLoading: context.isLoading,

    // Reservation CRUD (Single Source of Truth)
    createReservation: context.createReservation,
    updateReservation: context.updateReservation,
    deleteReservation: context.deleteReservation,

    // Social CRUD (Single Source of Truth)
    createSocial: context.createSocial,
    updateSocial: context.updateSocial,
    deleteSocial: context.deleteSocial,
    addVoteToSocial: context.addVoteToSocial,

    // Time Slot operations
    createTimeSlot: context.createTimeSlot,
    updateTimeSlot: context.updateTimeSlot,
    deleteTimeSlot: context.deleteTimeSlot,

    // Utility
    refresh: context.refresh,

    // Helper: Get reservation for a time slot
    getReservationForTimeSlot: (timeSlotId: string): Reservation | undefined => {
      return context.reservations.find(r => r.timeSlotId === timeSlotId);
    },

    // Helper: Get social for a time slot
    getSocialForTimeSlot: (timeSlotId: string): Social | undefined => {
      return context.socials.find(s => s.timeSlotId === timeSlotId);
    },

    // Helper: Check if time slot is booked
    isTimeSlotBooked: (timeSlotId: string): boolean => {
      const slot = context.timeSlots.find(ts => ts.id === timeSlotId);
      if (!slot) return false;
      return !slot.available || slot.blocked;
    },

    // Helper: Get court by ID
    getCourtById: (courtId: string) => {
      return context.courts.find(c => c.id === courtId);
    },

    // Helper: Get user by ID
    getUserById: (userId: string) => {
      return context.users.find(u => u.id === userId);
    },
  };
}

export type UseBookingsReturn = ReturnType<typeof useBookings>;
