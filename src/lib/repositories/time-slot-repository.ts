import { BaseRepository } from './base-repository';
import { TimeSlotSchema, CreateTimeSlotSchema } from '../validation/schemas';
import type { TimeSlot, CreateTimeSlot } from '../validation/schemas';

export class TimeSlotRepository extends BaseRepository<TimeSlot, CreateTimeSlot> {
  constructor(initialData: TimeSlot[] = []) {
    super(TimeSlotSchema, CreateTimeSlotSchema, initialData);
  }

  protected getEntityPrefix(): string {
    return 'slot';
  }

  findByDate(date: string): TimeSlot[] {
    return this.findMany(slot => slot.date === date);
  }

  findByCourtId(courtId: string): TimeSlot[] {
    return this.findMany(slot => slot.courtId === courtId);
  }

  findByDateAndCourt(date: string, courtId: string): TimeSlot[] {
    return this.findMany(slot => slot.date === date && slot.courtId === courtId);
  }

  findAvailable(date?: string, courtId?: string): TimeSlot[] {
    return this.findMany(slot => {
      const isAvailable = slot.available && !slot.blocked;
      const matchesDate = !date || slot.date === date;
      const matchesCourt = !courtId || slot.courtId === courtId;
      return isAvailable && matchesDate && matchesCourt;
    });
  }

  findBlocked(date?: string, courtId?: string): TimeSlot[] {
    return this.findMany(slot => {
      const isBlocked = slot.blocked;
      const matchesDate = !date || slot.date === date;
      const matchesCourt = !courtId || slot.courtId === courtId;
      return isBlocked && matchesDate && matchesCourt;
    });
  }

  findClinics(date?: string, courtId?: string): TimeSlot[] {
    return this.findMany(slot => {
      const isClinic = slot.type === 'clinic';
      const matchesDate = !date || slot.date === date;
      const matchesCourt = !courtId || slot.courtId === courtId;
      return isClinic && matchesDate && matchesCourt;
    });
  }

  findByDateRange(startDate: string, endDate: string): TimeSlot[] {
    return this.findMany(slot => slot.date >= startDate && slot.date <= endDate);
  }

  findByTimeRange(startTime: string, endTime: string, date?: string): TimeSlot[] {
    return this.findMany(slot => {
      const matchesTimeRange = slot.startTime >= startTime && slot.endTime <= endTime;
      const matchesDate = !date || slot.date === date;
      return matchesTimeRange && matchesDate;
    });
  }

  blockSlot(id: string): boolean {
    const slot = this.findById(id);
    if (!slot) return false;

    // Validate that slot can be blocked
    if (slot.type === 'clinic') return false; // Cannot block clinic slots
    if (slot.blocked) return false; // Already blocked

    return !!this.update(id, { blocked: true, available: false });
  }

  unblockSlot(id: string): boolean {
    const slot = this.findById(id);
    if (!slot) return false;

    // Only set available to true if there's no reservation
    const available = slot.type !== 'reservation';
    return !!this.update(id, { blocked: false, available });
  }

  markAsReserved(id: string): boolean {
    const slot = this.findById(id);
    if (!slot) return false;

    // Validate that slot can be reserved
    if (slot.blocked) return false;
    if (!slot.available && slot.type !== 'clinic') return false;

    return !!this.update(id, { available: false, type: 'reservation' });
  }

  markAsAvailable(id: string): boolean {
    const slot = this.findById(id);
    if (!slot) return false;

    // Don't make blocked slots available
    if (slot.blocked) return false;

    return !!this.update(id, { available: true, type: undefined });
  }

  setAsClinic(id: string, clinicId: string): boolean {
    const slot = this.findById(id);
    if (!slot) return false;

    // Validate that slot can be used for clinic
    if (slot.blocked) return false;

    return !!this.update(id, { 
      type: 'clinic', 
      clinicId, 
      available: true, // Clinics are bookable
      blocked: false 
    });
  }

  findWithComments(): TimeSlot[] {
    return this.findMany(slot => slot.comments && slot.comments.length > 0);
  }

  findUniqueSlot(courtId: string, date: string, startTime: string): TimeSlot | undefined {
    return this.findOne(slot => 
      slot.courtId === courtId && 
      slot.date === date && 
      slot.startTime === startTime
    );
  }

  isSlotAvailable(id: string): boolean {
    const slot = this.findById(id);
    return slot ? slot.available && !slot.blocked : false;
  }
}
