import { CourtRepository } from '../repositories/court-repository';
import { TimeSlotRepository } from '../repositories/time-slot-repository';
import { ReservationRepository } from '../repositories/reservation-repository';
import { UserRepository } from '../repositories/user-repository';
import { CoachRepository } from '../repositories/coach-repository';
import { ClinicRepository } from '../repositories/clinic-repository';
import { timeSlots as dataTimeSlots, clinics as dataClinics, coaches as dataCoaches, users as dataUsers } from '../data';



import { ReservationService } from './reservation-service';
import { TimeSlotService } from './time-slot-service';
import { UserService } from './user-service';
import { CoachService } from './coach-service';
import { ClinicService } from './clinic-service';


import type { 
  Court, TimeSlot, Reservation, User, Coach, Clinic, 
  DaySettings, ReservationSettings 
} from '../validation/schemas';

// Initial courts data
const initialCourts: Court[] = [
  {
    id: '1',
    name: 'Court A',
    location: 'Main Hall',
    indoor: true,
  },
  {
    id: '2',
    name: 'Court B',
    location: 'Main Hall',
    indoor: true,
  },
  {
    id: '3',
    name: 'Court C',
    location: 'Outdoor Area',
    indoor: false,
  },
];

// Default reservation settings
const defaultDaySettings = [
  { dayOfWeek: 'monday', isOpen: false, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'tuesday', isOpen: true, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'wednesday', isOpen: true, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'thursday', isOpen: true, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'friday', isOpen: true, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'saturday', isOpen: true, startTime: '09:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'sunday', isOpen: true, startTime: '09:00', endTime: '18:00', timeSlotDuration: 60, breakTime: 15 },
];

const initialReservationSettings: ReservationSettings = {
  id: '1',
  courtName: 'Pickleball Court',
  advanceBookingLimit: 24, // 24 hours in advance
  cancellationDeadline: 2, // 2 hours before
  maxPlayersPerSlot: 4,
  minPlayersPerSlot: 1,
  allowWalkIns: true,
  requirePayment: false,
  timeSlotVisibilityPeriod: '4_weeks' as const,
  operatingHours: defaultDaySettings,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Helper function to get settings for a specific day
const getDaySettings = (dayOfWeek: string) => {
  return initialReservationSettings.operatingHours.find(day => day.dayOfWeek === dayOfWeek.toLowerCase());
};

// Helper function to convert time period enum to days
const getTimeSlotVisibilityDays = (period: string): number => {
  switch (period) {
    case '1_week': return 7;
    case '2_weeks': return 14;
    case '4_weeks': return 28;
    case '6_weeks': return 42;
    case '8_weeks': return 56;
    default: return 14; // Default to 2 weeks
  }
};

// Generate time slots for the configured time period
const generateTimeSlots = (): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  const startDate = new Date();
  const visibilityDays = getTimeSlotVisibilityDays(initialReservationSettings.timeSlotVisibilityPeriod);

  // For each day in the visibility period
  for (let day = 0; day < visibilityDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);

    // Format date as YYYY-MM-DD
    const dateString = currentDate.toISOString().split('T')[0];

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = currentDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Get settings for this day
    const daySettings = getDaySettings(dayName);

    // Skip if day is closed
    if (!daySettings || !daySettings.isOpen) continue;

    // Parse start and end times
    const startHour = parseInt(daySettings.startTime.split(':')[0]);
    const endHour = parseInt(daySettings.endTime.split(':')[0]);

    // For each court
    initialCourts.forEach(court => {
      // Generate slots for each hour (8:00, 9:00, 10:00, etc.)
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

        // Create a unique ID for the time slot
        const id = `${court.id}-${dateString}-${hour}`;

        // Set availability based on hour to create a more predictable pattern
        // Make most slots available, with some variation
        const available = hour % 3 !== 1; // This makes ~67% of slots available

        timeSlots.push({
          id,
          courtId: court.id,
          startTime,
          endTime,
          date: dateString,
          available,
          blocked: false,
          comments: [],
        });
      }
    });
  }

  return timeSlots;
};

const initialTimeSlots = dataTimeSlots;

