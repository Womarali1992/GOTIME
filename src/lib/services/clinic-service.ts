import { ClinicRepository } from '../repositories/clinic-repository';
import { TimeSlotRepository } from '../repositories/time-slot-repository';
import { CoachRepository } from '../repositories/coach-repository';
import { CourtRepository } from '../repositories/court-repository';
import type { Clinic, CreateClinic, Coach, Court } from '../validation/schemas';

export interface ClinicWithDetails extends Clinic {
  coach?: Coach;
  court?: Court;
}

export class ClinicService {
  constructor(
    private clinicRepository: ClinicRepository,
    private timeSlotRepository: TimeSlotRepository,
    private coachRepository: CoachRepository,
    private courtRepository: CourtRepository
  ) {}

  // Core CRUD operations
  getAllClinics(): ClinicWithDetails[] {
    const clinics = this.clinicRepository.findAll();
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getClinicById(id: string): ClinicWithDetails | undefined {
    const clinic = this.clinicRepository.findById(id);
    return clinic ? this.enrichClinicWithDetails(clinic) : undefined;
  }

  createClinic(data: CreateClinic): { success: boolean; clinic?: ClinicWithDetails; errors?: string[] } {
    try {
      console.log('ClinicService.createClinic called with data:', data);
      
      // Validate clinic creation
      console.log('Validating clinic creation...');
      const validation = this.clinicRepository.validateClinicCreation(data);
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        console.log('Validation failed:', validation.errors);
        return { success: false, errors: validation.errors };
      }

      // Create the clinic
      console.log('Creating clinic in repository...');
      const clinic = this.clinicRepository.create(data);
      console.log('Clinic created:', clinic);

      // Create or update time slots for the clinic
      console.log('Creating time slots for clinic...');
      this.createClinicTimeSlots(clinic);
      console.log('Time slots created');

      const enrichedClinic = this.enrichClinicWithDetails(clinic);
      console.log('Clinic enriched with details:', enrichedClinic);

      return { success: true, clinic: enrichedClinic };
    } catch (error) {
      console.error('Error in ClinicService.createClinic:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }

  updateClinic(id: string, data: Partial<Clinic>): { success: boolean; clinic?: ClinicWithDetails; errors?: string[] } {
    try {
      // Validate clinic update
      const validation = this.clinicRepository.validateClinicUpdate(id, data);
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const clinic = this.clinicRepository.update(id, data);
      
      if (!clinic) {
        return { success: false, errors: ['Clinic not found'] };
      }

      // Update time slots if time/court/date changed
      if (data.startTime || data.endTime || data.courtId || data.date) {
        this.createClinicTimeSlots(clinic);
      }

      return { success: true, clinic: this.enrichClinicWithDetails(clinic) };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }

  deleteClinic(id: string): { success: boolean; error?: string } {
    try {
      const clinic = this.clinicRepository.findById(id);
      
      if (!clinic) {
        return { success: false, error: 'Clinic not found' };
      }

      // Remove clinic time slots
      this.removeClinicTimeSlots(clinic);

      // Delete the clinic
      const deleted = this.clinicRepository.delete(id);
      
      return { success: deleted, error: deleted ? undefined : 'Failed to delete clinic' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Query methods
  getClinicsByCoach(coachId: string): ClinicWithDetails[] {
    const clinics = this.clinicRepository.findByCoachId(coachId);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getClinicsByCourt(courtId: string): ClinicWithDetails[] {
    const clinics = this.clinicRepository.findByCourtId(courtId);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getClinicsForDate(date: string): ClinicWithDetails[] {
    const clinics = this.clinicRepository.findByDate(date);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getClinicsForDateRange(startDate: string, endDate: string): ClinicWithDetails[] {
    const clinics = this.clinicRepository.findByDateRange(startDate, endDate);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  searchClinics(searchTerm: string): ClinicWithDetails[] {
    const clinics = this.clinicRepository.searchClinics(searchTerm);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getUpcomingClinics(fromDate?: string): ClinicWithDetails[] {
    const clinics = this.clinicRepository.findUpcoming(fromDate);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getPastClinics(toDate?: string): ClinicWithDetails[] {
    const clinics = this.clinicRepository.findPast(toDate);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getRecentClinics(limit: number = 10): ClinicWithDetails[] {
    const clinics = this.clinicRepository.findRecentClinics(limit);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getClinicsByPriceRange(minPrice: number, maxPrice: number): ClinicWithDetails[] {
    const clinics = this.clinicRepository.findByPriceRange(minPrice, maxPrice);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getMostExpensiveClinics(limit: number = 5): ClinicWithDetails[] {
    const clinics = this.clinicRepository.getMostExpensive(limit);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getMostAffordableClinics(limit: number = 5): ClinicWithDetails[] {
    const clinics = this.clinicRepository.getMostAffordable(limit);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  getLargestCapacityClinics(limit: number = 5): ClinicWithDetails[] {
    const clinics = this.clinicRepository.getLargestCapacity(limit);
    return clinics.map(clinic => this.enrichClinicWithDetails(clinic));
  }

  // Time slot management
  private createClinicTimeSlots(clinic: Clinic): void {
    const startHour = parseInt(clinic.startTime.split(':')[0]);
    const startMinute = parseInt(clinic.startTime.split(':')[1]);
    const endHour = parseInt(clinic.endTime.split(':')[0]);
    const endMinute = parseInt(clinic.endTime.split(':')[1]);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    if (durationMinutes >= 60) {
      // For clinics that span multiple hours, create slots for each hour
      for (let hour = startHour; hour < endHour; hour++) {
        const slotId = `${clinic.courtId}-${clinic.date}-${hour}`;
        const existingSlot = this.timeSlotRepository.findById(slotId);
        
        if (existingSlot) {
          this.timeSlotRepository.setAsClinic(slotId, clinic.id);
        } else {
          // Create new time slot for clinic
          const newSlot = this.timeSlotRepository.create({
            courtId: clinic.courtId,
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
            date: clinic.date,
            available: true,
            blocked: false,
            type: 'clinic',
            clinicId: clinic.id,
            comments: [],
          });
        }
      }
    } else {
      // For short clinics (less than 1 hour), create a single slot
      const slotId = `${clinic.courtId}-${clinic.date}-${startHour}`;
      const existingSlot = this.timeSlotRepository.findById(slotId);
      
      if (existingSlot) {
        this.timeSlotRepository.setAsClinic(slotId, clinic.id);
      } else {
        // Create new time slot for clinic
        const newSlot = this.timeSlotRepository.create({
          courtId: clinic.courtId,
          startTime: clinic.startTime,
          endTime: clinic.endTime,
          date: clinic.date,
          available: true,
          blocked: false,
          type: 'clinic',
          clinicId: clinic.id,
          comments: [],
        });
      }
    }
  }

  private removeClinicTimeSlots(clinic: Clinic): void {
    const clinicSlots = this.timeSlotRepository.findClinics(clinic.date, clinic.courtId)
      .filter(slot => slot.clinicId === clinic.id);
    
    clinicSlots.forEach(slot => {
      // Mark as available if not blocked
      this.timeSlotRepository.update(slot.id, {
        type: undefined,
        clinicId: undefined,
        available: !slot.blocked
      });
    });
  }

  // Analytics and reporting
  getAveragePrice(): number {
    return this.clinicRepository.getAveragePrice();
  }

  getPriceStats(): { min: number; max: number; average: number; median: number } {
    return this.clinicRepository.getPriceStats();
  }

  getParticipantStats(): { min: number; max: number; average: number; total: number } {
    return this.clinicRepository.getParticipantStats();
  }

  getClinicStats(): {
    totalClinics: number;
    upcomingClinics: number;
    pastClinics: number;
    averagePrice: number;
    priceStats: { min: number; max: number; average: number; median: number };
    participantStats: { min: number; max: number; average: number; total: number };
    coachDistribution: Record<string, number>;
    courtDistribution: Record<string, number>;
  } {
    const allClinics = this.getAllClinics();
    const upcomingClinics = this.getUpcomingClinics().length;
    const pastClinics = this.getPastClinics().length;
    const priceStats = this.getPriceStats();
    const participantStats = this.getParticipantStats();

    // Calculate distributions
    const coachDistribution: Record<string, number> = {};
    const courtDistribution: Record<string, number> = {};

    allClinics.forEach(clinic => {
      const coachName = clinic.coach?.name || 'Unknown Coach';
      const courtName = clinic.court?.name || 'Unknown Court';
      
      coachDistribution[coachName] = (coachDistribution[coachName] || 0) + 1;
      courtDistribution[courtName] = (courtDistribution[courtName] || 0) + 1;
    });

    return {
      totalClinics: allClinics.length,
      upcomingClinics,
      pastClinics,
      averagePrice: priceStats.average,
      priceStats,
      participantStats,
      coachDistribution,
      courtDistribution
    };
  }

  // Helper methods
  private enrichClinicWithDetails(clinic: Clinic): ClinicWithDetails {
    const coach = this.coachRepository.findById(clinic.coachId);
    const court = this.courtRepository.findById(clinic.courtId);

    return {
      ...clinic,
      coach,
      court
    };
  }

  // Conflict checking
  hasTimeConflict(courtId: string, date: string, startTime: string, endTime: string, excludeId?: string): boolean {
    return this.clinicRepository.hasTimeConflict(courtId, date, startTime, endTime, excludeId);
  }

  getConflictingClinics(courtId: string, date: string, startTime: string, endTime: string, excludeId?: string): ClinicWithDetails[] {
    const allClinics = this.getClinicsByCourt(courtId);
    
    return allClinics.filter(clinic => {
      if (clinic.id === excludeId) return false;
      if (clinic.date !== date) return false;
      
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

  // Validation helpers
  validateClinicData(clinicData: CreateClinic): { isValid: boolean; errors: string[] } {
    return this.clinicRepository.validateClinicCreation(clinicData);
  }

  validateClinicUpdate(id: string, clinicData: Partial<Clinic>): { isValid: boolean; errors: string[] } {
    return this.clinicRepository.validateClinicUpdate(id, clinicData);
  }
}
