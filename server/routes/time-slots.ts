import express from 'express';
import { query, safeParseJSON } from '../db/database.js';
import { DEFAULT_OPERATING_HOURS } from '../utils/defaults.js';

const router = express.Router();

function formatSlot(slot: any) {
  return {
    ...slot,
    available: Boolean(slot.available),
    blocked: Boolean(slot.blocked),
    comments: safeParseJSON(slot.comments, [])
  };
}

// Get all time slots
router.get('/', async (req, res) => {
  const { date, courtId } = req.query;

  let sql = 'SELECT * FROM time_slots WHERE tenant_id = $1';
  const params: any[] = [req.tenantId];
  let paramIndex = 2;

  if (date) {
    sql += ` AND date = $${paramIndex++}`;
    params.push(date);
  }
  if (courtId) {
    sql += ` AND "courtId" = $${paramIndex++}`;
    params.push(courtId);
  }

  const { rows } = await query(sql, params);
  res.json(rows.map(formatSlot));
});

// Get time slots for date (with dynamic generation) - batch optimized
router.get('/date/:date', async (req, res) => {
  const { date } = req.params;
  const tenantId = req.tenantId!;

  // Get settings (auto-create if missing)
  let settingsResult = await query('SELECT * FROM settings WHERE tenant_id = $1', [tenantId]);
  if (settingsResult.rows.length === 0) {
    const createdAt = new Date().toISOString();
    const id = `settings-${tenantId}`;
    await query(
      `INSERT INTO settings (id, tenant_id, "courtName", "advanceBookingLimit", "cancellationDeadline", "maxPlayersPerSlot", "minPlayersPerSlot", "allowWalkIns", "requirePayment", "timeSlotVisibilityPeriod", "operatingHours", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, tenantId, 'Pickleball Court', 24, 2, 4, 1, true, false, '4_weeks', JSON.stringify(DEFAULT_OPERATING_HOURS), createdAt]
    );
    settingsResult = await query('SELECT * FROM settings WHERE tenant_id = $1', [tenantId]);
  }
  const settings = settingsResult.rows[0];
  const operatingHours = safeParseJSON(settings.operatingHours, []);

  // Check if day is open
  const slotDate = new Date(date);
  const dayOfWeek = slotDate.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const daySettings = operatingHours.find((day: any) => day.dayOfWeek === dayName);

  if (!daySettings || !daySettings.isOpen) {
    return res.json([]);
  }

  // Batch: get all courts, stored slots, reservations in parallel
  const [courtsResult, storedSlotsResult, reservationsResult] = await Promise.all([
    query('SELECT * FROM courts WHERE tenant_id = $1', [tenantId]),
    query('SELECT * FROM time_slots WHERE date = $1 AND tenant_id = $2', [date, tenantId]),
    query(`SELECT r.* FROM reservations r JOIN time_slots ts ON r."timeSlotId" = ts.id WHERE ts.date = $1 AND r.tenant_id = $2`, [date, tenantId]),
  ]);

  const courts = courtsResult.rows;
  const storedSlotsMap = new Map(storedSlotsResult.rows.map(s => [s.id, s]));
  const reservationsMap = new Map(reservationsResult.rows.map(r => [r.timeSlotId, r]));

  // Batch fetch clinics
  const clinicIds = storedSlotsResult.rows
    .filter(s => s.clinicId)
    .map(s => s.clinicId);

  let clinicsMap = new Map<string, any>();
  if (clinicIds.length > 0) {
    const placeholders = clinicIds.map((_, i) => `$${i + 1}`).join(', ');
    const clinicsResult = await query(`SELECT * FROM clinics WHERE id IN (${placeholders})`, clinicIds);
    clinicsMap = new Map(clinicsResult.rows.map(c => [c.id, c]));
  }

  // Use timeSlotDuration and breakTime from settings (fallback to 60/0)
  const duration = daySettings.timeSlotDuration || 60;
  const breakMins = daySettings.breakTime || 0;
  const step = duration + breakMins;

  // Parse start/end as total minutes from midnight
  const [startH, startM] = daySettings.startTime.split(':').map(Number);
  const [endH, endM] = daySettings.endTime.split(':').map(Number);
  const dayStartMinutes = startH * 60 + (startM || 0);
  const dayEndMinutes = endH * 60 + (endM || 0);

  const now = new Date();
  const generatedSlots: any[] = [];

  for (const court of courts) {
    for (let mins = dayStartMinutes; mins + duration <= dayEndMinutes; mins += step) {
      const slotStartH = Math.floor(mins / 60);
      const slotStartM = mins % 60;
      const slotEndMins = mins + duration;
      const slotEndH = Math.floor(slotEndMins / 60);
      const slotEndM = slotEndMins % 60;

      const startTime = `${slotStartH.toString().padStart(2, '0')}:${slotStartM.toString().padStart(2, '0')}`;
      const endTime = `${slotEndH.toString().padStart(2, '0')}:${slotEndM.toString().padStart(2, '0')}`;
      const slotId = `${court.id}-${date}-${startTime}`;

      // Look up stored slot with new ID format, falling back to legacy hour-only format
      const storedSlot = storedSlotsMap.get(slotId) || storedSlotsMap.get(`${court.id}-${date}-${slotStartH}`);
      const reservation = reservationsMap.get(slotId) || reservationsMap.get(`${court.id}-${date}-${slotStartH}`);

      const slotDateTime = new Date(slotDate);
      slotDateTime.setHours(slotStartH, slotStartM, 0, 0);
      const isPast = slotDateTime < now;

      let slot: any;

      if (storedSlot) {
        slot = {
          ...storedSlot,
          available: isPast ? false : Boolean(storedSlot.available),
          blocked: Boolean(storedSlot.blocked),
          comments: safeParseJSON(storedSlot.comments, [])
        };
      } else {
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

      const clinic = slot.clinicId ? clinicsMap.get(slot.clinicId) || null : null;
      const isClinic = !!clinic || slot.type === 'clinic';
      const isReserved = !!reservation && !isClinic;
      const isBlocked = slot.blocked || false;
      const isAvailable = !isPast && !isReserved && !isBlocked && !isClinic;

      let status = 'available';
      if (isPast && !isReserved && !isClinic) status = 'unavailable';
      else if (isBlocked) status = 'blocked';
      else if (isClinic) status = 'clinic';
      else if (isReserved) status = 'reserved';

      generatedSlots.push({
        ...slot,
        reservation: reservation ? {
          ...reservation,
          participants: safeParseJSON(reservation.participants, []),
          comments: safeParseJSON(reservation.comments, []),
          isOpenPlay: Boolean(reservation.isOpenPlay),
          openPlaySlots: reservation.openPlaySlots ?? undefined,
          maxOpenPlayers: reservation.maxOpenPlayers ?? undefined,
          openPlayGroupId: reservation.openPlayGroupId ?? undefined,
        } : null,
        clinic: clinic ? {
          ...clinic,
          participants: safeParseJSON(clinic.participants, [])
        } : null,
        isAvailable,
        isReserved,
        isBlocked,
        isClinic,
        status
      });
    }
  }

  res.json(generatedSlots);
});

// Create or update time slot
router.post('/', async (req, res) => {
  const { id, courtId, date, startTime, endTime, available, blocked, type, clinicId, comments } = req.body;
  const slotId = id || `${courtId}-${date}-${startTime}`;
  const createdAt = new Date().toISOString();

  await query(
    `INSERT INTO time_slots (id, tenant_id, "courtId", date, "startTime", "endTime", available, blocked, type, "clinicId", comments, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
     ON CONFLICT (id) DO UPDATE SET
       "courtId" = EXCLUDED."courtId",
       date = EXCLUDED.date,
       "startTime" = EXCLUDED."startTime",
       "endTime" = EXCLUDED."endTime",
       available = EXCLUDED.available,
       blocked = EXCLUDED.blocked,
       type = EXCLUDED.type,
       "clinicId" = EXCLUDED."clinicId",
       comments = EXCLUDED.comments,
       "updatedAt" = EXCLUDED."updatedAt"`,
    [slotId, req.tenantId, courtId, date, startTime, endTime, available, blocked, type, clinicId, JSON.stringify(comments || []), createdAt]
  );

  const { rows } = await query('SELECT * FROM time_slots WHERE id = $1 AND tenant_id = $2', [slotId, req.tenantId]);
  res.status(201).json(formatSlot(rows[0]));
});

// Update time slot
router.put('/:id', async (req, res) => {
  const { available, blocked, type, clinicId, comments } = req.body;
  const updatedAt = new Date().toISOString();

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (available !== undefined) { fields.push(`available = $${paramIndex++}`); values.push(available); }
  if (blocked !== undefined) { fields.push(`blocked = $${paramIndex++}`); values.push(blocked); }
  if (type !== undefined) { fields.push(`type = $${paramIndex++}`); values.push(type); }
  if (clinicId !== undefined) { fields.push(`"clinicId" = $${paramIndex++}`); values.push(clinicId); }
  if (comments !== undefined) { fields.push(`comments = $${paramIndex++}`); values.push(JSON.stringify(comments)); }
  fields.push(`"updatedAt" = $${paramIndex++}`);
  values.push(updatedAt);
  values.push(req.params.id);
  values.push(req.tenantId);

  const result = await query(
    `UPDATE time_slots SET ${fields.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}`,
    values
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Time slot not found' });
  }

  const { rows } = await query('SELECT * FROM time_slots WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  res.json(formatSlot(rows[0]));
});

// Delete time slot
router.delete('/:id', async (req, res) => {
  const result = await query('DELETE FROM time_slots WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Time slot not found' });
  }

  res.status(204).send();
});

export default router;
