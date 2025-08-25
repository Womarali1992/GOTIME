
import { Court, TimeSlot, Reservation, User, Coach, Clinic, ReservationSettings, DaySettings, Comment, Participant } from './types';

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
  { dayOfWeek: 'monday', isOpen: false, startTime: '08:00', endTime: '22:00', timeSlotDuration: 60, breakTime: 15 },
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
  timeSlotVisibilityPeriod: '2_weeks',
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
          comments: [],
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
          comments: [],
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

// Ensure time slots exist for a specific date (alias for getTimeSlotsForDate for clarity)
export const ensureTimeSlotsForDate = (date: Date): TimeSlot[] => {
  return getTimeSlotsForDate(date);
};

// Ensure time slots exist for a date range
export const ensureTimeSlotsForDateRange = (startDate: Date, endDate: Date): TimeSlot[] => {
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

    return newSlots;
  }

  // Return all slots in the date range
  return timeSlots.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate >= startDate && slotDate <= endDate;
  });
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

  // Check September 1st specifically
  const sept1 = '2025-09-01';
  const sept1Slots = timeSlots.filter(s => s.date === sept1);
  console.log(`September 1st slots (${sept1}):`, sept1Slots.length);
  if (sept1Slots.length > 0) {
    sept1Slots.slice(0, 10).forEach(slot => {
      console.log(`  ${slot.startTime}-${slot.endTime} Court ${slot.courtId}: Available=${slot.available}, Blocked=${slot.blocked}`);
    });
  } else {
    console.log('  No slots found for September 1st!');
  }
};

// Test function to specifically check September 1st
export const testSept1Slots = () => {
  console.log('=== TESTING SEPTEMBER 1st SLOTS ===');
  const sept1 = new Date('2025-09-01');
  console.log('Generating slots for September 1st...');
  const slots = getTimeSlotsForDate(sept1);
  console.log(`Generated ${slots.length} slots for September 1st`);

  if (slots.length > 0) {
    console.log('First 5 slots:');
    slots.slice(0, 5).forEach(slot => {
      console.log(`  ${slot.date} ${slot.startTime}-${slot.endTime} Court ${slot.courtId}: Available=${slot.available}`);
    });
  }

  // Check total slots for September 1st
  const allSept1Slots = timeSlots.filter(s => s.date === '2025-09-01');
  console.log(`Total September 1st slots in global array: ${allSept1Slots.length}`);
  console.log('=== END TEST ===');
};

// Uncomment the line below to debug time slot generation
// debugTimeSlots();

// Test September 1st slots
// testSept1Slots();

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
      comments: [
        {
          id: '1',
          text: 'Regular player, prefers early morning slots. Has requested court maintenance.',
          authorId: 'admin',
          authorName: 'Admin',
          createdAt: new Date().toISOString(),
        }
      ],
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
      comments: [
        {
          id: '2',
          text: 'New player, may need equipment assistance.',
          authorId: 'admin',
          authorName: 'Admin',
          createdAt: new Date().toISOString(),
        }
      ],
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

