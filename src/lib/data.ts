
import { Court, TimeSlot, Reservation, User, Coach, Clinic, ReservationSettings, DaySettings } from './types';

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

// Default reservation settings
export const defaultDaySettings: DaySettings[] = [
  { dayOfWeek: 'monday', isOpen: true, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'tuesday', isOpen: true, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'wednesday', isOpen: true, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'thursday', isOpen: true, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'friday', isOpen: true, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'saturday', isOpen: true, startTime: '09:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'sunday', isOpen: true, startTime: '09:00', endTime: '18:00', timeSlotDuration: 60, breakTime: 15 },
];

export const reservationSettings: ReservationSettings = {
  id: '1',
  advanceBookingLimit: 24, // 24 hours in advance
  cancellationDeadline: 2, // 2 hours before
  maxPlayersPerSlot: 4,
  minPlayersPerSlot: 1,
  allowWalkIns: true,
  requirePayment: false,
  operatingHours: defaultDaySettings,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Helper function to get settings for a specific day
export const getDaySettings = (dayOfWeek: string): DaySettings | undefined => {
  return reservationSettings.operatingHours.find(day => day.dayOfWeek === dayOfWeek.toLowerCase());
};

// Helper function to convert time string to minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Generate time slots for the next 7 days
export const generateTimeSlots = (): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  const startDate = new Date();
  
  // For each of the next 7 days
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    // Format date as YYYY-MM-DD
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = currentDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Get settings for this day
    const daySettings = getDaySettings(dayName);
    
    // Skip if day is closed
    if (!daySettings || !daySettings.isOpen) continue;
    
    // Parse start and end times
    const startHour = parseInt(daySettings.startTime.split(':')[0]);
    const endHour = parseInt(daySettings.endTime.split(':')[0]);
    
    // For each court
    courts.forEach(court => {
      // Generate slots for each hour (8:00, 9:00, 10:00, etc.)
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        // Create a unique ID for the time slot
        const id = `${court.id}-${dateString}-${hour}`;
        
        // Set availability based on hour to create a more predictable pattern
        // Make most slots available, with some variation
        const available = hour % 3 !== 1; // This makes ~67% of slots available
        
        timeSlots.push({
          id,
          courtId: court.id,
          startTime,
          endTime,
          date: dateString,
          available,
          blocked: false,
        });
      }
    });
  }
  
  return timeSlots;
};

// Generate time slots for a specific date range
export const generateTimeSlotsForDateRange = (startDate: Date, endDate: Date): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  
  // For each day in the range
  for (let day = 0; day <= Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    // Format date as YYYY-MM-DD
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = currentDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Get settings for this day
    const daySettings = getDaySettings(dayName);
    
    // Skip if day is closed
    if (!daySettings || !daySettings.isOpen) continue;
    
    // Parse start and end times
    const startHour = parseInt(daySettings.startTime.split(':')[0]);
    const endHour = parseInt(daySettings.endTime.split(':')[0]);
    
    // For each court
    courts.forEach(court => {
      // Generate slots for each hour
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        // Create a unique ID for the time slot
        const id = `${court.id}-${dateString}-${hour}`;
        
        // Check if this slot already exists
        const existingSlot = timeSlots.find(slot => slot.id === id);
        if (existingSlot) continue;
        
        // Default to available unless it's in the past
        const now = new Date();
        const slotDate = new Date(currentDate);
        slotDate.setHours(hour, 0, 0, 0);
        const isPast = slotDate < now;
        
        timeSlots.push({
          id,
          courtId: court.id,
          startTime,
          endTime,
          date: dateString,
          available: !isPast, // Available if not in the past
          blocked: false,
        });
      }
    });
  }
  
  return timeSlots;
};

// Get or generate time slots for a specific date
export const getTimeSlotsForDate = (date: Date): TimeSlot[] => {
  const dateString = date.toISOString().split('T')[0];
  
  // Check if we already have slots for this date
  const existingSlots = timeSlots.filter(slot => slot.date === dateString);
  if (existingSlots.length > 0) {
    return existingSlots;
  }
  
  // Generate slots for this date if they don't exist
  const newSlots = generateTimeSlotsForDateRange(date, date);
  
  // Add new slots to the global timeSlots array
  timeSlots.push(...newSlots);
  
  return newSlots;
};

// Get or generate time slots for a date range
export const getTimeSlotsForDateRange = (startDate: Date, endDate: Date): TimeSlot[] => {
  const startString = startDate.toISOString().split('T')[0];
  const endString = endDate.toISOString().split('T')[0];
  
  // Check which dates we already have slots for
  const existingDates = new Set(timeSlots.map(slot => slot.date));
  const missingDates: Date[] = [];
  
  for (let day = 0; day <= Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateString = currentDate.toISOString().split('T')[0];
    
    if (!existingDates.has(dateString)) {
      missingDates.push(currentDate);
    }
  }
  
  // Generate slots for missing dates
  if (missingDates.length > 0) {
    const newSlots = generateTimeSlotsForDateRange(
      new Date(Math.min(...missingDates.map(d => d.getTime()))),
      new Date(Math.max(...missingDates.map(d => d.getTime())))
    );
    
    // Add new slots to the global timeSlots array
    timeSlots.push(...newSlots);
  }
  
  // Return all slots in the date range
  return timeSlots.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate >= startDate && slotDate <= endDate;
  });
};

