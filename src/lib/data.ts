
import { Court, TimeSlot, Reservation, User, Coach, Clinic } from './types';

export const courts: Court[] = [
  {
    id: '1',
    name: 'Court A',
    location: 'Main Hall',
    indoor: true,
  },
  {
    id: '2',
    name: 'Court B',
    location: 'Main Hall',
    indoor: true,
  },
  {
    id: '3',
    name: 'Court C',
    location: 'Outdoor Area',
    indoor: false,
  },
];

// Generate time slots for the next 7 days
export const generateTimeSlots = (): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  const startDate = new Date();
  
  // Create slots from 8AM to 9PM with 1-hour intervals
  const startHour = 8;
  const endHour = 21;
  
  // For each of the next 7 days
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    // Format date as YYYY-MM-DD
    const dateString = currentDate.toISOString().split('T')[0];
    
    // For each court
    courts.forEach(court => {
      // For each hour slot
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour}:00`;
        const endTime = `${hour + 1}:00`;
        
        // Create a unique ID for the time slot
        const id = `${court.id}-${dateString}-${hour}`;
        
        // Randomly set some slots as unavailable
        const available = Math.random() > 0.3;
        
        timeSlots.push({
          id,
          courtId: court.id,
          startTime,
          endTime,
          date: dateString,
          available,
        });
      }
    });
  }
  
  return timeSlots;
};

export const timeSlots: TimeSlot[] = generateTimeSlots();

export const reservations: Reservation[] = [
  {
    id: '1',
    timeSlotId: timeSlots[0].id,
    courtId: courts[0].id,
    playerName: 'John Doe',
    playerEmail: 'john@example.com',
    playerPhone: '555-123-4567',
    players: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    timeSlotId: timeSlots[10].id,
    courtId: courts[1].id,
    playerName: 'Jane Smith',
    playerEmail: 'jane@example.com',
    playerPhone: '555-987-6543',
    players: 2,
    createdAt: new Date().toISOString(),
  },
];

// Helper functions for managing data
export const getAvailableTimeSlots = (date: string, courtId?: string): TimeSlot[] => {
  return timeSlots.filter(
    slot => slot.date === date && slot.available && (!courtId || slot.courtId === courtId)
  );
};

export const getCourtById = (id: string): Court | undefined => {
  return courts.find(court => court.id === id);
};

export const getTimeSlotById = (id: string): TimeSlot | undefined => {
  return timeSlots.find(slot => slot.id === id);
};

export const mockCreateReservation = (
  timeSlotId: string,
  playerName: string,
  playerEmail: string,
  playerPhone: string,
  players: number
): Reservation => {
  const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
  
  if (!timeSlot) {
    throw new Error('Time slot not found');
  }
  
  // Mark the time slot as unavailable
  const slotIndex = timeSlots.findIndex(slot => slot.id === timeSlotId);
  if (slotIndex !== -1) {
    timeSlots[slotIndex].available = false;
  }
  
  const newReservation: Reservation = {
    id: `res-${Date.now()}`,
    timeSlotId,
    courtId: timeSlot.courtId,
    playerName,
    playerEmail,
    playerPhone,
    players,
    createdAt: new Date().toISOString(),
  };
  
  reservations.push(newReservation);
  return newReservation;
};

// Users data
export const users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-123-4567',
    membershipType: 'premium',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-987-6543',
    membershipType: 'basic',
    createdAt: new Date().toISOString(),
  },
];

// Coaches data
export const coaches: Coach[] = [
  {
    id: '1',
    name: 'Maria Rodriguez',
    email: 'maria@example.com',
    phone: '555-111-2222',
    specialties: ['Beginner Lessons', 'Advanced Training'],
    bio: 'Professional tennis coach with 10+ years experience.',
    hourlyRate: 85,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'David Wilson',
    email: 'david@example.com',
    phone: '555-333-4444',
    specialties: ['Junior Programs', 'Competition Prep'],
    bio: 'Former professional player specializing in youth development.',
    hourlyRate: 95,
    createdAt: new Date().toISOString(),
  },
];

// Clinics data
export const clinics: Clinic[] = [
  {
    id: '1',
    name: 'Beginner Tennis Clinic',
    description: 'Learn the basics of tennis in a fun, supportive environment.',
    coachId: '1',
    courtId: '1',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '10:00',
    endTime: '12:00',
    maxParticipants: 8,
    price: 45,
    createdAt: new Date().toISOString(),
  },
];

// Helper functions for managing users
export const addUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const newUser: User = {
    ...user,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
};

// Helper functions for managing coaches
export const addCoach = (coach: Omit<Coach, 'id' | 'createdAt'>): Coach => {
  const newCoach: Coach = {
    ...coach,
    id: `coach-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  coaches.push(newCoach);
  return newCoach;
};

// Helper functions for managing clinics
export const addClinic = (clinic: Omit<Clinic, 'id' | 'createdAt'>): Clinic => {
  const newClinic: Clinic = {
    ...clinic,
    id: `clinic-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  clinics.push(newClinic);
  
  // Create time slots for the clinic
  createClinicTimeSlots(newClinic);
  
  return newClinic;
};

// Create time slots for clinics
const createClinicTimeSlots = (clinic: Clinic) => {
  const startHour = parseInt(clinic.startTime.split(':')[0]);
  const endHour = parseInt(clinic.endTime.split(':')[0]);
  
  for (let hour = startHour; hour < endHour; hour++) {
    const slotId = `${clinic.courtId}-${clinic.date}-${hour}`;
    const existingSlotIndex = timeSlots.findIndex(slot => slot.id === slotId);
    
    if (existingSlotIndex !== -1) {
      // Update existing slot to be clinic type
      timeSlots[existingSlotIndex] = {
        ...timeSlots[existingSlotIndex],
        type: 'clinic',
        clinicId: clinic.id,
        available: false,
      };
    } else {
      // Create new time slot for clinic
      timeSlots.push({
        id: slotId,
        courtId: clinic.courtId,
        startTime: `${hour}:00`,
        endTime: `${hour + 1}:00`,
        date: clinic.date,
        available: false,
        type: 'clinic',
        clinicId: clinic.id,
      });
    }
  }
};
