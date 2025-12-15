import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get all time slots
router.get('/', (req, res) => {
  const { date, courtId } = req.query;

  let query = 'SELECT * FROM time_slots';
  const params: any[] = [];

  if (date || courtId) {
    query += ' WHERE';
    if (date) {
      query += ' date = ?';
      params.push(date);
    }
    if (courtId) {
      query += date ? ' AND courtId = ?' : ' courtId = ?';
      params.push(courtId);
    }
  }

  const slots = db.prepare(query).all(...params);
  res.json(slots.map(slot => ({
    ...slot,
    available: Boolean(slot.available),
    blocked: Boolean(slot.blocked),
    comments: JSON.parse(slot.comments || '[]')
  })));
});

// Get time slots for date (with dynamic generation)
router.get('/date/:date', async (req, res) => {
  const { date } = req.params;

  // Get settings
  const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1');
  if (!settings) {
    return res.status(500).json({ error: 'Settings not found' });
  }

  const operatingHours = JSON.parse(settings.operatingHours || '[]');

  // Check if day is open
  const slotDate = new Date(date);
  const dayOfWeek = slotDate.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const daySettings = operatingHours.find(day => day.dayOfWeek === dayName);

  if (!daySettings || !daySettings.isOpen) {
    return res.json([]);
  }

  // Get all courts
  const courts = db.prepare('SELECT * FROM courts').all();
  const startHour = parseInt(daySettings.startTime.split(':')[0]);
  const endHour = parseInt(daySettings.endTime.split(':')[0]);

  const generatedSlots = [];

  for (const court of courts) {
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const slotId = `${court.id}-${date}-${hour}`;

      // Check if slot exists in database
      let storedSlot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(slotId);
      const reservation = db.prepare('SELECT * FROM reservations WHERE timeSlotId = ?').get(slotId);

      let slot: any;

      if (storedSlot) {
        slot = {
          ...storedSlot,
          available: Boolean(storedSlot.available),
          blocked: Boolean(storedSlot.blocked),
          comments: JSON.parse(storedSlot.comments || '[]')
        };
      } else {
        // Create virtual slot
        const now = new Date();
        const slotDateTime = new Date(slotDate);
        slotDateTime.setHours(hour, 0, 0, 0);
        const isPast = slotDateTime < now;

        slot = {
          id: slotId,
          courtId: court.id,
          startTime,
          endTime,
          date,
          available: !isPast,
          blocked: false,
          comments: []
        };
      }

      // Enrich with status
      const clinic = slot.type === 'clinic' && slot.clinicId
        ? db.prepare('SELECT * FROM clinics WHERE id = ?').get(slot.clinicId)
        : null;
      const social = slot.type === 'social' && slot.socialId
        ? db.prepare('SELECT * FROM socials WHERE id = ?').get(slot.socialId)
        : null;

      const isReserved = !!reservation && slot.type !== 'clinic' && slot.type !== 'social';
      const isBlocked = slot.blocked || false;
      const isClinic = slot.type === 'clinic';
      const isSocial = slot.type === 'social';
      const isAvailable = !isReserved && !isBlocked && !isClinic && !isSocial;

      let status = 'available';
      if (isBlocked) status = 'blocked';
      else if (isClinic) status = 'clinic';
      else if (isSocial) status = 'social';
      else if (isReserved) status = 'reserved';

      generatedSlots.push({
        ...slot,
        reservation: reservation ? {
          ...reservation,
          participants: JSON.parse(reservation.participants || '[]'),
          comments: JSON.parse(reservation.comments || '[]')
        } : null,
        clinic: clinic ? {
          ...clinic,
          participants: JSON.parse(clinic.participants || '[]')
        } : null,
        social: social ? {
          ...social,
          votes: JSON.parse(social.votes || '[]')
        } : null,
        isAvailable,
        isReserved,
        isBlocked,
        isClinic,
        isSocial,
        status
      });
    }
  }

  res.json(generatedSlots);
});

// Create or update time slot
router.post('/', (req, res) => {
  const { id, courtId, date, startTime, endTime, available, blocked, type, clinicId, socialId, comments } = req.body;
  const slotId = id || `${courtId}-${date}-${parseInt(startTime.split(':')[0])}`;
  const createdAt = new Date().toISOString();

  const insert = db.prepare(`
    INSERT OR REPLACE INTO time_slots (id, courtId, date, startTime, endTime, available, blocked, type, clinicId, socialId, comments, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    slotId,
    courtId,
    date,
    startTime,
    endTime,
    available ? 1 : 0,
    blocked ? 1 : 0,
    type,
    clinicId,
    socialId,
    JSON.stringify(comments || []),
    createdAt,
    createdAt
  );

  const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(slotId);
  res.status(201).json({
    ...slot,
    available: Boolean(slot.available),
    blocked: Boolean(slot.blocked),
    comments: JSON.parse(slot.comments || '[]')
  });
});

// Update time slot
router.put('/:id', (req, res) => {
  const { available, blocked, type, clinicId, socialId, comments } = req.body;
  const updatedAt = new Date().toISOString();

  const update = db.prepare(`
    UPDATE time_slots
    SET available = ?, blocked = ?, type = ?, clinicId = ?, socialId = ?, comments = ?, updatedAt = ?
    WHERE id = ?
  `);

  const result = update.run(
    available !== undefined ? (available ? 1 : 0) : undefined,
    blocked !== undefined ? (blocked ? 1 : 0) : undefined,
    type,
    clinicId,
    socialId,
    comments ? JSON.stringify(comments) : undefined,
    updatedAt,
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Time slot not found' });
  }

  const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(req.params.id);
  res.json({
    ...slot,
    available: Boolean(slot.available),
    blocked: Boolean(slot.blocked),
    comments: JSON.parse(slot.comments || '[]')
  });
});

// Delete time slot
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM time_slots WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Time slot not found' });
  }

  res.status(204).send();
});

export default router;