// Function to ensure reservation data consistency
export const ensureReservationConsistency = () => {
  console.log('Ensuring reservation consistency...');
  
  // Remove any orphaned reservations (reservations without corresponding time slots)
  const validTimeSlotIds = new Set(timeSlots.map(slot => slot.id));
  const validReservations = reservations.filter(res => validTimeSlotIds.has(res.timeSlotId));
  
  if (validReservations.length !== reservations.length) {
    console.log(`Removing ${reservations.length - validReservations.length} orphaned reservations`);
    reservations.length = 0;
    reservations.push(...validReservations);
  }
  
  // Update all time slots to reflect their current reservation status
  timeSlots.forEach(slot => {
    const reservation = reservations.find(res => res.timeSlotId === slot.id);
    const clinic = slot.type === 'clinic' && slot.clinicId 
      ? clinics.find(c => c.id === slot.clinicId) 
      : null;
    
    // Determine correct status based on consistent logic
    if (slot.blocked) {
      // Blocked slots are never available
      slot.available = false;
      // Keep existing type unless it conflicts
      if (slot.type === 'reservation' && !reservation) {
        slot.type = undefined;
      }
    } else if (slot.type === 'clinic' && clinic) {
      // Clinics are always available for booking (people can join clinics)
      slot.available = true;
    } else if (reservation) {
      // Slots with reservations are not available
      slot.available = false;
      slot.type = 'reservation';
    } else {
      // Available slots
      slot.available = true;
      // Clear type if no reservation or clinic
      if (slot.type === 'reservation') {
        slot.type = undefined;
      }
    }
  });
  
  // Validate clinic time slots
  clinics.forEach(clinic => {
    const clinicSlots = timeSlots.filter(slot => 
      slot.type === 'clinic' && slot.clinicId === clinic.id
    );
    
    if (clinicSlots.length === 0) {
      console.warn(`Clinic ${clinic.id} has no associated time slots`);
    }
  });
  
  console.log('Reservation consistency check completed');
};

// Update the mockCreateReservation function to ensure consistency
export const mockCreateReservation = (
  timeSlotId: string,
  playerName: string,
  playerEmail: string,
  playerPhone: string,
  players: number,
  participants: Participant[] = []
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
    timeSlots[slotIndex].type = 'reservation';
  }
  
  // Create organizer participant
  const organizerParticipant: Participant = {
    id: `organizer-${Date.now()}`,
    name: playerName,
    email: playerEmail,
    phone: playerPhone,
    isOrganizer: true
  };
  
  const newReservation: Reservation = {
    id: `res-${Date.now()}`,
    timeSlotId,
    courtId: timeSlot.courtId,
    playerName,
    playerEmail,
    playerPhone,
    players,
    participants: [organizerParticipant, ...participants],
    createdAt: new Date().toISOString(),
    comments: [],
  };
  
  reservations.push(newReservation);
  
  // Ensure consistency after creating reservation
  ensureReservationConsistency();
  
  return newReservation;
};

// Block/Unblock time slot functions
export const blockTimeSlot = (timeSlotId: string): boolean => {
  // Validate blocking operation
  const validation = validateTimeSlotBlocking(timeSlotId);
  if (!validation.isValid) {
    console.error(`Cannot block time slot: ${validation.error}`);
    return false;
  }
  
  const slotIndex = timeSlots.findIndex(slot => slot.id === timeSlotId);
  if (slotIndex !== -1) {
    timeSlots[slotIndex].blocked = true;
    timeSlots[slotIndex].available = false;
    ensureReservationConsistency();
    return true;
  }
  return false;
};

export const unblockTimeSlot = (timeSlotId: string): boolean => {
  const slotIndex = timeSlots.findIndex(slot => slot.id === timeSlotId);
  if (slotIndex !== -1) {
    timeSlots[slotIndex].blocked = false;
    // Only set available to true if there's no reservation
    const hasReservation = reservations.find(res => res.timeSlotId === timeSlotId);
    if (!hasReservation) {
      timeSlots[slotIndex].available = true;
    }
    ensureReservationConsistency();
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
    duprRating: 5.2,
    createdAt: new Date().toISOString(),
    comments: [
      {
        id: '1',
        text: 'Premium member since 2022. Excellent player, helps with new member orientation. Advanced level player.',
        authorId: 'admin',
        authorName: 'Admin',
        createdAt: new Date().toISOString(),
      }
    ],
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-987-6543',
    membershipType: 'basic',
    duprRating: 2.8,
    createdAt: new Date().toISOString(),
    comments: [
      {
        id: '2',
        text: 'Basic member, interested in upgrading to premium. Has requested private lessons. Beginner level player.',
        authorId: 'admin',
        authorName: 'Admin',
        createdAt: new Date().toISOString(),
      }
    ],
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '555-456-7890',
    membershipType: 'premium',
    duprRating: 4.1,
    createdAt: new Date().toISOString(),
    comments: [],
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    phone: '555-321-0987',
    membershipType: 'basic',
    createdAt: new Date().toISOString(),
    comments: [],
  },
  {
    id: '5',
    name: 'Alex Rodriguez',
    email: 'alex@example.com',
    phone: '555-654-3210',
    membershipType: 'admin',
    duprRating: 6.5,
    createdAt: new Date().toISOString(),
    comments: [
      {
        id: '3',
        text: 'Admin user with extensive pickleball experience. Expert level player.',
        authorId: 'admin',
        authorName: 'Admin',
        createdAt: new Date().toISOString(),
      }
    ],
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
    specialties: ['Junior Programs', 'Advanced Training'],
    bio: 'Former professional player specializing in youth development.',
    hourlyRate: 95,
    createdAt: new Date().toISOString(),
  },
];