// Sample reservations
const initialReservations: Reservation[] = [];

// Sample users
const initialUsers: User[] = dataUsers;

// Sample coaches
const initialCoaches: Coach[] = dataCoaches;

// Sample clinics
const initialClinics: Clinic[] = dataClinics;



export class DataService {
  // Repositories
  private courtRepository: CourtRepository;
  private timeSlotRepository: TimeSlotRepository;
  private reservationRepository: ReservationRepository;
  private userRepository: UserRepository;
  private coachRepository: CoachRepository;
  private clinicRepository: ClinicRepository;



  // Services
  public reservationService: ReservationService;
  public timeSlotService: TimeSlotService;
  public userService: UserService;
  public coachService: CoachService;
  public clinicService: ClinicService;


  // Settings
  private _reservationSettings: ReservationSettings;

  constructor() {
    // Initialize repositories with existing data
    this.courtRepository = new CourtRepository(initialCourts);
    this.timeSlotRepository = new TimeSlotRepository(initialTimeSlots);
    this.reservationRepository = new ReservationRepository(initialReservations);
    this.userRepository = new UserRepository(initialUsers);
    this.coachRepository = new CoachRepository(initialCoaches);
    this.clinicRepository = new ClinicRepository(initialClinics);



    // Initialize services
    this.reservationService = new ReservationService(
      this.reservationRepository,
      this.timeSlotRepository,
      this.courtRepository
    );

    this.timeSlotService = new TimeSlotService(
      this.timeSlotRepository,
      this.reservationRepository,
      this.clinicRepository,
      this.courtRepository
    );

    this.userService = new UserService(this.userRepository);
    this.coachService = new CoachService(this.coachRepository);
    this.clinicService = new ClinicService(
      this.clinicRepository,
      this.timeSlotRepository,
      this.coachRepository,
      this.courtRepository
    );



    // Initialize settings
    this._reservationSettings = { ...initialReservationSettings };



    // Ensure data consistency on initialization
    this.ensureDataConsistency();
  }



  // Court management
  getAllCourts(): Court[] {
    return this.courtRepository.findAll();
  }

  getCourtById(id: string): Court | undefined {
    return this.courtRepository.findById(id);
  }

  // Settings management
  getReservationSettings(): ReservationSettings {
    return { ...this._reservationSettings };
  }

