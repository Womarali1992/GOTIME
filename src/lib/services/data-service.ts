/**
 * Legacy data service adapter
 * Wraps API service to maintain backward compatibility with existing components
 * This is a temporary shim - components should be migrated to use apiDataService or useDataService hook
 */
import { apiDataService } from './api-data-service';

// Simple synchronous wrapper that components expect
// Note: This returns cached data - components should use useDataService hook for reactive updates
class DataServiceAdapter {
  private cache = {
    courts: [] as any[],
    timeSlots: [] as any[],
    reservations: [] as any[],
    users: [] as any[],
    coaches: [] as any[],
    clinics: [] as any[],
    settings: null as any,
  };

  async init() {
    await this.refreshData();
  }

  async refreshData() {
    try {
      [
        this.cache.courts,
        this.cache.timeSlots,
        this.cache.reservations,
        this.cache.users,
        this.cache.coaches,
        this.cache.clinics,
        this.cache.settings,
      ] = await Promise.all([
        apiDataService.getAllCourts(),
        apiDataService.getAllTimeSlots(),
        apiDataService.getAllReservations(),
        apiDataService.getAllUsers(),
        apiDataService.getAllCoaches(),
        apiDataService.getAllClinics(),
        apiDataService.getReservationSettings(),
      ]);
    } catch (error) {
      console.error('[DataService] Failed to refresh data:', error);
    }
  }

  getAllCourts() {
    return this.cache.courts;
  }

  getCourtById(id: string) {
    return this.cache.courts.find(c => c.id === id);
  }

  getReservationSettings() {
    return this.cache.settings;
  }

  // Nested services for backward compatibility
  timeSlotService = {
    getAllTimeSlots: () => this.cache.timeSlots,
    getTimeSlotById: (id: string) => this.cache.timeSlots.find(ts => ts.id === id),
    updateTimeSlot: async (id: string, data: any) => {
      const result = await apiDataService.updateTimeSlot(id, data);
      await this.refreshData();
      return result;
    },
  };

  reservationService = {
    getAllReservations: () => this.cache.reservations,
    getReservationById: (id: string) => this.cache.reservations.find(r => r.id === id),
    createReservation: async (data: any) => {
      const result = await apiDataService.createReservation(data);
      await this.refreshData();
      return result;
    },
  };

  userService = {
    getAllUsers: () => this.cache.users,
    getUserById: (id: string) => this.cache.users.find(u => u.id === id),
    getUserByEmail: (email: string) => this.cache.users.find(u => u.email === email),
  };

  coachService = {
    getAllCoaches: () => this.cache.coaches,
    getCoachById: (id: string) => this.cache.coaches.find(c => c.id === id),
  };

  clinicService = {
    getAllClinics: () => this.cache.clinics,
    getClinicById: (id: string) => this.cache.clinics.find(c => c.id === id),
  };

  privateSessionService = {
    isCoachAvailable: (coachId: string, date: string, startTime: string, endTime: string) => {
      // Simplified availability check
      return true;
    },
  };
}

export const dataService = new DataServiceAdapter();

// Initialize on module load
dataService.init();