// Create time slots for clinics (moved before clinics array usage)
export const createClinicTimeSlots = (clinic: Clinic) => {
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
           comments: timeSlots[existingSlotIndex].comments || [],
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
           comments: [],
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
          comments: [],
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
  // Validate reservation creation
  const validation = validateReservationCreation(timeSlotId);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  const timeSlot = timeSlots.find(slot => slot.id === timeSlotId)!; // We know it exists from validation

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
    comments: [],
  };
  
  reservations.push(newReservation);
  
  // Ensure consistency after creating reservation
  ensureReservationConsistency();
  
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

// Helper function to update reservation comments
export const updateReservationComments = (reservationId: string, comments: Comment[]): boolean => {
  const reservationIndex = reservations.findIndex(r => r.id === reservationId);
  if (reservationIndex !== -1) {
    reservations[reservationIndex].comments = comments;
    return true;
  }
  return false;
};

// Helper function to update user comments
export const updateUserComments = (userId: string, comments: Comment[]): boolean => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].comments = comments;
    return true;
  }
  return false;
};

// Helper function to update time slot comments
export const updateTimeSlotComments = (timeSlotId: string, comments: Comment[]): boolean => {
  const timeSlotIndex = timeSlots.findIndex(ts => ts.id === timeSlotId);
  if (timeSlotIndex !== -1) {
    timeSlots[timeSlotIndex].comments = comments;
    return true;
  }
  return false;
};

// Centralized function to get reservation status for any time slot
export const getTimeSlotReservationStatus = (timeSlotId: string) => {
  const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
  if (!timeSlot) return null;
  
  const reservation = reservations.find(res => res.timeSlotId === timeSlotId);
  const clinic = timeSlot.type === 'clinic' && timeSlot.clinicId 
    ? clinics.find(c => c.id === timeSlot.clinicId) 
    : null;
  
  // Use same consistent logic as getTimeSlotsWithStatusForDate
  const isBlocked = timeSlot.blocked;
  const isClinic = timeSlot.type === 'clinic' && clinic !== null;
  const isReserved = !timeSlot.available && !isBlocked && !isClinic && reservation !== null;
  const isAvailable = timeSlot.available && !isBlocked;
  
  let status: 'available' | 'reserved' | 'blocked' | 'clinic';
  if (isBlocked) {
    status = 'blocked';
  } else if (isClinic) {
    status = 'clinic';
  } else if (isReserved) {
    status = 'reserved';
  } else {
    status = 'available';
  }
  
  return {
    timeSlot,
    reservation,
    clinic,
    isAvailable,
    isReserved,
    isBlocked,
    isClinic,
    status
  };
};

// Centralized function to get all reservations for a specific date
export const getReservationsForDate = (date: string) => {
  return reservations.filter(reservation => {
    const slot = timeSlots.find(s => s.id === reservation.timeSlotId);
    return slot && slot.date === date;
  });
};

