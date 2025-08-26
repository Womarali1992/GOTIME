import { z } from 'zod';

// Enhanced type definitions for better type safety

// Common validation patterns
const isoString = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Must be a valid ISO date string'
});

const timeString = z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format');

const emailString = z.string().email('Must be a valid email address');

const positiveNumber = (min: number = 0) => z.number().min(min, `Must be at least ${min}`);

const ratingRange = z.number().min(1.0, 'Rating must be at least 1.0').max(8.0, 'Rating cannot exceed 8.0');

// Base schemas
export const CommentSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Comment cannot be empty'),
  authorId: z.string(),
  authorName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const CourtSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Court name is required'),
  location: z.string().min(1, 'Location is required'),
  indoor: z.boolean(),
});

export const TimeSlotSchema = z.object({
  id: z.string(),
  courtId: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  available: z.boolean(),
  blocked: z.boolean(),
  type: z.enum(['clinic', 'reservation']).optional(),
  clinicId: z.string().optional(),
  comments: z.array(CommentSchema).default([]),
});

// Participant schema for individual players in a reservation
export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  isOrganizer: z.boolean().default(false),
});

export const ReservationSchema = z.object({
  id: z.string(),
  timeSlotId: z.string(),
  courtId: z.string(),
  playerName: z.string().min(1, 'Player name is required'),
  playerEmail: z.string().email('Invalid email format'),
  playerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  players: z.number().min(1, 'At least 1 player required').max(4, 'Maximum 4 players allowed'),
  participants: z.array(ParticipantSchema).optional().default([]),
  createdAt: z.string(),
  comments: z.array(CommentSchema).default([]),
  // Payment-related fields for clinic reservations
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  paymentIntentId: z.string().optional(),
  amountPaid: z.number().min(0).optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  membershipType: z.enum(['basic', 'premium', 'admin']),
  duprRating: z.number().min(1.0, 'DUPR rating must be at least 1.0').max(8.0, 'DUPR rating cannot exceed 8.0').optional(),
  createdAt: z.string(),
  comments: z.array(CommentSchema).default([]),
  friends: z.array(z.string()).default([]).optional(),
});

export const CoachSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  specialties: z.array(z.string()).min(1, 'At least one specialty required'),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  createdAt: z.string(),
});

export const ClinicSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Clinic name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  coachId: z.string(),
  courtId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  maxParticipants: z.number().min(1, 'At least 1 participant required'),
  price: z.number().min(0, 'Price must be positive'),
  createdAt: z.string(),
});

export const DaySettingsSchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  isOpen: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  timeSlotDuration: z.number().min(15, 'Minimum slot duration is 15 minutes'),
  breakTime: z.number().min(0, 'Break time cannot be negative'),
});





export const ReservationSettingsSchema = z.object({
  id: z.string(),
  courtName: z.string().min(1, 'Court name is required').default('Pickleball Court'),
  advanceBookingLimit: z.number().min(1, 'Advance booking limit must be at least 1 hour'),
  cancellationDeadline: z.number().min(0, 'Cancellation deadline cannot be negative'),
  maxPlayersPerSlot: z.number().min(1, 'Maximum players must be at least 1'),
  minPlayersPerSlot: z.number().min(1, 'Minimum players must be at least 1'),
  allowWalkIns: z.boolean(),
  requirePayment: z.boolean(),
  timeSlotVisibilityPeriod: z.enum(['1_week', '2_weeks', '4_weeks', '6_weeks', '8_weeks']).default('2_weeks'),
  operatingHours: z.array(DaySettingsSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Input schemas for creating new entities
export const CreateCourtSchema = CourtSchema.omit({ id: true });
export const CreateTimeSlotSchema = TimeSlotSchema.omit({ id: true });
export const CreateReservationSchema = ReservationSchema.omit({ id: true, createdAt: true });
export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });
export const CreateCoachSchema = CoachSchema.omit({ id: true, createdAt: true });
export const CreateClinicSchema = ClinicSchema.omit({ id: true, createdAt: true });
export const CreateCommentSchema = CommentSchema.omit({ id: true, createdAt: true });



// Update schemas (all fields optional except id)
export const UpdateReservationSchema = ReservationSchema.partial().required({ id: true });
export const UpdateUserSchema = UserSchema.partial().required({ id: true });
export const UpdateCoachSchema = CoachSchema.partial().required({ id: true });
export const UpdateClinicSchema = ClinicSchema.partial().required({ id: true });
export const UpdateTimeSlotSchema = TimeSlotSchema.partial().required({ id: true });



// Export types
export type Comment = z.infer<typeof CommentSchema>;
export type Court = z.infer<typeof CourtSchema>;
export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type Participant = z.infer<typeof ParticipantSchema>;
export type Reservation = z.infer<typeof ReservationSchema>;
export type User = z.infer<typeof UserSchema>;
export type Coach = z.infer<typeof CoachSchema>;
export type Clinic = z.infer<typeof ClinicSchema>;
export type DaySettings = z.infer<typeof DaySettingsSchema>;
export type ReservationSettings = z.infer<typeof ReservationSettingsSchema>;



export type CreateCourt = z.infer<typeof CreateCourtSchema>;
export type CreateTimeSlot = z.infer<typeof CreateTimeSlotSchema>;
export type CreateReservation = z.infer<typeof CreateReservationSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type CreateCoach = z.infer<typeof CreateCoachSchema>;
export type CreateClinic = z.infer<typeof CreateClinicSchema>;
export type CreateComment = z.infer<typeof CreateCommentSchema>;



export type UpdateReservation = z.infer<typeof UpdateReservationSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UpdateCoach = z.infer<typeof UpdateCoachSchema>;
export type UpdateClinic = z.infer<typeof UpdateClinicSchema>;
export type UpdateTimeSlot = z.infer<typeof UpdateTimeSlotSchema>;


