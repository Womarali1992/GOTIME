import { z } from 'zod';

const passwordFields = {
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
};

const passwordRefine = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;

const passwordRefineMessage = { message: "Passwords don't match", path: ['confirmPassword'] as const };

export const venueSignupSchema = z.object({
  venueName: z.string().min(1, 'Venue name is required'),
  address: z.string().optional(),
  numCourts: z.string().min(1, 'Number of courts is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Please enter a valid email'),
  contactPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  ...passwordFields,
}).refine(passwordRefine, passwordRefineMessage);

export const coachSignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.string().optional(),
  hourlyRate: z.string().optional(),
  mode: z.enum(['standalone', 'join']),
  venueId: z.string().optional(),
  ...passwordFields,
}).refine(passwordRefine, passwordRefineMessage).refine(
  (data) => data.mode !== 'join' || (data.venueId && data.venueId.length > 0),
  { message: 'Please select a venue', path: ['venueId'] }
);

export const socialGroupSignupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  organizerName: z.string().min(1, 'Organizer name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  description: z.string().optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'all-levels', '']).optional(),
  ...passwordFields,
}).refine(passwordRefine, passwordRefineMessage);

export const playerSignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  duprRating: z.string().optional(),
  tenantId: z.string().min(1, 'Please select a venue'),
  ...passwordFields,
}).refine(passwordRefine, passwordRefineMessage);

export type VenueSignupData = z.infer<typeof venueSignupSchema>;
export type CoachSignupData = z.infer<typeof coachSignupSchema>;
export type SocialGroupSignupData = z.infer<typeof socialGroupSignupSchema>;
export type PlayerSignupData = z.infer<typeof playerSignupSchema>;