// Centralized function to get all time slots with their reservation status for a date
export const getTimeSlotsWithStatusForDate = (date: string, courtId?: string) => {
  // First check if the day is open according to current settings
  const slotDate = new Date(date);
  const dayOfWeek = slotDate.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  const daySettings = getDaySettings(dayName);
  
  // If the day is closed, return empty array
  if (!daySettings || !daySettings.isOpen) {
    return [];
  }
  
  const dateSlots = timeSlots.filter(
    slot => slot.date === date && (!courtId || slot.courtId === courtId)
  );
  
  return dateSlots.map(slot => {
    const reservation = reservations.find(res => res.timeSlotId === slot.id);
    const clinic = slot.type === 'clinic' && slot.clinicId 
      ? clinics.find(c => c.id === slot.clinicId) 
      : null;
    
    // Determine status using consistent logic
    const isBlocked = slot.blocked;
    const isClinic = slot.type === 'clinic' && clinic !== null;
    const isReserved = !slot.available && !isBlocked && !isClinic && reservation !== null;
    const isAvailable = slot.available && !isBlocked;
    
    let status: 'available' | 'reserved' | 'blocked' | 'clinic';
    if (isBlocked) {
      status = 'blocked';
    } else if (isClinic) {
      status = 'clinic';
    } else if (isReserved) {
      status = 'reserved';
    } else {
      status = 'available';
    }
    
    return {
      ...slot,
      reservation,
      clinic,
      isAvailable,
      isReserved,
      isBlocked,
      isClinic,
      status
    };
  });
};

// Centralized function to get slot status for a specific court, date, and hour
export const getSlotStatusForCourtDateTime = (courtId: string, date: string, hour: number) => {
  // Check if the day is open according to current settings
  const slotDate = new Date(date);
  const dayOfWeek = slotDate.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  const daySettings = getDaySettings(dayName);
  
  // If the day is closed, return unavailable status
  if (!daySettings || !daySettings.isOpen) {
    return {
      available: false,
      reserved: false,
      blocked: false,
      isClinic: false,
      slot: null,
      reservation: null,
      clinic: null,
      isAvailable: false,
      isReserved: false,
      isBlocked: false,
      status: 'unavailable' as const
    };
  }
  
  const timeSlotsWithStatus = getTimeSlotsWithStatusForDate(date);
  
  const relevantSlots = timeSlotsWithStatus.filter(
    slot => slot.courtId === courtId && parseInt(slot.startTime.split(":")[0]) === hour
  );

  if (relevantSlots.length === 0) {
    return { 
      available: false, 
      reserved: false, 
      blocked: false, 
      isClinic: false, 
      slot: null,
      reservation: null,
      clinic: null,
      status: 'unavailable' as const
    };
  }

  const slotWithStatus = relevantSlots[0];
  
  return {
    available: slotWithStatus.isAvailable,
    reserved: slotWithStatus.isReserved,
    blocked: slotWithStatus.isBlocked,
    isClinic: slotWithStatus.isClinic,
    slot: slotWithStatus,
    reservation: slotWithStatus.reservation,
    clinic: slotWithStatus.clinic,
    status: slotWithStatus.status
  };
};

// Centralized function to get slot status for a specific court and Date object with hour
export const getSlotStatusForCourtDateTimeObj = (court: { id: string }, date: Date, hour: number) => {
  const dateString = date.toISOString().split('T')[0];
  return getSlotStatusForCourtDateTime(court.id, dateString, hour);
};

// Function to refresh reservation data and ensure consistency
export const refreshReservationData = () => {
  // Ensure all time slots have the correct reservation status
  ensureReservationConsistency();
  
  // Log current state for debugging
  console.log('Reservation data refreshed:');
  console.log(`- Total time slots: ${timeSlots.length}`);
  console.log(`- Total reservations: ${reservations.length}`);
  console.log(`- Available slots: ${timeSlots.filter(s => s.available).length}`);
  console.log(`- Reserved slots: ${timeSlots.filter(s => !s.available && !s.blocked && s.type !== 'clinic').length}`);
  console.log(`- Clinic slots: ${timeSlots.filter(s => s.type === 'clinic').length}`);
  console.log(`- Blocked slots: ${timeSlots.filter(s => s.blocked).length}`);
};

