import { BaseRepository } from './base-repository';
import { CoachSchema, CreateCoachSchema } from '../validation/schemas';
import type { Coach, CreateCoach } from '../validation/schemas';

export class CoachRepository extends BaseRepository<Coach, CreateCoach> {
  constructor(initialData: Coach[] = []) {
    super(CoachSchema, CreateCoachSchema, initialData);
  }

  protected getEntityPrefix(): string {
    return 'coach';
  }

  findByEmail(email: string): Coach | undefined {
    return this.findOne(coach => coach.email === email);
  }

  findByPhone(phone: string): Coach | undefined {
    return this.findOne(coach => coach.phone === phone);
  }

  findByName(name: string): Coach[] {
    return this.findMany(coach => 
      coach.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  findBySpecialty(specialty: string): Coach[] {
    return this.findMany(coach => 
      coach.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
    );
  }

  findByHourlyRateRange(minRate: number, maxRate: number): Coach[] {
    return this.findMany(coach => 
      coach.hourlyRate >= minRate && coach.hourlyRate <= maxRate
    );
  }

  findRecentCoaches(limit: number = 10): Coach[] {
    return this.data
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  searchCoaches(searchTerm: string): Coach[] {
    const term = searchTerm.toLowerCase();
    return this.findMany(coach => 
      coach.name.toLowerCase().includes(term) ||
      coach.email.toLowerCase().includes(term) ||
      coach.phone.includes(term) ||
      coach.bio.toLowerCase().includes(term) ||
      coach.specialties.some(specialty => specialty.toLowerCase().includes(term))
    );
  }

  findMostExpensive(limit: number = 5): Coach[] {
    return this.data
      .sort((a, b) => b.hourlyRate - a.hourlyRate)
      .slice(0, limit);
  }

  findMostAffordable(limit: number = 5): Coach[] {
    return this.data
      .sort((a, b) => a.hourlyRate - b.hourlyRate)
      .slice(0, limit);
  }

  getAllSpecialties(): string[] {
    const specialties = new Set<string>();
    this.data.forEach(coach => {
      coach.specialties.forEach(specialty => specialties.add(specialty));
    });
    return Array.from(specialties).sort();
  }

  getAverageHourlyRate(): number {
    if (this.data.length === 0) return 0;
    const total = this.data.reduce((sum, coach) => sum + coach.hourlyRate, 0);
    return total / this.data.length;
  }

  getHourlyRateStats(): { min: number; max: number; average: number; median: number } {
    if (this.data.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0 };
    }

    const rates = this.data.map(coach => coach.hourlyRate).sort((a, b) => a - b);
    const min = rates[0];
    const max = rates[rates.length - 1];
    const average = this.getAverageHourlyRate();
    const median = rates.length % 2 === 0 
      ? (rates[rates.length / 2 - 1] + rates[rates.length / 2]) / 2
      : rates[Math.floor(rates.length / 2)];

    return { min, max, average, median };
  }

  isEmailUnique(email: string, excludeId?: string): boolean {
    return !this.exists(coach => coach.email === email && coach.id !== excludeId);
  }

  isPhoneUnique(phone: string, excludeId?: string): boolean {
    return !this.exists(coach => coach.phone === phone && coach.id !== excludeId);
  }

  // Validation methods
  validateCoachCreation(coachData: CreateCoach): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isEmailUnique(coachData.email)) {
      errors.push('Email is already in use');
    }

    if (!this.isPhoneUnique(coachData.phone)) {
      errors.push('Phone number is already in use');
    }

    if (coachData.hourlyRate < 0) {
      errors.push('Hourly rate cannot be negative');
    }

    if (coachData.specialties.length === 0) {
      errors.push('At least one specialty is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateCoachUpdate(id: string, coachData: Partial<Coach>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (coachData.email && !this.isEmailUnique(coachData.email, id)) {
      errors.push('Email is already in use');
    }

    if (coachData.phone && !this.isPhoneUnique(coachData.phone, id)) {
      errors.push('Phone number is already in use');
    }

    if (coachData.hourlyRate !== undefined && coachData.hourlyRate < 0) {
      errors.push('Hourly rate cannot be negative');
    }

    if (coachData.specialties && coachData.specialties.length === 0) {
      errors.push('At least one specialty is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
