import { CoachRepository } from '../repositories/coach-repository';
import type { Coach, CreateCoach } from '../validation/schemas';

export class CoachService {
  constructor(private coachRepository: CoachRepository) {}

  // Core CRUD operations
  getAllCoaches(): Coach[] {
    return this.coachRepository.findAll();
  }

  getCoachById(id: string): Coach | undefined {
    return this.coachRepository.findById(id);
  }

  createCoach(data: CreateCoach): { success: boolean; coach?: Coach; errors?: string[] } {
    try {
      // Validate coach creation
      const validation = this.coachRepository.validateCoachCreation(data);
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const coach = this.coachRepository.create(data);
      return { success: true, coach };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }

  updateCoach(id: string, data: Partial<Coach>): { success: boolean; coach?: Coach; errors?: string[] } {
    try {
      // Validate coach update
      const validation = this.coachRepository.validateCoachUpdate(id, data);
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const coach = this.coachRepository.update(id, data);
      
      if (!coach) {
        return { success: false, errors: ['Coach not found'] };
      }

      return { success: true, coach };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }

  deleteCoach(id: string): { success: boolean; error?: string } {
    try {
      const deleted = this.coachRepository.delete(id);
      return { success: deleted, error: deleted ? undefined : 'Coach not found' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Query methods
  findCoachByEmail(email: string): Coach | undefined {
    return this.coachRepository.findByEmail(email);
  }

  findCoachByPhone(phone: string): Coach | undefined {
    return this.coachRepository.findByPhone(phone);
  }

  searchCoaches(searchTerm: string): Coach[] {
    return this.coachRepository.searchCoaches(searchTerm);
  }

  findCoachesByName(name: string): Coach[] {
    return this.coachRepository.findByName(name);
  }

  findCoachesBySpecialty(specialty: string): Coach[] {
    return this.coachRepository.findBySpecialty(specialty);
  }

  findCoachesByHourlyRateRange(minRate: number, maxRate: number): Coach[] {
    return this.coachRepository.findByHourlyRateRange(minRate, maxRate);
  }

  getRecentCoaches(limit: number = 10): Coach[] {
    return this.coachRepository.findRecentCoaches(limit);
  }

  getMostExpensiveCoaches(limit: number = 5): Coach[] {
    return this.coachRepository.findMostExpensive(limit);
  }

  getMostAffordableCoaches(limit: number = 5): Coach[] {
    return this.coachRepository.findMostAffordable(limit);
  }

  // Specialty management
  getAllSpecialties(): string[] {
    return this.coachRepository.getAllSpecialties();
  }

  getCoachesGroupedBySpecialty(): Record<string, Coach[]> {
    const specialties = this.getAllSpecialties();
    const grouped: Record<string, Coach[]> = {};

    specialties.forEach(specialty => {
      grouped[specialty] = this.findCoachesBySpecialty(specialty);
    });

    return grouped;
  }

  // Analytics and reporting
  getAverageHourlyRate(): number {
    return this.coachRepository.getAverageHourlyRate();
  }

  getHourlyRateStats(): { min: number; max: number; average: number; median: number } {
    return this.coachRepository.getHourlyRateStats();
  }

  getCoachStats(): {
    totalCoaches: number;
    averageHourlyRate: number;
    rateStats: { min: number; max: number; average: number; median: number };
    specialtyCount: number;
    specialtyDistribution: Record<string, number>;
    recentCoachCount: number;
  } {
    const rateStats = this.getHourlyRateStats();
    const specialties = this.getAllSpecialties();
    const recentCoaches = this.getRecentCoaches(30); // Last 30 coaches

    // Calculate specialty distribution
    const specialtyDistribution: Record<string, number> = {};
    const allCoaches = this.getAllCoaches();
    
    allCoaches.forEach(coach => {
      coach.specialties.forEach(specialty => {
        specialtyDistribution[specialty] = (specialtyDistribution[specialty] || 0) + 1;
      });
    });

    return {
      totalCoaches: allCoaches.length,
      averageHourlyRate: rateStats.average,
      rateStats,
      specialtyCount: specialties.length,
      specialtyDistribution,
      recentCoachCount: recentCoaches.length
    };
  }

  getCoachesInPriceRange(budget: number): {
    affordable: Coach[];
    moderate: Coach[];
    premium: Coach[];
  } {
    const allCoaches = this.getAllCoaches();
    const affordable: Coach[] = [];
    const moderate: Coach[] = [];
    const premium: Coach[] = [];

    allCoaches.forEach(coach => {
      if (coach.hourlyRate <= budget * 0.7) {
        affordable.push(coach);
      } else if (coach.hourlyRate <= budget) {
        moderate.push(coach);
      } else {
        premium.push(coach);
      }
    });

    return { affordable, moderate, premium };
  }

  // Recommendation system
  recommendCoaches(criteria: {
    specialty?: string;
    maxBudget?: number;
    minExperience?: number;
  }): Coach[] {
    let coaches = this.getAllCoaches();

    // Filter by specialty
    if (criteria.specialty) {
      coaches = coaches.filter(coach => 
        coach.specialties.some(s => s.toLowerCase().includes(criteria.specialty!.toLowerCase()))
      );
    }

    // Filter by budget
    if (criteria.maxBudget) {
      coaches = coaches.filter(coach => coach.hourlyRate <= criteria.maxBudget!);
    }

    // Sort by hourly rate (ascending for best value)
    return coaches.sort((a, b) => a.hourlyRate - b.hourlyRate);
  }

  // Validation helpers
  isEmailAvailable(email: string, excludeCoachId?: string): boolean {
    return this.coachRepository.isEmailUnique(email, excludeCoachId);
  }

  isPhoneAvailable(phone: string, excludeCoachId?: string): boolean {
    return this.coachRepository.isPhoneUnique(phone, excludeCoachId);
  }

  validateCoachData(coachData: CreateCoach): { isValid: boolean; errors: string[] } {
    return this.coachRepository.validateCoachCreation(coachData);
  }

  validateCoachUpdate(id: string, coachData: Partial<Coach>): { isValid: boolean; errors: string[] } {
    return this.coachRepository.validateCoachUpdate(id, coachData);
  }
}