  updateReservationSettings(newSettings: Partial<ReservationSettings>): ReservationSettings {
    this._reservationSettings = {
      ...this._reservationSettings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    return { ...this._reservationSettings };
  }

  getDaySettings(dayOfWeek: string): DaySettings | undefined {
    return this._reservationSettings.operatingHours.find(
      day => day.dayOfWeek === dayOfWeek.toLowerCase()
    );
  }

  getTimeSlotVisibilityDays(): number {
    return getTimeSlotVisibilityDays(this._reservationSettings.timeSlotVisibilityPeriod);
  }

  getTimeSlotVisibilityPeriod(): string {
    return this._reservationSettings.timeSlotVisibilityPeriod;
  }

  // User management with DUPR support
  updateUserDuprRating(userId: string, duprRating: number): { success: boolean; user?: User; error?: string } {
    return this.userService.updateUserDuprRating(userId, duprRating);
  }

  getUsersByDuprRange(minRating?: number, maxRating?: number): User[] {
    return this.userService.getUsersByDuprRange(minRating, maxRating);
  }

  getUsersWithoutDuprRating(): User[] {
    return this.userService.getUsersWithoutDuprRating();
  }

  getDuprStats(): { withRating: number; withoutRating: number; beginner: number; intermediate: number; advanced: number } {
    const stats = this.userService.getUserStats();
    return stats.duprDistribution;
  }

  // Data consistency and validation
  ensureDataConsistency(): void {
    console.log('Ensuring data consistency...');
    
    // Use the time slot service to ensure consistency
    this.timeSlotService.ensureDataConsistency();
    
    console.log('Data consistency check completed');
  }

  validateDataIntegrity(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned reservations
    const allTimeSlots = this.timeSlotRepository.findAll();
    const validTimeSlotIds = new Set(allTimeSlots.map(slot => slot.id));
    const allReservations = this.reservationRepository.findAll();
    
    const orphanedReservations = allReservations.filter(res => !validTimeSlotIds.has(res.timeSlotId));
    if (orphanedReservations.length > 0) {
      errors.push(`Found ${orphanedReservations.length} orphaned reservations without corresponding time slots`);
    }

    // Check for time slots with inconsistent status
    allTimeSlots.forEach(slot => {
      const reservation = this.reservationRepository.findByTimeSlotId(slot.id);
      const clinic = slot.type === 'clinic' && slot.clinicId 
        ? this.clinicRepository.findById(slot.clinicId) 
        : null;

      if (slot.blocked && slot.available) {
        errors.push(`Time slot ${slot.id} is blocked but marked as available`);
      }

      if (reservation && slot.available && slot.type !== 'clinic') {
        errors.push(`Time slot ${slot.id} has a reservation but is marked as available`);
      }

      if (slot.type === 'clinic' && !slot.available) {
        warnings.push(`Clinic time slot ${slot.id} is marked as unavailable`);
      }

      if (slot.type === 'reservation' && !reservation) {
        errors.push(`Time slot ${slot.id} is marked as reservation type but has no reservation`);
      }

      if (slot.type === 'clinic' && !clinic) {
        errors.push(`Time slot ${slot.id} is marked as clinic type but has no clinic`);
      }
    });

    // Check for duplicate reservations
    const reservationTimeSlotIds = allReservations.map(res => res.timeSlotId);
    const duplicateTimeSlotIds = reservationTimeSlotIds.filter((id, index) => 
      reservationTimeSlotIds.indexOf(id) !== index
    );

    if (duplicateTimeSlotIds.length > 0) {
      errors.push(`Found duplicate reservations for time slots: ${duplicateTimeSlotIds.join(', ')}`);
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  fixDataInconsistencies(): void {
    console.log('Fixing data inconsistencies...');

    // Remove orphaned reservations
    const allTimeSlots = this.timeSlotRepository.findAll();
    const validTimeSlotIds = new Set(allTimeSlots.map(slot => slot.id));
    const allReservations = this.reservationRepository.findAll();
    
    const orphanedReservations = allReservations.filter(res => !validTimeSlotIds.has(res.timeSlotId));
    orphanedReservations.forEach(reservation => {
      this.reservationRepository.delete(reservation.id);
    });

    if (orphanedReservations.length > 0) {
      console.log(`Removed ${orphanedReservations.length} orphaned reservations`);
    }

    // Fix time slot status inconsistencies
    this.ensureDataConsistency();

    console.log('Data inconsistencies fixed');
  }

  // Analytics and reporting
  getSystemStats(): {
    courts: number;
    timeSlots: number;
    reservations: number;
    users: number;
    coaches: number;
    clinics: number;
    dataIntegrity: { isValid: boolean; errorCount: number; warningCount: number };
  } {
    const integrity = this.validateDataIntegrity();

    return {
      courts: this.courtRepository.count(),
      timeSlots: this.timeSlotRepository.count(),
      reservations: this.reservationRepository.count(),
      users: this.userRepository.count(),
      coaches: this.coachRepository.count(),
      clinics: this.clinicRepository.count(),
      dataIntegrity: {
        isValid: integrity.isValid,
        errorCount: integrity.errors.length,
        warningCount: integrity.warnings.length
      }
    };
  }

  // Migration and initialization helpers
  refreshData(): void {
    this.ensureDataConsistency();
    console.log('Data refreshed');
  }

  debugInfo(): void {
    const stats = this.getSystemStats();
    console.log('System Statistics:', stats);
    
    const integrity = this.validateDataIntegrity();
    if (!integrity.isValid) {
      console.warn('Data integrity issues:', integrity.errors);
      console.warn('Warnings:', integrity.warnings);
    }

    // Time slot stats
    const timeSlotStats = this.timeSlotService.getTimeSlotStats();
    console.log('Time Slot Statistics:', timeSlotStats);
  }
}

// Create singleton instance
export const dataService = new DataService();