// Call refresh function after initial data setup
export const initializeData = () => {
  // Create sample reservations
  createSampleReservations();
  
  // Create time slots for existing clinics
  clinics.forEach(clinic => {
    createClinicTimeSlots(clinic);
  });
  
  // Ensure consistency
  ensureReservationConsistency();
  
  // Log initial state
  console.log('Data initialization complete');
  refreshReservationData();
};

// Initialize data with consistency checks
// Moved to end of file to ensure all data arrays are defined first

// Function to validate reservation data integrity
export const validateReservationIntegrity = () => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for orphaned reservations
  const validTimeSlotIds = new Set(timeSlots.map(slot => slot.id));
  const orphanedReservations = reservations.filter(res => !validTimeSlotIds.has(res.timeSlotId));
  
  if (orphanedReservations.length > 0) {
    errors.push(`Found ${orphanedReservations.length} orphaned reservations without corresponding time slots`);
  }
  
  // Check for time slots with inconsistent status
  timeSlots.forEach(slot => {
    const reservation = reservations.find(res => res.timeSlotId === slot.id);
    const clinic = slot.type === 'clinic' && slot.clinicId 
      ? clinics.find(c => c.id === slot.clinicId) 
      : null;
    
    // Check if blocked slots are marked as available
    if (slot.blocked && slot.available) {
      errors.push(`Time slot ${slot.id} is blocked but marked as available`);
    }
    
    // Check if reserved slots are marked as available
    if (reservation && slot.available && slot.type !== 'clinic') {
      errors.push(`Time slot ${slot.id} has a reservation but is marked as available`);
    }
    
    // Check if clinic slots are marked as unavailable
    if (slot.type === 'clinic' && !slot.available) {
      warnings.push(`Clinic time slot ${slot.id} is marked as unavailable`);
    }
    
    // Check if time slot type matches its actual status
    if (slot.type === 'reservation' && !reservation) {
      errors.push(`Time slot ${slot.id} is marked as reservation type but has no reservation`);
    }
    
    if (slot.type === 'clinic' && !clinic) {
      errors.push(`Time slot ${slot.id} is marked as clinic type but has no clinic`);
    }
  });
  
  // Check for duplicate reservations
  const reservationTimeSlotIds = reservations.map(res => res.timeSlotId);
  const duplicateTimeSlotIds = reservationTimeSlotIds.filter((id, index) => 
    reservationTimeSlotIds.indexOf(id) !== index
  );
  
  if (duplicateTimeSlotIds.length > 0) {
    errors.push(`Found duplicate reservations for time slots: ${duplicateTimeSlotIds.join(', ')}`);
  }
  
  return { errors, warnings, isValid: errors.length === 0 };
};

// Function to fix common data inconsistencies
export const fixDataInconsistencies = () => {
  console.log('Fixing data inconsistencies...');
  
  // Remove orphaned reservations
  const validTimeSlotIds = new Set(timeSlots.map(slot => slot.id));
  const validReservations = reservations.filter(res => validTimeSlotIds.has(res.timeSlotId));
  
  if (validReservations.length !== reservations.length) {
    const removedCount = reservations.length - validReservations.length;
    reservations.length = 0;
    reservations.push(...validReservations);
    console.log(`Removed ${removedCount} orphaned reservations`);
  }
  
  // Fix time slot status inconsistencies
  timeSlots.forEach(slot => {
    const reservation = reservations.find(res => res.timeSlotId === slot.id);
    
    if (slot.blocked) {
      slot.available = false;
    } else if (slot.type === 'clinic') {
      slot.available = true;
    } else if (reservation) {
      slot.available = false;
      slot.type = 'reservation';
    } else {
      slot.available = true;
      slot.type = undefined;
    }
  });
  
  console.log('Data inconsistencies fixed');
};

