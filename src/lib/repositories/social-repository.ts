import { BaseRepository } from './base-repository';
import { SocialSchema, CreateSocialSchema } from '../validation/schemas';
import type { Social, CreateSocial } from '../validation/schemas';

const STORAGE_KEY = 'picklepop_socials';

export class SocialRepository extends BaseRepository<Social, CreateSocial> {
  constructor(initialData: Social[] = []) {
    // Load from localStorage first, fallback to initialData
    const storedData = SocialRepository.loadFromStorage();
    super(SocialSchema, CreateSocialSchema, storedData.length > 0 ? storedData : initialData);
  }

  protected getEntityPrefix(): string {
    return 'social';
  }

  // Load socials from localStorage
  private static loadFromStorage(): Social[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Clean up: if it's an empty array, remove the key
        if (Array.isArray(parsed) && parsed.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
          return [];
        }

        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Failed to load socials from localStorage:', error);
    }
    return [];
  }

  // Save socials to localStorage
  private saveToStorage(): void {
    try {
      const data = this.findAll();
      if (data.length === 0) {
        // Remove the key entirely if no socials exist
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save socials to localStorage:', error);
    }
  }

  // Override create to persist
  create(data: CreateSocial): Social {
    const social = super.create(data);
    this.saveToStorage();
    return social;
  }

  // Override update to persist
  update(id: string, data: Partial<Social>): Social {
    const social = super.update(id, data);
    this.saveToStorage();
    return social;
  }

  // Override delete to persist
  delete(id: string): boolean {
    const result = super.delete(id);
    if (result) {
      this.saveToStorage();
    }
    return result;
  }

  findByHostId(hostId: string): Social[] {
    return this.findMany(social => social.hostId === hostId);
  }

  findByDate(date: string): Social[] {
    return this.findMany(social => social.date === date);
  }

  findUpcoming(): Social[] {
    const today = new Date().toISOString().split('T')[0];
    return this.findMany(social => social.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  findLocked(): Social[] {
    return this.findMany(social => social.lockedTimeSlotId !== undefined);
  }

  findPending(): Social[] {
    return this.findMany(social => social.lockedTimeSlotId === undefined);
  }

  voteForTimeSlot(socialId: string, timeSlotId: string, userId: string): Social {
    const social = this.findById(socialId);
    if (!social) {
      throw new Error(`Social with id ${socialId} not found`);
    }

    const updatedTimeSlots = social.timeSlots.map(slot => {
      if (slot.id === timeSlotId) {
        // Add vote if not already voted
        if (!slot.votes.includes(userId)) {
          return { ...slot, votes: [...slot.votes, userId] };
        }
      } else {
        // Remove vote from other slots
        return { ...slot, votes: slot.votes.filter(id => id !== userId) };
      }
      return slot;
    });

    const updated = this.update(socialId, {
      timeSlots: updatedTimeSlots,
      updatedAt: new Date().toISOString()
    });
    // update() already calls saveToStorage()
    return updated;
  }

  lockTimeSlot(socialId: string, timeSlotId: string): Social {
    const social = this.findById(socialId);
    if (!social) {
      throw new Error(`Social with id ${socialId} not found`);
    }

    const timeSlotExists = social.timeSlots.some(slot => slot.id === timeSlotId);
    if (!timeSlotExists) {
      throw new Error(`Time slot with id ${timeSlotId} not found in social`);
    }

    const updated = this.update(socialId, {
      lockedTimeSlotId: timeSlotId,
      updatedAt: new Date().toISOString()
    });
    // update() already calls saveToStorage()
    return updated;
  }

  unlockTimeSlot(socialId: string): Social {
    const social = this.findById(socialId);
    if (!social) {
      throw new Error(`Social with id ${socialId} not found`);
    }

    const updated = this.update(socialId, {
      lockedTimeSlotId: undefined,
      updatedAt: new Date().toISOString()
    });
    // update() already calls saveToStorage()
    return updated;
  }

  getTopVotedTimeSlot(socialId: string): { id: string; time: string; votes: number } | null {
    const social = this.findById(socialId);
    if (!social || social.timeSlots.length === 0) {
      return null;
    }

    const sorted = [...social.timeSlots].sort((a, b) => b.votes.length - a.votes.length);
    const top = sorted[0];

    return {
      id: top.id,
      time: top.time,
      votes: top.votes.length
    };
  }

  linkReservation(socialId: string, reservationId: string, courtId: string): Social {
    const social = this.findById(socialId);
    if (!social) {
      throw new Error(`Social with id ${socialId} not found`);
    }

    if (!social.lockedTimeSlotId) {
      throw new Error('Social must have a locked time slot before linking a reservation');
    }

    const updated = this.update(socialId, {
      reservationId,
      courtId,
      updatedAt: new Date().toISOString()
    });
    // update() already calls saveToStorage()
    return updated;
  }

  unlinkReservation(socialId: string): Social {
    const social = this.findById(socialId);
    if (!social) {
      throw new Error(`Social with id ${socialId} not found`);
    }

    const updated = this.update(socialId, {
      reservationId: undefined,
      updatedAt: new Date().toISOString()
    });
    // update() already calls saveToStorage()
    return updated;
  }

  findBooked(): Social[] {
    return this.findMany(social => social.reservationId !== undefined);
  }

  findBookable(): Social[] {
    return this.findMany(social =>
      social.lockedTimeSlotId !== undefined && social.reservationId === undefined
    );
  }

  isBookable(socialId: string): boolean {
    const social = this.findById(socialId);
    return !!(social && social.lockedTimeSlotId && !social.reservationId);
  }
}
