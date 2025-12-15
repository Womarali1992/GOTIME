import type {
  Court,
  TimeSlot,
  Reservation,
  User,
  Coach,
  Clinic,
  ReservationSettings,
  Social
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * API-backed data service using REST endpoints
 * Replaces IndexedDB with SQLite backend
 */
export class ApiDataService {
  async initialize() {
    console.log('[ApiDataService] Checking API connection...');
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
      if (!response.ok) throw new Error('API not responding');
      console.log('[ApiDataService] Connected to API successfully');
    } catch (error) {
      console.error('[ApiDataService] Failed to connect to API:', error);
      throw error;
    }
  }

  // Courts
  async getAllCourts(): Promise<Court[]> {
    const response = await fetch(`${API_BASE_URL}/courts`);
    if (!response.ok) throw new Error('Failed to fetch courts');
    return response.json();
  }

  async getCourtById(id: string): Promise<Court | undefined> {
    const response = await fetch(`${API_BASE_URL}/courts/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch court');
    return response.json();
  }

  // Time Slots
  async getAllTimeSlots(): Promise<TimeSlot[]> {
    const response = await fetch(`${API_BASE_URL}/time-slots`);
    if (!response.ok) throw new Error('Failed to fetch time slots');
    return response.json();
  }

  async getTimeSlotById(id: string): Promise<TimeSlot | undefined> {
    const response = await fetch(`${API_BASE_URL}/time-slots/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch time slot');
    return response.json();
  }

  async getTimeSlotsForDate(date: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/time-slots/date/${date}`);
    if (!response.ok) throw new Error('Failed to fetch time slots for date');
    return response.json();
  }

  async getTimeSlotsForCourt(courtId: string): Promise<TimeSlot[]> {
    const response = await fetch(`${API_BASE_URL}/time-slots?courtId=${courtId}`);
    if (!response.ok) throw new Error('Failed to fetch time slots for court');
    return response.json();
  }

  async createTimeSlot(data: Omit<TimeSlot, 'id' | 'createdAt'>): Promise<TimeSlot> {
    const response = await fetch(`${API_BASE_URL}/time-slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create time slot');
    return response.json();
  }

  async updateTimeSlot(id: string, data: Partial<TimeSlot>): Promise<TimeSlot | undefined> {
    const response = await fetch(`${API_BASE_URL}/time-slots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to update time slot');
    return response.json();
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/time-slots/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  }

  async deleteTimeSlotsByDate(date: string): Promise<number> {
    const slots = await fetch(`${API_BASE_URL}/time-slots?date=${date}`).then(r => r.json());
    let deleted = 0;
    for (const slot of slots) {
      const success = await this.deleteTimeSlot(slot.id);
      if (success) deleted++;
    }
    return deleted;
  }

  async generateTimeSlots(date: string, courtId?: string): Promise<{ generated: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/time-slots/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, courtId }),
    });
    if (!response.ok) throw new Error('Failed to generate time slots');
    return response.json();
  }

  // Reservations
  async getAllReservations(): Promise<Reservation[]> {
    const response = await fetch(`${API_BASE_URL}/reservations`);
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return response.json();
  }

  async getReservationById(id: string): Promise<Reservation | undefined> {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch reservation');
    return response.json();
  }

  async getReservationByTimeSlotId(timeSlotId: string): Promise<Reservation | undefined> {
    const response = await fetch(`${API_BASE_URL}/reservations/timeslot/${timeSlotId}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch reservation');
    return response.json();
  }

  async createReservation(data: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create reservation');
    return response.json();
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation | undefined> {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to update reservation');
    return response.json();
  }

  async deleteReservation(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  }

  // Users
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  async getUserById(id: string): Promise<User | undefined> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }

  async deleteUser(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  }

  // Settings
  async getReservationSettings(): Promise<ReservationSettings | undefined> {
    const response = await fetch(`${API_BASE_URL}/settings`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  }

  async updateReservationSettings(newSettings: Partial<ReservationSettings>): Promise<ReservationSettings> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  }

  // Socials
  async getAllSocials(): Promise<Social[]> {
    const response = await fetch(`${API_BASE_URL}/socials`);
    if (!response.ok) throw new Error('Failed to fetch socials');
    return response.json();
  }

  async getSocialById(id: string): Promise<Social | undefined> {
    const response = await fetch(`${API_BASE_URL}/socials/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch social');
    return response.json();
  }

  async getSocialsForDate(date: string): Promise<Social[]> {
    const response = await fetch(`${API_BASE_URL}/socials/date/${date}`);
    if (!response.ok) throw new Error('Failed to fetch socials for date');
    return response.json();
  }

  async getActiveSocials(): Promise<Social[]> {
    const response = await fetch(`${API_BASE_URL}/socials?status=active`);
    if (!response.ok) throw new Error('Failed to fetch active socials');
    return response.json();
  }

  async createSocial(data: Omit<Social, 'id' | 'createdAt'>): Promise<Social> {
    const response = await fetch(`${API_BASE_URL}/socials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create social');
    return response.json();
  }

  async updateSocial(id: string, data: Partial<Social>): Promise<Social | undefined> {
    const response = await fetch(`${API_BASE_URL}/socials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to update social');
    return response.json();
  }

  async deleteSocial(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/socials/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  }

  async addVoteToSocial(socialId: string, userId: string, vote: 'yes' | 'no'): Promise<Social | undefined> {
    const response = await fetch(`${API_BASE_URL}/socials/${socialId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, vote }),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to add vote');
    return response.json();
  }

  // Coaches
  async getAllCoaches(): Promise<Coach[]> {
    const response = await fetch(`${API_BASE_URL}/coaches`);
    if (!response.ok) throw new Error('Failed to fetch coaches');
    return response.json();
  }

  async getCoachById(id: string): Promise<Coach | undefined> {
    const response = await fetch(`${API_BASE_URL}/coaches/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch coach');
    return response.json();
  }

  // Clinics
  async getAllClinics(): Promise<Clinic[]> {
    const response = await fetch(`${API_BASE_URL}/clinics`);
    if (!response.ok) throw new Error('Failed to fetch clinics');
    return response.json();
  }

  async getClinicById(id: string): Promise<Clinic | undefined> {
    const response = await fetch(`${API_BASE_URL}/clinics/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch clinic');
    return response.json();
  }

  // No-op methods for compatibility
  regenerateTimeSlots = async () => {};
  clearAllData = async () => {};
  resetDatabase = async () => {};
}

// Create singleton instance
export const apiDataService = new ApiDataService();
