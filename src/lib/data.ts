
import { Court, TimeSlot, Reservation } from './types';

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