// Validation functions to prevent status inconsistencies
export const validateReservationCreation = (timeSlotId: string): { isValid: boolean; error?: string } => {
  const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
  
  if (!timeSlot) {
    return { isValid: false, error: 'Time slot not found' };
  }
  
  if (timeSlot.blocked) {
    return { isValid: false, error: 'Cannot book a blocked time slot' };
  }
  
  // Check if slot is already reserved (unless it's a clinic)
  if (!timeSlot.available && timeSlot.type !== 'clinic') {
    return { isValid: false, error: 'Time slot is not available for reservation' };
  }
  
  // Check if there's already a reservation for this slot
  const existingReservation = reservations.find(res => res.timeSlotId === timeSlotId);
  if (existingReservation && timeSlot.type !== 'clinic') {
    return { isValid: false, error: 'Time slot already has a reservation' };
  }
  
  return { isValid: true };
};

export const validateTimeSlotBlocking = (timeSlotId: string): { isValid: boolean; error?: string } => {
  const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
  
  if (!timeSlot) {
    return { isValid: false, error: 'Time slot not found' };
  }
  
  // Check if there's an existing reservation
  const existingReservation = reservations.find(res => res.timeSlotId === timeSlotId);
  if (existingReservation) {
    return { isValid: false, error: 'Cannot block a time slot with an existing reservation' };
  }
  
  // Check if it's a clinic slot
  if (timeSlot.type === 'clinic') {
    return { isValid: false, error: 'Cannot block a clinic time slot' };
  }
  
  return { isValid: true };
};

export const validateClinicCreation = (timeSlotId: string): { isValid: boolean; error?: string } => {
  const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
  
  if (!timeSlot) {
    return { isValid: false, error: 'Time slot not found' };
  }
  
  if (timeSlot.blocked) {
    return { isValid: false, error: 'Cannot create clinic on a blocked time slot' };
  }
  
  // Check if there's already a reservation (non-clinic)
  const existingReservation = reservations.find(res => res.timeSlotId === timeSlotId);
  if (existingReservation && timeSlot.type !== 'clinic') {
    return { isValid: false, error: 'Cannot create clinic on a time slot with existing reservation' };
  }
  
  return { isValid: true };
};

// Function to get all items with comments
export const getAllItemsWithComments = () => {
  const itemsWithComments: Array<{
    type: 'reservation' | 'user' | 'timeSlot';
    id: string;
    comments: Comment[];
    commentCount: number;
    latestComment?: string;
    title: string;
    subtitle: string;
    date?: string;
    time?: string;
    court?: string;
    slotId?: string;
  }> = [];

  // Get reservations with comments
  reservations.forEach(reservation => {
    if (reservation.comments && reservation.comments.length > 0) {
      const timeSlot = timeSlots.find(ts => ts.id === reservation.timeSlotId);
      const court = courts.find(c => c.id === reservation.courtId);
      
      itemsWithComments.push({
        type: 'reservation',
        id: reservation.id,
        comments: reservation.comments,
        commentCount: reservation.comments.length,
        latestComment: reservation.comments[reservation.comments.length - 1].text,
        title: reservation.playerName,
        subtitle: `${reservation.players} player${reservation.players !== 1 ? 's' : ''}`,
        date: timeSlot?.date,
        time: timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : '',
        court: court?.name,
        slotId: reservation.timeSlotId,
      });
    }
  });

  // Get users with comments
  users.forEach(user => {
    if (user.comments && user.comments.length > 0) {
      itemsWithComments.push({
        type: 'user',
        id: user.id,
        comments: user.comments,
        commentCount: user.comments.length,
        latestComment: user.comments[user.comments.length - 1].text,
        title: user.name,
        subtitle: `${user.membershipType} member`,
        date: user.createdAt,
      });
    }
  });

  // Get time slots with comments (blocked slots, special status, or actual comments)
  timeSlots.forEach(slot => {
    if (slot.blocked || slot.type === 'clinic' || (slot.comments && slot.comments.length > 0)) {
      const court = courts.find(c => c.id === slot.courtId);
      const clinic = slot.type === 'clinic' && slot.clinicId 
        ? clinics.find(c => c.id === slot.clinicId) 
        : null;
      
      let comments: Comment[] = slot.comments || [];
      let title = '';
      let subtitle = '';
      
      if (slot.blocked) {
        title = `Blocked Slot - ${court?.name}`;
        subtitle = 'Court unavailable';
        // Add system comment for blocked slots if no comments exist
        if (comments.length === 0) {
          comments = [{
            id: `system-${slot.id}`,
            text: 'Time slot is blocked',
            authorId: 'system',
            authorName: 'System',
            createdAt: new Date().toISOString(),
          }];
        }
      } else if (clinic) {
        title = clinic.name;
        subtitle = `Coach: ${coaches.find(c => c.id === clinic.coachId)?.name || 'Unknown'}`;
        // Add system comment for clinics if no comments exist
        if (comments.length === 0) {
          comments = [{
            id: `system-${slot.id}`,
            text: `Clinic: ${clinic.name} - ${clinic.description}`,
            authorId: 'system',
            authorName: 'System',
            createdAt: new Date().toISOString(),
          }];
        }
      } else {
        title = `Time Slot - ${court?.name}`;
        subtitle = 'Available time slot';
      }
      
      if (comments.length > 0) {
        itemsWithComments.push({
          type: 'timeSlot',
          id: slot.id,
          comments,
          commentCount: comments.length,
          latestComment: comments[comments.length - 1].text,
          title,
          subtitle,
          date: slot.date,
          time: `${slot.startTime} - ${slot.endTime}`,
          court: court?.name,
          slotId: slot.id,
        });
      }
    }
  });

  // Sort by date (most recent first) and then by type
  return itemsWithComments.sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return 0;
  });
};

