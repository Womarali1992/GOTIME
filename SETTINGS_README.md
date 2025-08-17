# Admin Settings Functionality

## Overview
The admin dashboard now includes a comprehensive settings functionality that allows administrators to configure how the reservation system operates.

## Features

### General Settings
- **Advance Booking Limit**: Configure how many hours in advance users can book reservations (1-168 hours)
- **Cancellation Deadline**: Set how many hours before a time slot users can cancel (0-24 hours)
- **Player Limits**: Set minimum and maximum players per reservation slot
- **Walk-ins**: Enable/disable same-day bookings
- **Payment Requirements**: Toggle whether payment confirmation is required

### Operating Hours
- **Day-by-Day Configuration**: Set different hours for each day of the week
- **Open/Closed Toggle**: Mark specific days as closed
- **Start/End Times**: Configure operating hours for each day
- **Time Slot Duration**: Set the length of each reservation slot (30 min - 2 hours)
- **Break Time**: Configure breaks between time slots (0-45 minutes)

## Usage

### Accessing Settings
1. Navigate to the Admin Dashboard
2. Click on the "Settings" tab
3. Click "Edit Settings" to make changes

### Editing Settings
1. Click "Edit Settings" button
2. Modify the desired settings
3. Click "Save Changes" to apply
4. Or click "Cancel" to discard changes

### Resetting to Defaults
- Use the "Reset to Defaults" button to restore original settings

## Technical Implementation

### Data Structure
```typescript
interface ReservationSettings {
  advanceBookingLimit: number;
  cancellationDeadline: number;
  maxPlayersPerSlot: number;
  minPlayersPerSlot: number;
  allowWalkIns: boolean;
  requirePayment: boolean;
  operatingHours: DaySettings[];
}

interface DaySettings {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  startTime: string;
  endTime: string;
  timeSlotDuration: number;
  breakTime: number;
}
```

### Validation
- All settings are validated before saving
- Time formats must be HH:MM (24-hour format)
- Start times must be before end times
- Player limits must be logical (min ≤ max)
- Time slot durations must be between 15-240 minutes

### Integration
- Settings affect time slot generation
- Operating hours determine available booking times
- Player limits are enforced during reservations
- Booking limits are applied to user reservations

## Default Values

### General Settings
- Advance Booking: 24 hours
- Cancellation Deadline: 2 hours
- Max Players: 4
- Min Players: 1
- Walk-ins: Enabled
- Payment Required: Disabled

### Operating Hours
- Monday-Friday: 8:00 AM - 10:00 PM (1-hour slots, 15-min breaks)
- Saturday: 9:00 AM - 8:00 PM (1-hour slots, 15-min breaks)
- Sunday: 9:00 AM - 6:00 PM (1-hour slots, 15-min breaks)

## Future Enhancements
- Export/Import settings
- Settings templates for different seasons
- Advanced scheduling rules
- Integration with external calendar systems
- Audit logging for setting changes
