import type {
  Court,
  TimeSlot,
  Reservation,
  User,
  Coach,
  Clinic,
  ReservationSettings,
} from '../types';

// In production, use the same origin (subdomain-based tenancy).
// In dev, fall back to localhost:3001.
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD
    ? `${window.location.origin}/api`
    : 'http://localhost:3001/api'
);

// Dev tenant override — set via VITE_TENANT_ID env var or defaults to "default"
const DEV_TENANT_ID = import.meta.env.VITE_TENANT_ID || 'default';

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  // In dev mode, send X-Tenant-ID header so the server knows which tenant we mean
  if (!import.meta.env.PROD) {
    h['X-Tenant-ID'] = DEV_TENANT_ID;
  }
  return h;
}

function getHeaders(): Record<string, string> {
  // GET requests don't need Content-Type but need tenant header
  if (!import.meta.env.PROD) {
    return { 'X-Tenant-ID': DEV_TENANT_ID };
  }
  return {};
}

/**
 * API-backed data service using REST endpoints
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
    const response = await fetch(`${API_BASE_URL}/courts`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch courts');
    return response.json();
  }

  async getCourtById(id: string): Promise<Court | undefined> {
    const response = await fetch(`${API_BASE_URL}/courts/${id}`, { headers: getHeaders() });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch court');
    return response.json();
  }

  // Time Slots
  async getAllTimeSlots(): Promise<TimeSlot[]> {
    const response = await fetch(`${API_BASE_URL}/time-slots`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch time slots');
    return response.json();
  }

  async getTimeSlotById(id: string): Promise<TimeSlot | undefined> {
    const response = await fetch(`${API_BASE_URL}/time-slots/${id}`, { headers: getHeaders() });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch time slot');
    return response.json();
  }

  async getTimeSlotsForDate(date: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/time-slots/date/${date}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch time slots for date');
    return response.json();
  }

  async getTimeSlotsForCourt(courtId: string): Promise<TimeSlot[]> {
    const response = await fetch(`${API_BASE_URL}/time-slots?courtId=${courtId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch time slots for court');
    return response.json();
  }

  async createTimeSlot(data: Omit<TimeSlot, 'id' | 'createdAt'>): Promise<TimeSlot> {
    const response = await fetch(`${API_BASE_URL}/time-slots`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create time slot');
    return response.json();
  }

  async updateTimeSlot(id: string, data: Partial<TimeSlot>): Promise<TimeSlot | undefined> {
    const response = await fetch(`${API_BASE_URL}/time-slots/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to update time slot');
    return response.json();
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/time-slots/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.ok;
  }

  async deleteTimeSlotsByDate(date: string): Promise<number> {
    const slots = await fetch(`${API_BASE_URL}/time-slots?date=${date}`, { headers: getHeaders() }).then(r => r.json());
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
      headers: headers(),
      body: JSON.stringify({ date, courtId }),
    });
    if (!response.ok) throw new Error('Failed to generate time slots');
    return response.json();
  }

  // Reservations
  async getAllReservations(): Promise<Reservation[]> {
    const response = await fetch(`${API_BASE_URL}/reservations`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return response.json();
  }

  async getReservationById(id: string): Promise<Reservation | undefined> {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, { headers: getHeaders() });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch reservation');
    return response.json();
  }

  async getReservationByTimeSlotId(timeSlotId: string): Promise<Reservation | undefined> {
    const response = await fetch(`${API_BASE_URL}/reservations/timeslot/${timeSlotId}`, { headers: getHeaders() });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch reservation');
    return response.json();
  }

  async createReservation(data: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMessage = errorData.details || errorData.error || 'Failed to create reservation';
      throw new Error(errorMessage);
    }
    return response.json();
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation | undefined> {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to update reservation');
    return response.json();
  }

  async joinOpenPlay(reservationId: string, participant: { name: string; email: string; phone: string }): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/join`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(participant),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to join' }));
      throw new Error(errorData.error || 'Failed to join open play');
    }
    return response.json();
  }

  async deleteReservation(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.ok;
  }

  // Auth
  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(errorData.error || 'Login failed');
    }
    return response.json();
  }

  async signup(data: { name: string; email: string; phone: string; password: string; duprRating?: number }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/signup`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Signup failed' }));
      throw new Error(errorData.error || 'Signup failed');
    }
    return response.json();
  }

  // Users
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  async getUserById(id: string): Promise<User | undefined> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, { headers: getHeaders() });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }

  async deleteUser(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.ok;
  }

  // Settings
  async getReservationSettings(): Promise<ReservationSettings | undefined> {
    const response = await fetch(`${API_BASE_URL}/settings`, { headers: getHeaders() });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  }

  async updateReservationSettings(newSettings: Partial<ReservationSettings>): Promise<ReservationSettings> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(newSettings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  }

  // Coach Auth
  async loginCoach(email: string, password: string): Promise<Coach> {
    const response = await fetch(`${API_BASE_URL}/coaches/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(errorData.error || 'Login failed');
    }
    return response.json();
  }

  // Coaches
  async getAllCoaches(): Promise<Coach[]> {
    const response = await fetch(`${API_BASE_URL}/coaches`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch coaches');
    return response.json();
  }

  async getCoachById(id: string): Promise<Coach | undefined> {
    const response = await fetch(`${API_BASE_URL}/coaches/${id}`, { headers: getHeaders() });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch coach');
    return response.json();
  }

  // Clinics
  async getAllClinics(): Promise<Clinic[]> {
    const response = await fetch(`${API_BASE_URL}/clinics`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch clinics');
    return response.json();
  }

  async getClinicById(id: string): Promise<Clinic | undefined> {
    const response = await fetch(`${API_BASE_URL}/clinics/${id}`, { headers: getHeaders() });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch clinic');
    return response.json();
  }

  async createClinic(data: Omit<Clinic, 'id' | 'createdAt'>): Promise<Clinic> {
    const response = await fetch(`${API_BASE_URL}/clinics`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create clinic');
    return response.json();
  }

  async createCoach(data: Omit<Coach, 'id' | 'createdAt'>): Promise<Coach> {
    const response = await fetch(`${API_BASE_URL}/coaches`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create coach');
    return response.json();
  }

  async updateCoach(id: string, data: Partial<Coach>): Promise<Coach> {
    const response = await fetch(`${API_BASE_URL}/coaches/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update coach');
    return response.json();
  }

  // No-op methods for compatibility
  regenerateTimeSlots = async () => {};
  clearAllData = async () => {};
  resetDatabase = async () => {};
}

// Create singleton instance
export const apiDataService = new ApiDataService();
