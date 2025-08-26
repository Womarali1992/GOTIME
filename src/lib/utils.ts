import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ReservationSettings, DaySettings, TimeSlot } from "./types"
import { dataService } from "./services/data-service"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Time utility functions
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

// Reservation settings validation
export function validateReservationSettings(settings: Partial<ReservationSettings>): string[] {
  const errors: string[] = [];
  
  if (settings.advanceBookingLimit !== undefined && (settings.advanceBookingLimit < 1 || settings.advanceBookingLimit > 168)) {
    errors.push('Advance booking limit must be between 1 and 168 hours');
  }
  
  if (settings.cancellationDeadline !== undefined && (settings.cancellationDeadline < 0 || settings.cancellationDeadline > 24)) {
    errors.push('Cancellation deadline must be between 0 and 24 hours');
  }
  
  if (settings.maxPlayersPerSlot !== undefined && (settings.maxPlayersPerSlot < 1 || settings.maxPlayersPerSlot > 8)) {
    errors.push('Maximum players per slot must be between 1 and 8');
  }
  
  if (settings.minPlayersPerSlot !== undefined && settings.maxPlayersPerSlot !== undefined) {
    if (settings.minPlayersPerSlot > settings.maxPlayersPerSlot) {
      errors.push('Minimum players cannot exceed maximum players');
    }
  }
  
  return errors;
}

export function validateDaySettings(daySettings: DaySettings[]): string[] {
  const errors: string[] = [];
  
  daySettings.forEach((day, index) => {
    if (day.isOpen) {
      if (!isValidTimeFormat(day.startTime)) {
        errors.push(`Invalid start time format for ${day.dayOfWeek}`);
      }
      if (!isValidTimeFormat(day.endTime)) {
        errors.push(`Invalid end time format for ${day.dayOfWeek}`);
      }
      
      if (timeToMinutes(day.startTime) >= timeToMinutes(day.endTime)) {
        errors.push(`Start time must be before end time for ${day.dayOfWeek}`);
      }
      
      if (day.timeSlotDuration < 15 || day.timeSlotDuration > 240) {
        errors.push(`Time slot duration for ${day.dayOfWeek} must be between 15 and 240 minutes`);
      }
      
      if (day.breakTime < 0 || day.breakTime > 60) {
        errors.push(`Break time for ${day.dayOfWeek} must be between 0 and 60 minutes`);
      }
    }
  });
  
  return errors;
}

// Standardized timeslot status determination
export function getTimeSlotStatus(slot: TimeSlot) {
  const reservation = dataService.reservationService.getAllReservations().find(res => res.timeSlotId === slot.id);
  const clinic = slot.type === 'clinic' && slot.clinicId 
    ? dataService.clinicService.getClinicById(slot.clinicId) 
    : null;
  
  const isBlocked = slot.blocked;
  const isClinic = slot.type === 'clinic' && clinic !== null;
  const isReserved = !slot.available && !isBlocked && !isClinic && reservation !== null;
  // Fixed: Clinic slots should NOT be considered available for regular booking
  const isAvailable = slot.available && !isBlocked && !isClinic;
  
  return {
    available: isAvailable,
    reserved: isReserved,
    blocked: isBlocked,
    isClinic: isClinic,
    slot: slot,
  };
}

// Get status text for display - now uses centralized function
export function getTimeSlotStatusText(slot: TimeSlot): string {
  const status = getTimeSlotStatus(slot);
  
  if (status.blocked) return "Blocked";
  if (status.isClinic) return "Clinic";
  if (status.reserved) return "Reserved";
  return "Available";
}

// Get CSS classes for timeslot styling
export function getTimeSlotStatusClasses(slot: TimeSlot, isPast: boolean = false): string {
  if (isPast) {
    return "bg-gray-300/30 text-gray-500 cursor-not-allowed";
  }
  
  if (slot.blocked) {
    return "bg-gray-500/30 text-gray-100 cursor-not-allowed";
  }
  
  if (slot.type === 'clinic') {
    return "bg-yellow-500/30 text-yellow-800 border border-yellow-500/50 hover:bg-yellow-500/40 cursor-pointer";
  }
  
  if (slot.available) {
    return "bg-primary/20 text-primary hover:bg-primary/30 hover:shadow-sm border border-transparent hover:border-primary/30 cursor-pointer";
  }
  
  return "bg-secondary/20 text-secondary cursor-not-allowed";
}
