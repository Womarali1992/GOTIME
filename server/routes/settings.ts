import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get settings
// Default operating hours used when no settings row exists
const DEFAULT_OPERATING_HOURS = [
  { dayOfWeek: 'monday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'tuesday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'wednesday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'thursday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'friday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'saturday', isOpen: true, startTime: '08:00', endTime: '18:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'sunday', isOpen: true, startTime: '10:00', endTime: '18:00', timeSlotDuration: 60, breakTime: 15 }
];

router.get('/', (req, res) => {
  let settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1');

  // Auto-create a settings row if missing so downstream routes always have data
  if (!settings) {
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO settings (id, courtName, advanceBookingLimit, cancellationDeadline, maxPlayersPerSlot, minPlayersPerSlot, allowWalkIns, requirePayment, timeSlotVisibilityPeriod, operatingHours, createdAt)
      VALUES ('1', 'Pickleball Court', 24, 2, 4, 1, 1, 0, '4_weeks', ?, ?)
    `).run(JSON.stringify(DEFAULT_OPERATING_HOURS), createdAt);
    settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1');
  }

  res.json({
    ...settings,
    // Make sure booleans are returned as actual booleans
    allowWalkIns: Boolean(settings.allowWalkIns),
    requirePayment: Boolean(settings.requirePayment),
    operatingHours: JSON.parse(settings.operatingHours || '[]')
  });
});

// Update settings
router.put('/', (req, res) => {
  const {
    courtName,
    advanceBookingLimit,
    cancellationDeadline,
    maxPlayersPerSlot,
    minPlayersPerSlot,
    allowWalkIns,
    requirePayment,
    timeSlotVisibilityPeriod,
    operatingHours
  } = req.body;

  const updatedAt = new Date().toISOString();

  // If operating hours changed, clean up time slots for closed days
  if (operatingHours) {
    // Build a map of which days are open/closed
    const dayStatusMap = new Map();
    operatingHours.forEach(day => {
      dayStatusMap.set(day.dayOfWeek, day.isOpen);
    });

    // Get all time slots
    const allSlots = db.prepare('SELECT * FROM time_slots').all();

    // Process each slot
    for (const slot of allSlots) {
      // Check if slot has a reservation or clinic
      const hasReservation = db.prepare('SELECT COUNT(*) as count FROM reservations WHERE timeSlotId = ?').get(slot.id);
      const hasClinic = slot.type === 'clinic' && slot.clinicId;
      const hasSocial = slot.type === 'social' && slot.socialId;

      // Get day of week for this slot
      const slotDate = new Date(slot.date);
      const dayOfWeek = slotDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const isDayOpen = dayStatusMap.get(dayName) ?? false;

      // If day is now closed, delete slots without reservations/clinics/socials
      if (!isDayOpen && !hasReservation?.count && !hasClinic && !hasSocial) {
        db.prepare('DELETE FROM time_slots WHERE id = ?').run(slot.id);
        continue;
      }

      // If day is open and slot is blocked but has no reservation/clinic/social, unblock it
      if (isDayOpen && slot.blocked && !hasReservation?.count && !hasClinic && !hasSocial) {
        db.prepare('UPDATE time_slots SET blocked = 0, available = 1, updatedAt = ? WHERE id = ?').run(updatedAt, slot.id);
        continue;
      }

      // Delete empty available slots to regenerate with new hours
      if (!hasReservation?.count && !hasClinic && !hasSocial && !slot.blocked) {
        db.prepare('DELETE FROM time_slots WHERE id = ?').run(slot.id);
      }
    }
  }

  const update = db.prepare(`
    UPDATE settings
    SET courtName = ?,
        advanceBookingLimit = ?,
        cancellationDeadline = ?,
        maxPlayersPerSlot = ?,
        minPlayersPerSlot = ?,
        allowWalkIns = ?,
        requirePayment = ?,
        timeSlotVisibilityPeriod = ?,
        operatingHours = ?,
        updatedAt = ?
    WHERE id = '1'
  `);

  const result = update.run(
    courtName,
    advanceBookingLimit,
    cancellationDeadline,
    maxPlayersPerSlot,
    minPlayersPerSlot,
    allowWalkIns ? 1 : 0,
    requirePayment ? 1 : 0,
    timeSlotVisibilityPeriod,
    JSON.stringify(operatingHours || []),
    updatedAt
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Settings not found' });
  }

  const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1');
  res.json({
    ...settings,
    allowWalkIns: Boolean(settings.allowWalkIns),
    requirePayment: Boolean(settings.requirePayment),
    operatingHours: JSON.parse(settings.operatingHours || '[]')
  });
});

export default router;
