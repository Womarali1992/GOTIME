import type { TimeSlot, Reservation, User, Comment } from '@/lib/types';

// Enriched TimeSlot with additional display properties
export interface EnrichedTimeSlot extends TimeSlot {
  courtName: string;
  status: 'blocked' | 'available' | 'reserved' | 'clinic';
  reservation?: Reservation;
  clinic?: any;
  notes: string; // Legacy notes format (comments joined)
}

// Enriched item for comments display
export interface EnrichedCommentItem {
  id: string;
  type: 'reservation' | 'user' | 'timeSlot';
  title: string;
  subtitle: string;
  court: string;
  date: string;
  time: string;
  commentCount: number;
  latestComment: string;
  comments: Comment[];
  // Original item properties
  [key: string]: any;
}

// Data structure returned by getAllItemsWithComments
export interface ItemsWithComments {
  reservations: EnrichedCommentItem[];
  users: EnrichedCommentItem[];
  timeSlots: EnrichedCommentItem[];
}
