import { BaseRepository } from './base-repository';
import { ClinicSchema, CreateClinicSchema } from '../validation/schemas';
import type { Clinic, CreateClinic } from '../validation/schemas';

export class ClinicRepository extends BaseRepository<Clinic, CreateClinic> {
  constructor(initialData: Clinic[] = []) {
    super(ClinicSchema, CreateClinicSchema, initialData);
  }

  protected getEntityPrefix(): string {
    return 'clinic';
  }

  findByCoachId(coachId: string): Clinic[] {
    return this.findMany(clinic => clinic.coachId === coachId);
  }

  findByCourtId(courtId: string): Clinic[] {
    return this.findMany(clinic => clinic.courtId === courtId);
  }

  findByDate(date: string): Clinic[] {
    return this.findMany(clinic => clinic.date === date);
  }

  findByDateRange(startDate: string, endDate: string): Clinic[] {
    return this.findMany(clinic => clinic.date >= startDate && clinic.date <= endDate);
  }

  findByName(name: string): Clinic[] {
    return this.findMany(clinic => 
      clinic.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  findByPriceRange(minPrice: number, maxPrice: number): Clinic[] {
    return this.findMany(clinic => 
      clinic.price >= minPrice && clinic.price <= maxPrice
    );
  }

  findByMaxParticipants(maxParticipants: number): Clinic[] {
    return this.findMany(clinic => clinic.maxParticipants >= maxParticipants);
  }

  findUpcoming(fromDate?: string): Clinic[] {
    const referenceDate = fromDate || new Date().toISOString().split('T')[0];
    return this.findMany(clinic => clinic.date >= referenceDate)
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.startTime.localeCompare(b.startTime);
      });
  }

  findPast(toDate?: string): Clinic[] {
    const referenceDate = toDate || new Date().toISOString().split('T')[0];
    return this.findMany(clinic => clinic.date < referenceDate)
      .sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        return b.startTime.localeCompare(a.startTime);
      });
  }

  findRecentClinics(limit: number = 10): Clinic[] {
    return this.data
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  findByTimeRange(startTime: string, endTime: string, date?: string): Clinic[] {
    return this.findMany(clinic => {
      const matchesTimeRange = clinic.startTime >= startTime && clinic.endTime <= endTime;
      const matchesDate = !date || clinic.date === date;
      return matchesTimeRange && matchesDate;
    });
  }

  searchClinics(searchTerm: string): Clinic[] {
    const term = searchTerm.toLowerCase();
    return this.findMany(clinic => 
      clinic.name.toLowerCase().includes(term) ||
      clinic.description.toLowerCase().includes(term)
    );
  }

  getMostExpensive(limit: number = 5): Clinic[] {
    return this.data
      .sort((a, b) => b.price - a.price)
      .slice(0, limit);
  }

  getMostAffordable(limit: number = 5): Clinic[] {
    return this.data
      .sort((a, b) => a.price - b.price)
      .slice(0, limit);
  }

  getLargestCapacity(limit: number = 5): Clinic[] {
    return this.data
      .sort((a, b) => b.maxParticipants - a.maxParticipants)
      .slice(0, limit);
  }

  getAveragePrice(): number {
    if (this.data.length === 0) return 0;
    const total = this.data.reduce((sum, clinic) => sum + clinic.price, 0);
    return total / this.data.length;
  }

  getPriceStats(): { min: number; max: number; average: number; median: number } {
    if (this.data.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0 };
    }

    const prices = this.data.map(clinic => clinic.price).sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];
    const average = this.getAveragePrice();
    const median = prices.length % 2 === 0 
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

    return { min, max, average, median };
  }

  getParticipantStats(): { min: number; max: number; average: number; total: number } {
    if (this.data.length === 0) {
      return { min: 0, max: 0, average: 0, total: 0 };
    }

    const participants = this.data.map(clinic => clinic.maxParticipants);
    const min = Math.min(...participants);
    const max = Math.max(...participants);
    const total = participants.reduce((sum, count) => sum + count, 0);
    const average = total / this.data.length;

    return { min, max, average, total };
  }

  // Check for scheduling conflicts
  hasTimeConflict(courtId: string, date: string, startTime: string, endTime: string, excludeId?: string): boolean {
    return this.exists(clinic => {
      if (clinic.id === excludeId) return false;
      if (clinic.courtId !== courtId || clinic.date !== date) return false;
      
      // Check for time overlap
      const clinicStart = this.timeToMinutes(clinic.startTime);
      const clinicEnd = this.timeToMinutes(clinic.endTime);
      const newStart = this.timeToMinutes(startTime);
      const newEnd = this.timeToMinutes(endTime);
      
      return (newStart < clinicEnd && newEnd > clinicStart);
    });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Validation methods
  validateClinicCreation(clinicData: CreateClinic): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check time validity
    const startMinutes = this.timeToMinutes(clinicData.startTime);
    const endMinutes = this.timeToMinutes(clinicData.endTime);
    
    if (startMinutes >= endMinutes) {
      errors.push('End time must be after start time');
    }

    // Check for conflicts
    if (this.hasTimeConflict(clinicData.courtId, clinicData.date, clinicData.startTime, clinicData.endTime)) {
      errors.push('This time slot conflicts with an existing clinic');
    }

    // Check date is not in the past
    const clinicDate = new Date(clinicData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (clinicDate < today) {
      errors.push('Clinic date cannot be in the past');
    }

    if (clinicData.price < 0) {
      errors.push('Price cannot be negative');
    }

    if (clinicData.maxParticipants < 1) {
      errors.push('Maximum participants must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateClinicUpdate(id: string, clinicData: Partial<Clinic>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const existingClinic = this.findById(id);
    
    if (!existingClinic) {
      errors.push('Clinic not found');
      return { isValid: false, errors };
    }

    // If updating time-related fields, validate them
    const startTime = clinicData.startTime || existingClinic.startTime;
    const endTime = clinicData.endTime || existingClinic.endTime;
    const courtId = clinicData.courtId || existingClinic.courtId;
    const date = clinicData.date || existingClinic.date;

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    if (startMinutes >= endMinutes) {
      errors.push('End time must be after start time');
    }

    // Check for conflicts (excluding current clinic)
    if (this.hasTimeConflict(courtId, date, startTime, endTime, id)) {
      errors.push('This time slot conflicts with an existing clinic');
    }

    if (clinicData.price !== undefined && clinicData.price < 0) {
      errors.push('Price cannot be negative');
    }

    if (clinicData.maxParticipants !== undefined && clinicData.maxParticipants < 1) {
      errors.push('Maximum participants must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
