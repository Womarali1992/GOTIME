
export type Court = {
  id: string;
  name: string;
  location: string;
  indoor: boolean;
};

export type Comment = {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
};

export type TimeSlot = {
  id: string;
  courtId: string;
  startTime: string;
  endTime: string;
  date: string;
  available: boolean;
  blocked: boolean;
  type?: 'clinic' | 'reservation';
  clinicId?: string;
  comments: Comment[]; // Multiple comments instead of single notes
};

export type Reservation = {
  id: string;
  timeSlotId: string;
  courtId: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  players: number;
  createdAt: string;
  comments: Comment[]; // Multiple comments instead of single notes
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: 'basic' | 'premium' | 'admin';
  createdAt: string;
  comments: Comment[]; // Multiple comments instead of single notes
};

export type Coach = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  bio: string;
  hourlyRate: number;
  createdAt: string;
};

export type Clinic = {
  id: string;
  name: string;
  description: string;
  coachId: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  price: number;
  createdAt: string;
};

export type DaySettings = {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  startTime: string;
  endTime: string;
  timeSlotDuration: number; // in minutes
  breakTime: number; // in minutes between slots
};

export type ReservationSettings = {
  id: string;
  advanceBookingLimit: number; // hours before the time slot
  cancellationDeadline: number; // hours before the time slot
  maxPlayersPerSlot: number;
  minPlayersPerSlot: number;
  allowWalkIns: boolean;
  requirePayment: boolean;
  operatingHours: DaySettings[];
  createdAt: string;
  updatedAt: string;
};
