import { BaseRepository } from './base-repository';
import { PrivateSessionSchema, CreatePrivateSessionSchema } from '../validation/schemas';
import type { PrivateSession, CreatePrivateSession } from '../validation/schemas';

export class PrivateSessionRepository extends BaseRepository<PrivateSession, CreatePrivateSession> {
  constructor(initialData: PrivateSession[] = []) {
    super(PrivateSessionSchema, CreatePrivateSessionSchema, initialData);
  }

  protected getEntityPrefix(): string {
    return 'private-session';
  }

  findByCoachId(coachId: string): PrivateSession[] {
    return this.findMany(session => session.coachId === coachId);
  }

  findByClientId(clientId: string): PrivateSession[] {
    return this.findMany(session => session.clientId === clientId);
  }

  findByCourtId(courtId: string): PrivateSession[] {
    return this.findMany(session => session.courtId === courtId);
  }

  findByTimeSlotId(timeSlotId: string): PrivateSession | undefined {
    return this.findOne(session => session.timeSlotId === timeSlotId);
  }

  findByDate(date: string): PrivateSession[] {
    return this.findMany(session => session.date === date);
  }

  findByDateRange(startDate: string, endDate: string): PrivateSession[] {
    return this.findMany(session => session.date >= startDate && session.date <= endDate);
  }

  findByStatus(status: PrivateSession['status']): PrivateSession[] {
    return this.findMany(session => session.status === status);
  }

  findByCoachAndDate(coachId: string, date: string): PrivateSession[] {
    return this.findMany(session =>
      session.coachId === coachId && session.date === date
    );
  }

  findByCoachAndDateRange(coachId: string, startDate: string, endDate: string): PrivateSession[] {
    return this.findMany(session =>
      session.coachId === coachId &&
      session.date >= startDate &&
      session.date <= endDate
    );
  }

  findByCoachAndStatus(coachId: string, status: PrivateSession['status']): PrivateSession[] {
    return this.findMany(session =>
      session.coachId === coachId && session.status === status
    );
  }

  findByClientAndStatus(clientId: string, status: PrivateSession['status']): PrivateSession[] {
    return this.findMany(session =>
      session.clientId === clientId && session.status === status
    );
  }

  findUpcoming(fromDate?: string): PrivateSession[] {
    const referenceDate = fromDate || new Date().toISOString().split('T')[0];
    return this.findMany(session => session.date >= referenceDate)
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.startTime.localeCompare(b.startTime);
      });
  }

  findUpcomingByCoach(coachId: string, fromDate?: string): PrivateSession[] {
    const referenceDate = fromDate || new Date().toISOString().split('T')[0];
    return this.findMany(session =>
      session.coachId === coachId && session.date >= referenceDate
    ).sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  findUpcomingByClient(clientId: string, fromDate?: string): PrivateSession[] {
    const referenceDate = fromDate || new Date().toISOString().split('T')[0];
    return this.findMany(session =>
      session.clientId === clientId && session.date >= referenceDate
    ).sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  findPast(toDate?: string): PrivateSession[] {
    const referenceDate = toDate || new Date().toISOString().split('T')[0];
    return this.findMany(session => session.date < referenceDate)
      .sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        return b.startTime.localeCompare(a.startTime);
      });
  }

  findRecentSessions(limit: number = 10): PrivateSession[] {
    return this.data
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  findByPriceRange(minPrice: number, maxPrice: number): PrivateSession[] {
    return this.findMany(session =>
      session.price >= minPrice && session.price <= maxPrice
    );
  }

  getAveragePrice(): number {
    if (this.data.length === 0) return 0;
    const total = this.data.reduce((sum, session) => sum + session.price, 0);
    return total / this.data.length;
  }

  getCoachSessionCount(coachId: string): number {
    return this.findByCoachId(coachId).length;
  }

  getClientSessionCount(clientId: string): number {
    return this.findByClientId(clientId).length;
  }

  getCoachEarnings(coachId: string): number {
    return this.findByCoachId(coachId)
      .filter(session => session.status === 'completed')
      .reduce((total, session) => total + session.price, 0);
  }

  getStatusCounts(): Record<PrivateSession['status'], number> {
    return this.data.reduce((counts, session) => {
      counts[session.status] = (counts[session.status] || 0) + 1;
      return counts;
    }, {} as Record<PrivateSession['status'], number>);
  }

  // Validation helper
  hasConflictingSession(coachId: string, date: string, startTime: string, endTime: string, excludeSessionId?: string): boolean {
    return this.findMany(session => {
      if (excludeSessionId && session.id === excludeSessionId) return false;
      if (session.coachId !== coachId) return false;
      if (session.date !== date) return false;
      if (session.status === 'cancelled') return false;

      // Check for time overlap
      return (
        (startTime >= session.startTime && startTime < session.endTime) ||
        (endTime > session.startTime && endTime <= session.endTime) ||
        (startTime <= session.startTime && endTime >= session.endTime)
      );
    }).length > 0;
  }
}
