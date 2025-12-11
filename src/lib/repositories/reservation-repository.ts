import { BaseRepository } from './base-repository';
import { ReservationSchema, CreateReservationSchema } from '../validation/schemas';
import type { Reservation, CreateReservation } from '../validation/schemas';

export class ReservationRepository extends BaseRepository<Reservation, CreateReservation> {
  constructor(initialData: Reservation[] = []) {
    super(ReservationSchema, CreateReservationSchema, initialData);
  }

  protected getEntityPrefix(): string {
    return 'res';
  }

  findByTimeSlotId(timeSlotId: string): Reservation | undefined {
    return this.findOne(reservation => reservation.timeSlotId === timeSlotId);
  }

  findByCourtId(courtId: string): Reservation[] {
    return this.findMany(reservation => reservation.courtId === courtId);
  }

  findByPlayerEmail(email: string): Reservation[] {
    return this.findMany(reservation => reservation.playerEmail === email);
  }

  findByPlayerName(name: string): Reservation[] {
    return this.findMany(reservation => 
      reservation.playerName.toLowerCase().includes(name.toLowerCase())
    );
  }

  findByDate(date: string, timeSlots: { id: string; date: string }[]): Reservation[] {
    const timeSlotIds = new Set(
      timeSlots.filter(slot => slot.date === date).map(slot => slot.id)
    );
    return this.findMany(reservation => timeSlotIds.has(reservation.timeSlotId));
  }

  findByDateRange(startDate: string, endDate: string, timeSlots: { id: string; date: string }[]): Reservation[] {
    const timeSlotIds = new Set(
      timeSlots
        .filter(slot => slot.date >= startDate && slot.date <= endDate)
        .map(slot => slot.id)
    );
    return this.findMany(reservation => timeSlotIds.has(reservation.timeSlotId));
  }

  findWithComments(): Reservation[] {
    return this.findMany(reservation => reservation.comments && reservation.comments.length > 0);
  }

  findRecentReservations(limit: number = 10): Reservation[] {
    return this.data
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  findByPlayerCount(playerCount: number): Reservation[] {
    return this.findMany(reservation => reservation.players === playerCount);
  }

  findByPlayerCountRange(minPlayers: number, maxPlayers: number): Reservation[] {
    return this.findMany(reservation => 
      reservation.players >= minPlayers && reservation.players <= maxPlayers
    );
  }

  isTimeSlotReserved(timeSlotId: string): boolean {
    return this.exists(reservation => reservation.timeSlotId === timeSlotId);
  }

  getPlayerReservationCount(playerEmail: string): number {
    return this.count(reservation => reservation.playerEmail === playerEmail);
  }

  getTotalPlayersForDate(date: string, timeSlots: { id: string; date: string }[]): number {
    const reservationsForDate = this.findByDate(date, timeSlots);
    return reservationsForDate.reduce((total, reservation) => total + reservation.players, 0);
  }

  deleteByTimeSlotId(timeSlotId: string): boolean {
    const reservation = this.findByTimeSlotId(timeSlotId);
    return reservation ? this.delete(reservation.id) : false;
  }

  // Validation methods
  validateReservationCreation(timeSlotId: string, timeSlots: { id: string; available: boolean; blocked: boolean; type?: string }[]): { isValid: boolean; error?: string } {
    const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);

    if (!timeSlot) {
      return { isValid: false, error: 'Time slot not found' };
    }

    if (timeSlot.blocked) {
      return { isValid: false, error: 'Cannot book a blocked time slot' };
    }

    if (!timeSlot.available && timeSlot.type !== 'clinic' && timeSlot.type !== 'social') {
      return { isValid: false, error: 'Time slot is not available for reservation' };
    }

    if (this.isTimeSlotReserved(timeSlotId) && timeSlot.type !== 'clinic' && timeSlot.type !== 'social') {
      return { isValid: false, error: 'Time slot already has a reservation' };
    }

    return { isValid: true };
  }
}