export const timeSlots: TimeSlot[] = generateTimeSlots();

// Debug function to log time slot information
export const debugTimeSlots = () => {
  console.log('Total time slots generated:', timeSlots.length);
  console.log('Sample time slots:');
  timeSlots.slice(0, 20).forEach((slot, index) => {
    console.log(`${index}: ${slot.date} ${slot.startTime}-${slot.endTime} Court ${slot.courtId} Available: ${slot.available} Blocked: ${slot.blocked} Type: ${slot.type || 'none'}`);
  });
  
  const availableCount = timeSlots.filter(s => s.available).length;
  const blockedCount = timeSlots.filter(s => s.blocked).length;
  const reservedCount = timeSlots.filter(s => !s.available && !s.blocked).length;
  const clinicCount = timeSlots.filter(s => s.type === 'clinic').length;
  
  console.log(`Available: ${availableCount}, Blocked: ${blockedCount}, Reserved: ${reservedCount}, Clinics: ${clinicCount}`);
  
  // Check for patterns in availability
  const today = new Date().toISOString().split('T')[0];
  const todaySlots = timeSlots.filter(s => s.date === today);
  console.log(`Today's slots (${today}):`, todaySlots.length);
  todaySlots.forEach(slot => {
    console.log(`  ${slot.startTime}-${slot.endTime} Court ${slot.courtId}: Available=${slot.available}, Blocked=${slot.blocked}`);
  });
};

// Uncomment the line below to debug time slot generation
debugTimeSlots();

// Create some sample reservations after time slots are generated
export const createSampleReservations = (): Reservation[] => {
  const sampleReservations: Reservation[] = [];
  
  // Find some available time slots to reserve
  const availableSlots = timeSlots.filter(slot => slot.available && !slot.blocked);
  
  if (availableSlots.length > 0) {
    // Reserve the first available slot
    const firstSlot = availableSlots[0];
    firstSlot.available = false; // Mark as reserved
    
    sampleReservations.push({
      id: '1',
      timeSlotId: firstSlot.id,
      courtId: firstSlot.courtId,
      playerName: 'John Doe',
      playerEmail: 'john@example.com',
      playerPhone: '555-123-4567',
      players: 4,
      createdAt: new Date().toISOString(),
    });
  }
  
  if (availableSlots.length > 1) {
    // Reserve another available slot
    const secondSlot = availableSlots[1];
    secondSlot.available = false; // Mark as reserved
    
    sampleReservations.push({
      id: '2',
      timeSlotId: secondSlot.id,
      courtId: secondSlot.courtId,
      playerName: 'Jane Smith',
      playerEmail: 'jane@example.com',
      playerPhone: '555-987-6543',
      players: 2,
      createdAt: new Date().toISOString(),
    });
  }
  
  return sampleReservations;
};

export const reservations: Reservation[] = createSampleReservations();