// Legacy function for backward compatibility (deprecated)
export const getAllItemsWithNotes = () => {
  const itemsWithComments = getAllItemsWithComments();
  return itemsWithComments.map(item => ({
    ...item,
    notes: item.latestComment || '',
  }));
};

// Function to get all time slots with notes or special status
export const getTimeSlotsWithNotes = () => {
  const slotsWithNotes: Array<{
    id: string;
    courtId: string;
    courtName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'blocked' | 'clinic' | 'reserved' | 'available';
    notes: string;
    reservation?: any;
    clinic?: any;
  }> = [];

  timeSlots.forEach(slot => {
    const court = courts.find(c => c.id === slot.courtId);
    const reservation = reservations.find(r => r.timeSlotId === slot.id);
    const clinic = slot.type === 'clinic' && slot.clinicId 
      ? clinics.find(c => c.id === slot.clinicId) 
      : null;
    
    let notes = '';
    let status: 'blocked' | 'clinic' | 'reserved' | 'available' = 'available';
    
    if (slot.blocked) {
      status = 'blocked';
      notes = 'Time slot is blocked';
    } else if (clinic) {
      status = 'clinic';
      notes = `Clinic: ${clinic.name} - ${clinic.description}`;
    } else if (reservation && reservation.comments && reservation.comments.length > 0) {
      status = 'reserved';
      notes = reservation.comments[reservation.comments.length - 1].text;
    } else if (slot.available) {
      status = 'available';
      notes = 'Available time slot';
    }
    
    // Only include slots that have meaningful notes or special status
    // For reservations, only include if they have actual notes
    if ((notes !== 'Available time slot' && notes !== '') || slot.blocked || slot.type === 'clinic') {
      slotsWithNotes.push({
        id: slot.id,
        courtId: slot.courtId,
        courtName: court?.name || 'Unknown Court',
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status,
        notes,
        reservation,
        clinic,
      });
    }
  });

  // Sort by date (most recent first) and then by time
  return slotsWithNotes.sort((a, b) => {
    const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateComparison !== 0) return dateComparison;
    return a.startTime.localeCompare(b.startTime);
  });
};

// Initialize data with consistency checks - called at the end to ensure all data arrays are defined
initializeData();

