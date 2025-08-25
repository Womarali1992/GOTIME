import { ReservationRepository } from '../repositories/reservation-repository';
import { TimeSlotRepository } from '../repositories/time-slot-repository';
import { CourtRepository } from '../repositories/court-repository';
import type { Reservation, CreateReservation, Comment } from '../validation/schemas';

export class ReservationService {
  constructor(
    private reservationRepository: ReservationRepository,
    private timeSlotRepository: TimeSlotRepository,
    private courtRepository: CourtRepository
  ) {}

  // Core CRUD operations
  getAllReservations(): Reservation[] {
    return this.reservationRepository.findAll();
  }

  getReservationById(id: string): Reservation | undefined {
    return this.reservationRepository.findById(id);
  }

  createReservation(data: CreateReservation): { success: boolean; reservation?: Reservation; error?: string } {
    try {
      // Validate the reservation can be created
      const validation = this.reservationRepository.validateReservationCreation(
        data.timeSlotId,
        this.timeSlotRepository.findAll()
      );

      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Create the reservation
      const reservation = this.reservationRepository.create(data);

      // Mark the time slot as reserved
      this.timeSlotRepository.markAsReserved(data.timeSlotId);

      return { success: true, reservation };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  updateReservation(id: string, data: Partial<Reservation>): { success: boolean; reservation?: Reservation; error?: string } {
    try {
      const reservation = this.reservationRepository.update(id, data);
      
      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }

      return { success: true, reservation };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  deleteReservation(id: string): { success: boolean; error?: string } {
    try {
      const reservation = this.reservationRepository.findById(id);
      
      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }

      // Free up the time slot
      this.timeSlotRepository.markAsAvailable(reservation.timeSlotId);

      // Delete the reservation
      const deleted = this.reservationRepository.delete(id);
      
      return { success: deleted, error: deleted ? undefined : 'Failed to delete reservation' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Business logic methods
  getReservationsForDate(date: string): Array<Reservation & { court?: any; timeSlot?: any }> {
    const timeSlots = this.timeSlotRepository.findByDate(date);
    const reservations = this.reservationRepository.findByDate(date, timeSlots);
    
    return reservations.map(reservation => {
      const timeSlot = timeSlots.find(slot => slot.id === reservation.timeSlotId);
      const court = timeSlot ? this.courtRepository.findById(timeSlot.courtId) : undefined;
      
      return {
        ...reservation,
        timeSlot,
        court
      };
    });
  }

  getReservationsForDateRange(startDate: string, endDate: string): Array<Reservation & { court?: any; timeSlot?: any }> {
    const timeSlots = this.timeSlotRepository.findByDateRange(startDate, endDate);
    const reservations = this.reservationRepository.findByDateRange(startDate, endDate, timeSlots);
    
    return reservations.map(reservation => {
      const timeSlot = timeSlots.find(slot => slot.id === reservation.timeSlotId);
      const court = timeSlot ? this.courtRepository.findById(timeSlot.courtId) : undefined;
      
      return {
        ...reservation,
        timeSlot,
        court
      };
    });
  }

  getReservationsByPlayer(playerEmail: string): Array<Reservation & { court?: any; timeSlot?: any }> {
    const reservations = this.reservationRepository.findByPlayerEmail(playerEmail);
    
    return reservations.map(reservation => {
      const timeSlot = this.timeSlotRepository.findById(reservation.timeSlotId);
      const court = timeSlot ? this.courtRepository.findById(timeSlot.courtId) : undefined;
      
      return {
        ...reservation,
        timeSlot,
        court
      };
    });
  }

  searchReservationsByPlayerName(name: string): Array<Reservation & { court?: any; timeSlot?: any }> {
    const reservations = this.reservationRepository.findByPlayerName(name);
    
    return reservations.map(reservation => {
      const timeSlot = this.timeSlotRepository.findById(reservation.timeSlotId);
      const court = timeSlot ? this.courtRepository.findById(timeSlot.courtId) : undefined;
      
      return {
        ...reservation,
        timeSlot,
        court
      };
    });
  }

  getReservationsWithComments(): Array<Reservation & { court?: any; timeSlot?: any }> {
    const reservations = this.reservationRepository.findWithComments();
    
    return reservations.map(reservation => {
      const timeSlot = this.timeSlotRepository.findById(reservation.timeSlotId);
      const court = timeSlot ? this.courtRepository.findById(timeSlot.courtId) : undefined;
      
      return {
        ...reservation,
        timeSlot,
        court
      };
    });
  }

  // Comment management
  updateReservationComments(reservationId: string, comments: Comment[]): { success: boolean; error?: string } {
    try {
      const reservation = this.reservationRepository.update(reservationId, { comments });
      return { success: !!reservation, error: reservation ? undefined : 'Reservation not found' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  addCommentToReservation(reservationId: string, comment: Omit<Comment, 'id' | 'createdAt'>): { success: boolean; error?: string } {
    try {
      const reservation = this.reservationRepository.findById(reservationId);
      
      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }

      const newComment: Comment = {
        ...comment,
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...(reservation.comments || []), newComment];
      const updated = this.reservationRepository.update(reservationId, { comments: updatedComments });
      
      return { success: !!updated, error: updated ? undefined : 'Failed to add comment' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Analytics and reporting
  getReservationStats(startDate?: string, endDate?: string): {
    totalReservations: number;
    totalPlayers: number;
    averagePlayersPerReservation: number;
    reservationsWithComments: number;
    playerCountDistribution: Record<number, number>;
  } {
    let reservations = this.reservationRepository.findAll();
    
    if (startDate && endDate) {
      const timeSlots = this.timeSlotRepository.findByDateRange(startDate, endDate);
      reservations = this.reservationRepository.findByDateRange(startDate, endDate, timeSlots);
    }

    const totalReservations = reservations.length;
    const totalPlayers = reservations.reduce((sum, r) => sum + r.players, 0);
    const averagePlayersPerReservation = totalReservations > 0 ? totalPlayers / totalReservations : 0;
    const reservationsWithComments = reservations.filter(r => r.comments && r.comments.length > 0).length;
    
    const playerCountDistribution: Record<number, number> = {};
    reservations.forEach(r => {
      playerCountDistribution[r.players] = (playerCountDistribution[r.players] || 0) + 1;
    });

    return {
      totalReservations,
      totalPlayers,
      averagePlayersPerReservation,
      reservationsWithComments,
      playerCountDistribution
    };
  }

  getPlayerStats(playerEmail: string): {
    totalReservations: number;
    totalPlayersBooked: number;
    mostUsedCourt?: string;
    averagePlayersPerReservation: number;
  } {
    const reservations = this.reservationRepository.findByPlayerEmail(playerEmail);
    const totalReservations = reservations.length;
    const totalPlayersBooked = reservations.reduce((sum, r) => sum + r.players, 0);
    const averagePlayersPerReservation = totalReservations > 0 ? totalPlayersBooked / totalReservations : 0;

    // Find most used court
    const courtUsage: Record<string, number> = {};
    reservations.forEach(r => {
      courtUsage[r.courtId] = (courtUsage[r.courtId] || 0) + 1;
    });

    const mostUsedCourtId = Object.entries(courtUsage).reduce((a, b) => a[1] > b[1] ? a : b)?.[0];
    const mostUsedCourt = mostUsedCourtId ? this.courtRepository.findById(mostUsedCourtId)?.name : undefined;

    return {
      totalReservations,
      totalPlayersBooked,
      mostUsedCourt,
      averagePlayersPerReservation
    };
  }

  // Validation helpers
  canCreateReservation(timeSlotId: string): { canCreate: boolean; reason?: string } {
    const validation = this.reservationRepository.validateReservationCreation(
      timeSlotId,
      this.timeSlotRepository.findAll()
    );

    return {
      canCreate: validation.isValid,
      reason: validation.error
    };
  }

  isTimeSlotReserved(timeSlotId: string): boolean {
    return this.reservationRepository.isTimeSlotReserved(timeSlotId);
  }
}