// Helper functions for managing data
export const getAvailableTimeSlots = (date: string, courtId?: string): TimeSlot[] => {
  return timeSlots.filter(
    slot => slot.date === date && (slot.available || slot.type === 'clinic') && !slot.blocked && (!courtId || slot.courtId === courtId)
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
  
  if (timeSlot.blocked) {
    throw new Error('Cannot book a blocked time slot');
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

// Block/Unblock time slot functions
export const blockTimeSlot = (timeSlotId: string): boolean => {
  const slotIndex = timeSlots.findIndex(slot => slot.id === timeSlotId);
  if (slotIndex !== -1) {
    timeSlots[slotIndex].blocked = true;
    timeSlots[slotIndex].available = false;
    return true;
  }
  return false;
};

export const unblockTimeSlot = (timeSlotId: string): boolean => {
  const slotIndex = timeSlots.findIndex(slot => slot.id === timeSlotId);
  if (slotIndex !== -1) {
    timeSlots[slotIndex].blocked = false;
    timeSlots[slotIndex].available = true;
    return true;
  }
  return false;
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

// Create time slots for clinics (moved before clinics array usage)
const createClinicTimeSlots = (clinic: Clinic) => {
  const startHour = parseInt(clinic.startTime.split(':')[0]);
  const startMinute = parseInt(clinic.startTime.split(':')[1]);
  const endHour = parseInt(clinic.endTime.split(':')[0]);
  const endMinute = parseInt(clinic.endTime.split(':')[1]);
  
  // Calculate total duration in minutes
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  
  // For clinics that span multiple hours, create slots for each hour
  if (durationMinutes >= 60) {
    for (let hour = startHour; hour < endHour; hour++) {
      const slotId = `${clinic.courtId}-${clinic.date}-${hour}`;
      const existingSlotIndex = timeSlots.findIndex(slot => slot.id === slotId);
      
      if (existingSlotIndex !== -1) {
        // Update existing slot to be clinic type
        timeSlots[existingSlotIndex] = {
          ...timeSlots[existingSlotIndex],
          type: 'clinic',
          clinicId: clinic.id,
          available: true, // Clinics should be bookable
          blocked: false, // Ensure clinic slots are not blocked
        };
      } else {
        // Create new time slot for clinic
        timeSlots.push({
          id: slotId,
          courtId: clinic.courtId,
          startTime: `${hour}:00`,
          endTime: `${hour + 1}:00`,
          date: clinic.date,
          available: true, // Clinics should be bookable
          blocked: false,
          type: 'clinic',
          clinicId: clinic.id,
        });
      }
    }
  } else {
    // For short clinics (less than 1 hour), create a single slot
    const slotId = `${clinic.courtId}-${clinic.date}-${startHour}`;
    const existingSlotIndex = timeSlots.findIndex(slot => slot.id === slotId);
    
    if (existingSlotIndex !== -1) {
      // Update existing slot to be clinic type
      timeSlots[existingSlotIndex] = {
        ...timeSlots[existingSlotIndex],
        type: 'clinic',
        clinicId: clinic.id,
        available: true,
        blocked: false,
      };
    } else {
      // Create new time slot for clinic
      timeSlots.push({
        id: slotId,
        courtId: clinic.courtId,
        startTime: clinic.startTime,
        endTime: clinic.endTime,
        date: clinic.date,
        available: true,
        blocked: false,
        type: 'clinic',
        clinicId: clinic.id,
      });
    }
  }
};

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
  {
    id: '2',
    name: 'Advanced Pickleball Workshop',
    description: 'Master advanced techniques and strategies for competitive play.',
    coachId: '2',
    courtId: '2',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
    startTime: '14:00',
    endTime: '16:00',
    maxParticipants: 6,
    price: 60,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Quick Skills Session',
    description: '30-minute focused training on specific skills.',
    coachId: '1',
    courtId: '3',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '16:00',
    endTime: '16:30',
    maxParticipants: 4,
    price: 25,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'All-Day Pickleball Camp',
    description: 'Comprehensive training camp covering all aspects of the game.',
    coachId: '2',
    courtId: '1',
    date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
    startTime: '09:00',
    endTime: '12:00',
    maxParticipants: 12,
    price: 120,
    createdAt: new Date().toISOString(),
  },
];

// Create time slots for existing clinics
clinics.forEach(clinic => {
  createClinicTimeSlots(clinic);
});

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

// Helper function for adding users to reservations
export const addUserToReservation = (
  timeSlotId: string,
  courtId: string,
  playerName: string,
  playerEmail: string,
  playerPhone: string,
  players: number
): Reservation => {
  // Find the time slot
  const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
  
  if (!timeSlot) {
    throw new Error('Time slot not found');
  }

  // Check if the time slot is blocked
  if (timeSlot.blocked) {
    throw new Error('Cannot book a blocked time slot');
  }

  // Check if the time slot is available or is a clinic
  if (!timeSlot.available && timeSlot.type !== 'clinic') {
    throw new Error('Time slot is not available for reservation');
  }

  // Mark the time slot as unavailable (unless it's a clinic)
  if (timeSlot.type !== 'clinic') {
    const slotIndex = timeSlots.findIndex(slot => slot.id === timeSlotId);
    if (slotIndex !== -1) {
      timeSlots[slotIndex].available = false;
      timeSlots[slotIndex].type = 'reservation';
    }
  }

  const newReservation: Reservation = {
    id: `res-${Date.now()}`,
    timeSlotId,
    courtId,
    playerName,
    playerEmail,
    playerPhone,
    players,
    createdAt: new Date().toISOString(),
  };
  
  reservations.push(newReservation);
  return newReservation;
};

// Helper function to update reservation settings
export const updateReservationSettings = (newSettings: Partial<ReservationSettings>): ReservationSettings => {
  const updatedSettings: ReservationSettings = {
    ...reservationSettings,
    ...newSettings,
    updatedAt: new Date().toISOString(),
  };
  
  // Update the main settings object
  Object.assign(reservationSettings, updatedSettings);
  
  return updatedSettings;
};

// Helper function to check if a time is within operating hours for a specific day
export const isWithinOperatingHours = (dayOfWeek: string, time: string): boolean => {
  const daySettings = getDaySettings(dayOfWeek);
  if (!daySettings || !daySettings.isOpen) return false;
  
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(daySettings.startTime);
  const endMinutes = timeToMinutes(daySettings.endTime);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

// Helper function to get clinic by ID
export const getClinicById = (id: string): Clinic | undefined => {
  return clinics.find(clinic => clinic.id === id);
};

// Helper function to get coach by ID
export const getCoachById = (id: string): Coach | undefined => {
  return coaches.find(coach => coach.id === id);
};

