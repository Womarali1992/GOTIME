import { PrivateSessionRepository } from '../repositories/private-session-repository';
import { TimeSlotRepository } from '../repositories/time-slot-repository';
import { CoachRepository } from '../repositories/coach-repository';
import { CourtRepository } from '../repositories/court-repository';
import { UserRepository } from '../repositories/user-repository';
import type { PrivateSession, CreatePrivateSession, Coach, Court, User } from '../validation/schemas';

export interface PrivateSessionWithDetails extends PrivateSession {
  coach?: Coach;
  client?: User;
  court?: Court;
}

export class PrivateSessionService {
  constructor(
    private privateSessionRepository: PrivateSessionRepository,
    private timeSlotRepository: TimeSlotRepository,
    private coachRepository: CoachRepository,
    private courtRepository: CourtRepository,
    private userRepository: UserRepository
  ) {}

  // Core CRUD operations
  getAllSessions(): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findAll();
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getSessionById(id: string): PrivateSessionWithDetails | undefined {
    const session = this.privateSessionRepository.findById(id);
    return session ? this.enrichSessionWithDetails(session) : undefined;
  }

  createSession(data: CreatePrivateSession): { success: boolean; session?: PrivateSessionWithDetails; errors?: string[] } {
    try {
      console.log('PrivateSessionService.createSession called with data:', data);

      // Validate session creation
      const validation = this.validateSessionCreation(data);

      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Create the session
      const session = this.privateSessionRepository.create(data);

      // Update time slot to mark it as private coaching
      this.createSessionTimeSlot(session);

      return { success: true, session: this.enrichSessionWithDetails(session) };
    } catch (error) {
      console.error('Error in PrivateSessionService.createSession:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  updateSession(id: string, data: Partial<PrivateSession>): { success: boolean; session?: PrivateSessionWithDetails; errors?: string[] } {
    try {
      const session = this.privateSessionRepository.update(id, data);

      if (!session) {
        return { success: false, errors: ['Session not found'] };
      }

      // Update time slot if time/court/date changed
      if (data.startTime || data.endTime || data.courtId || data.date || data.timeSlotId) {
        this.createSessionTimeSlot(session);
      }

      return { success: true, session: this.enrichSessionWithDetails(session) };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  deleteSession(id: string): { success: boolean; error?: string } {
    try {
      const session = this.privateSessionRepository.findById(id);

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Free up the time slot
      this.removeSessionTimeSlot(session);

      // Delete the session
      const deleted = this.privateSessionRepository.delete(id);

      return { success: deleted, error: deleted ? undefined : 'Failed to delete session' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  cancelSession(id: string): { success: boolean; session?: PrivateSessionWithDetails; error?: string } {
    try {
      const session = this.privateSessionRepository.findById(id);

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (session.status === 'cancelled') {
        return { success: false, error: 'Session is already cancelled' };
      }

      if (session.status === 'completed') {
        return { success: false, error: 'Cannot cancel a completed session' };
      }

      const updatedSession = this.privateSessionRepository.update(id, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });

      if (!updatedSession) {
        return { success: false, error: 'Failed to cancel session' };
      }

      // Free up the time slot
      this.removeSessionTimeSlot(updatedSession);

      return { success: true, session: this.enrichSessionWithDetails(updatedSession) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  completeSession(id: string): { success: boolean; session?: PrivateSessionWithDetails; error?: string } {
    try {
      const session = this.privateSessionRepository.findById(id);

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (session.status === 'cancelled') {
        return { success: false, error: 'Cannot complete a cancelled session' };
      }

      if (session.status === 'completed') {
        return { success: false, error: 'Session is already completed' };
      }

      const updatedSession = this.privateSessionRepository.update(id, {
        status: 'completed',
        updatedAt: new Date().toISOString()
      });

      if (!updatedSession) {
        return { success: false, error: 'Failed to complete session' };
      }

      return { success: true, session: this.enrichSessionWithDetails(updatedSession) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Query methods
  getSessionsByCoach(coachId: string): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findByCoachId(coachId);
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getSessionsByClient(clientId: string): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findByClientId(clientId);
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getSessionsForDate(date: string): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findByDate(date);
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getSessionsForDateRange(startDate: string, endDate: string): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findByDateRange(startDate, endDate);
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getUpcomingSessions(fromDate?: string): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findUpcoming(fromDate);
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getUpcomingSessionsByCoach(coachId: string, fromDate?: string): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findUpcomingByCoach(coachId, fromDate);
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getUpcomingSessionsByClient(clientId: string, fromDate?: string): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findUpcomingByClient(clientId, fromDate);
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getSessionsByStatus(status: PrivateSession['status']): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findByStatus(status);
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getCoachSessionsByStatus(coachId: string, status: PrivateSession['status']): PrivateSessionWithDetails[] {
    const sessions = this.privateSessionRepository.findByCoachAndStatus(coachId, status);
    return sessions.map(session => this.enrichSessionWithDetails(session));
  }

  getCoachBookings(coachId: string): {
    upcoming: PrivateSessionWithDetails[];
    pending: PrivateSessionWithDetails[];
    confirmed: PrivateSessionWithDetails[];
    completed: PrivateSessionWithDetails[];
  } {
    const today = new Date().toISOString().split('T')[0];
    const allSessions = this.getSessionsByCoach(coachId);

    return {
      upcoming: allSessions.filter(s => s.date >= today && s.status !== 'cancelled'),
      pending: allSessions.filter(s => s.status === 'pending'),
      confirmed: allSessions.filter(s => s.status === 'confirmed'),
      completed: allSessions.filter(s => s.status === 'completed'),
    };
  }

  // Analytics
  getCoachEarnings(coachId: string): number {
    return this.privateSessionRepository.getCoachEarnings(coachId);
  }

  getCoachSessionCount(coachId: string): number {
    return this.privateSessionRepository.getCoachSessionCount(coachId);
  }

  getSessionStats(): {
    total: number;
    byStatus: Record<PrivateSession['status'], number>;
    averagePrice: number;
  } {
    return {
      total: this.privateSessionRepository.count(),
      byStatus: this.privateSessionRepository.getStatusCounts(),
      averagePrice: this.privateSessionRepository.getAveragePrice(),
    };
  }

  // Helper methods
  private enrichSessionWithDetails(session: PrivateSession): PrivateSessionWithDetails {
    return {
      ...session,
      coach: this.coachRepository.findById(session.coachId),
      client: this.userRepository.findById(session.clientId),
      court: this.courtRepository.findById(session.courtId),
    };
  }

  private createSessionTimeSlot(session: PrivateSession): void {
    const timeSlot = this.timeSlotRepository.findById(session.timeSlotId);

    if (timeSlot) {
      this.timeSlotRepository.update(session.timeSlotId, {
        available: false,
        type: 'private_coaching',
        privateSessionId: session.id,
      });
    }
  }

  private removeSessionTimeSlot(session: PrivateSession): void {
    const timeSlot = this.timeSlotRepository.findById(session.timeSlotId);

    if (timeSlot) {
      this.timeSlotRepository.update(session.timeSlotId, {
        available: true,
        type: undefined,
        privateSessionId: undefined,
      });
    }
  }

  private validateSessionCreation(data: CreatePrivateSession): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if coach exists
    const coach = this.coachRepository.findById(data.coachId);
    if (!coach) {
      errors.push('Coach not found');
    } else if (!coach.isActive) {
      errors.push('Coach is not active');
    }

    // Check if client exists
    const client = this.userRepository.findById(data.clientId);
    if (!client) {
      errors.push('Client not found');
    }

    // Check if court exists
    const court = this.courtRepository.findById(data.courtId);
    if (!court) {
      errors.push('Court not found');
    }

    // Check if time slot exists and is available
    const timeSlot = this.timeSlotRepository.findById(data.timeSlotId);
    if (!timeSlot) {
      errors.push('Time slot not found');
    } else if (!timeSlot.available || timeSlot.blocked) {
      errors.push('Time slot is not available');
    }

    // Check for conflicting sessions
    if (coach) {
      const hasConflict = this.privateSessionRepository.hasConflictingSession(
        data.coachId,
        data.date,
        data.startTime,
        data.endTime
      );
      if (hasConflict) {
        errors.push('Coach has a conflicting session at this time');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Check coach availability
  isCoachAvailable(coachId: string, date: string, startTime: string, endTime: string): boolean {
    // Check if coach has conflicting sessions
    return !this.privateSessionRepository.hasConflictingSession(coachId, date, startTime, endTime);
  }

  getAvailableCoaches(date: string, startTime: string, endTime: string): Coach[] {
    const allCoaches = this.coachRepository.findAll().filter(c => c.isActive);

    return allCoaches.filter(coach =>
      this.isCoachAvailable(coach.id, date, startTime, endTime)
    );
  }
}
