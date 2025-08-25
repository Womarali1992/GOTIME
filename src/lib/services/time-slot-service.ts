import { TimeSlotRepository } from '../repositories/time-slot-repository';
import { ReservationRepository } from '../repositories/reservation-repository';
import { ClinicRepository } from '../repositories/clinic-repository';
import { CourtRepository } from '../repositories/court-repository';
import type { TimeSlot, Comment, DaySettings } from '../validation/schemas';

export interface TimeSlotWithStatus extends TimeSlot {
  reservation?: any;
  clinic?: any;
  isAvailable: boolean;
  isReserved: boolean;
  isBlocked: boolean;
  isClinic: boolean;
  status: 'available' | 'reserved' | 'blocked' | 'clinic';
}

export class TimeSlotService {
  constructor(
    private timeSlotRepository: TimeSlotRepository,
    private reservationRepository: ReservationRepository,
    private clinicRepository: ClinicRepository,
    private courtRepository: CourtRepository
  ) {}

  // Core CRUD operations
  getAllTimeSlots(): TimeSlot[] {
    return this.timeSlotRepository.findAll();
  }

  getTimeSlotById(id: string): TimeSlot | undefined {
    return this.timeSlotRepository.findById(id);
  }

  // Time slot generation
  generateTimeSlots(operatingHours: DaySettings[], days: number = 7): TimeSlot[] {
    const timeSlots: TimeSlot[] = [];
    const startDate = new Date();
    
    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek] as DaySettings['dayOfWeek'];
      
      const daySettings = operatingHours.find(day => day.dayOfWeek === dayName);
      
      if (!daySettings || !daySettings.isOpen) continue;
      
      const startHour = parseInt(daySettings.startTime.split(':')[0]);
      const endHour = parseInt(daySettings.endTime.split(':')[0]);
      
      const courts = this.courtRepository.findAll();
      courts.forEach(court => {
        for (let hour = startHour; hour < endHour; hour++) {
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
          
          const slotId = `${court.id}-${dateString}-${hour}`;
          
          // Check if slot already exists
          if (!this.timeSlotRepository.findById(slotId)) {
            const now = new Date();
            const slotDate = new Date(currentDate);
            slotDate.setHours(hour, 0, 0, 0);
            const isPast = slotDate < now;
            
            const timeSlot: Omit<TimeSlot, 'id'> = {
              courtId: court.id,
              startTime,
              endTime,
              date: dateString,
              available: !isPast,
              blocked: false,
              comments: [],
            };
            
            timeSlots.push(this.timeSlotRepository.create(timeSlot));
          }
        }
      });
    }
    
    return timeSlots;
  }

  // Query methods with status
  getTimeSlotsForDate(date: string, courtId?: string): TimeSlotWithStatus[] {
    // First check if the day is open according to current settings
    const slotDate = new Date(date);
    const dayOfWeek = slotDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as DaySettings['dayOfWeek'];
    
    // The service doesn't hold a reference to a dataService; assume days are open by existing slots
    // If slots exist for the date, proceed; otherwise, return empty
    const allSlotsForDate = this.timeSlotRepository.findByDate(date);
    const anyOpen = allSlotsForDate.length > 0;
    const daySettings = anyOpen ? { isOpen: true } as Partial<DaySettings> : undefined;
    
    // If the day is closed, return empty array
    if (!daySettings || !daySettings.isOpen) {
      return [];
    }
    
    const slots = this.timeSlotRepository.findByDate(date);
    const filteredSlots = courtId ? slots.filter(slot => slot.courtId === courtId) : slots;
    
    return filteredSlots.map(slot => this.enrichTimeSlotWithStatus(slot));
  }

  getTimeSlotsForDateRange(startDate: string, endDate: string): TimeSlotWithStatus[] {
    const slots = this.timeSlotRepository.findByDateRange(startDate, endDate);
    return slots.map(slot => this.enrichTimeSlotWithStatus(slot));
  }

  getAvailableTimeSlots(date?: string, courtId?: string): TimeSlotWithStatus[] {
    const slots = this.timeSlotRepository.findAvailable(date, courtId);
    return slots.map(slot => this.enrichTimeSlotWithStatus(slot));
  }

  getBlockedTimeSlots(date?: string, courtId?: string): TimeSlotWithStatus[] {
    const slots = this.timeSlotRepository.findBlocked(date, courtId);
    return slots.map(slot => this.enrichTimeSlotWithStatus(slot));
  }

  getClinicTimeSlots(date?: string, courtId?: string): TimeSlotWithStatus[] {
    const slots = this.timeSlotRepository.findClinics(date, courtId);
    return slots.map(slot => this.enrichTimeSlotWithStatus(slot));
  }

  // Status management
  blockTimeSlot(id: string): { success: boolean; error?: string } {
    try {
      // Check if slot can be blocked
      const slot = this.timeSlotRepository.findById(id);
      if (!slot) {
        return { success: false, error: 'Time slot not found' };
      }

      if (slot.type === 'clinic') {
        return { success: false, error: 'Cannot block a clinic time slot' };
      }

      const reservation = this.reservationRepository.findByTimeSlotId(id);
      if (reservation) {
        return { success: false, error: 'Cannot block a time slot with an existing reservation' };
      }

      const success = this.timeSlotRepository.blockSlot(id);
      return { success, error: success ? undefined : 'Failed to block time slot' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  unblockTimeSlot(id: string): { success: boolean; error?: string } {
    try {
      const success = this.timeSlotRepository.unblockSlot(id);
      return { success, error: success ? undefined : 'Failed to unblock time slot' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  setTimeSlotAsClinic(id: string, clinicId: string): { success: boolean; error?: string } {
    try {
      const success = this.timeSlotRepository.setAsClinic(id, clinicId);
      return { success, error: success ? undefined : 'Failed to set time slot as clinic' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Comment management
  updateTimeSlotComments(timeSlotId: string, comments: Comment[]): { success: boolean; error?: string } {
    try {
      const timeSlot = this.timeSlotRepository.update(timeSlotId, { comments });
      return { success: !!timeSlot, error: timeSlot ? undefined : 'Time slot not found' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  addCommentToTimeSlot(timeSlotId: string, comment: Omit<Comment, 'id' | 'createdAt'>): { success: boolean; error?: string } {
    try {
      const timeSlot = this.timeSlotRepository.findById(timeSlotId);
      
      if (!timeSlot) {
        return { success: false, error: 'Time slot not found' };
      }

      const newComment: Comment = {
        ...comment,
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...(timeSlot.comments || []), newComment];
      const updated = this.timeSlotRepository.update(timeSlotId, { comments: updatedComments });
      
      return { success: !!updated, error: updated ? undefined : 'Failed to add comment' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Analytics and reporting
  getTimeSlotStats(date?: string): {
    total: number;
    available: number;
    reserved: number;
    blocked: number;
    clinics: number;
    withComments: number;
  } {
    let slots = this.timeSlotRepository.findAll();
    
    if (date) {
      slots = this.timeSlotRepository.findByDate(date);
    }

    const enrichedSlots = slots.map(slot => this.enrichTimeSlotWithStatus(slot));

    return {
      total: enrichedSlots.length,
      available: enrichedSlots.filter(slot => slot.status === 'available').length,
      reserved: enrichedSlots.filter(slot => slot.status === 'reserved').length,
      blocked: enrichedSlots.filter(slot => slot.status === 'blocked').length,
      clinics: enrichedSlots.filter(slot => slot.status === 'clinic').length,
      withComments: enrichedSlots.filter(slot => slot.comments && slot.comments.length > 0).length,
    };
  }

  getCourtUtilization(courtId: string, startDate?: string, endDate?: string): {
    courtId: string;
    courtName: string;
    totalSlots: number;
    reservedSlots: number;
    blockedSlots: number;
    clinicSlots: number;
    utilizationRate: number;
  } {
    let slots = this.timeSlotRepository.findByCourtId(courtId);
    
    if (startDate && endDate) {
      slots = slots.filter(slot => slot.date >= startDate && slot.date <= endDate);
    }

    const court = this.courtRepository.findById(courtId);
    const enrichedSlots = slots.map(slot => this.enrichTimeSlotWithStatus(slot));

    const totalSlots = enrichedSlots.length;
    const reservedSlots = enrichedSlots.filter(slot => slot.status === 'reserved').length;
    const blockedSlots = enrichedSlots.filter(slot => slot.status === 'blocked').length;
    const clinicSlots = enrichedSlots.filter(slot => slot.status === 'clinic').length;
    const utilizationRate = totalSlots > 0 ? (reservedSlots + clinicSlots) / totalSlots : 0;

    return {
      courtId,
      courtName: court?.name || 'Unknown Court',
      totalSlots,
      reservedSlots,
      blockedSlots,
      clinicSlots,
      utilizationRate
    };
  }

  // Helper methods
  private enrichTimeSlotWithStatus(slot: TimeSlot): TimeSlotWithStatus {
    const reservation = this.reservationRepository.findByTimeSlotId(slot.id);
    const clinic = slot.type === 'clinic' && slot.clinicId 
      ? this.clinicRepository.findById(slot.clinicId) 
      : null;

    const isBlocked = slot.blocked;
    const isClinic = slot.type === 'clinic' && clinic !== null;
    const isReserved = !slot.available && !isBlocked && !isClinic && reservation !== null;
    const isAvailable = slot.available && !isBlocked;

    let status: 'available' | 'reserved' | 'blocked' | 'clinic';
    if (isBlocked) {
      status = 'blocked';
    } else if (isClinic) {
      status = 'clinic';
    } else if (isReserved) {
      status = 'reserved';
    } else {
      status = 'available';
    }

    return {
      ...slot,
      reservation,
      clinic,
      isAvailable,
      isReserved,
      isBlocked,
      isClinic,
      status
    };
  }

  getSlotStatus(courtId: string, date: string, hour: number): {
    available: boolean;
    reserved: boolean;
    blocked: boolean;
    isClinic: boolean;
    slot: TimeSlotWithStatus | null;
    reservation: any;
    clinic: any;
    status: 'available' | 'reserved' | 'blocked' | 'clinic' | 'unavailable';
  } {
    const slot = this.timeSlotRepository.findUniqueSlot(courtId, date, `${hour.toString().padStart(2, '0')}:00`);
    
    if (!slot) {
      return {
        available: false,
        reserved: false,
        blocked: false,
        isClinic: false,
        slot: null,
        reservation: null,
        clinic: null,
        status: 'unavailable'
      };
    }

    const enrichedSlot = this.enrichTimeSlotWithStatus(slot);

    return {
      available: enrichedSlot.isAvailable,
      reserved: enrichedSlot.isReserved,
      blocked: enrichedSlot.isBlocked,
      isClinic: enrichedSlot.isClinic,
      slot: enrichedSlot,
      reservation: enrichedSlot.reservation,
      clinic: enrichedSlot.clinic,
      status: enrichedSlot.status
    };
  }

  // Data consistency methods
  ensureDataConsistency(): void {
    const slots = this.timeSlotRepository.findAll();
    
    slots.forEach(slot => {
      const reservation = this.reservationRepository.findByTimeSlotId(slot.id);
      const clinic = slot.type === 'clinic' && slot.clinicId 
        ? this.clinicRepository.findById(slot.clinicId) 
        : null;

      let updates: Partial<TimeSlot> = {};

      if (slot.blocked) {
        if (slot.available) {
          updates.available = false;
        }
      } else if (slot.type === 'clinic' && clinic) {
        if (!slot.available) {
          updates.available = true;
        }
      } else if (reservation) {
        if (slot.available) {
          updates.available = false;
        }
        if (slot.type !== 'reservation') {
          updates.type = 'reservation';
        }
      } else {
        if (!slot.available) {
          updates.available = true;
        }
        if (slot.type === 'reservation') {
          updates.type = undefined;
        }
      }

      if (Object.keys(updates).length > 0) {
        this.timeSlotRepository.update(slot.id, updates);
      }
    });
  }
}
