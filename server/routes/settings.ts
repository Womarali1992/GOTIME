import express from 'express';
import { query, safeParseJSON } from '../db/database.js';

const router = express.Router();

const DEFAULT_OPERATING_HOURS = [
  { dayOfWeek: 'monday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'tuesday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'wednesday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'thursday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'friday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'saturday', isOpen: true, startTime: '08:00', endTime: '18:00', timeSlotDuration: 60, breakTime: 15 },
  { dayOfWeek: 'sunday', isOpen: true, startTime: '10:00', endTime: '18:00', timeSlotDuration: 60, breakTime: 15 }
];

// Get settings
router.get('/', async (req, res) => {
  let { rows } = await query('SELECT * FROM settings WHERE tenant_id = $1', [req.tenantId]);
  let settings = rows[0];

  if (!settings) {
    const createdAt = new Date().toISOString();
    const id = `settings-${req.tenantId}`;
    await query(
      `INSERT INTO settings (id, tenant_id, "courtName", "advanceBookingLimit", "cancellationDeadline", "maxPlayersPerSlot", "minPlayersPerSlot", "allowWalkIns", "requirePayment", "timeSlotVisibilityPeriod", "operatingHours", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, req.tenantId, 'Pickleball Court', 24, 2, 4, 1, true, false, '4_weeks', JSON.stringify(DEFAULT_OPERATING_HOURS), createdAt]
    );
    const result = await query('SELECT * FROM settings WHERE tenant_id = $1', [req.tenantId]);
    settings = result.rows[0];
  }

  res.json({
    ...settings,
    allowWalkIns: Boolean(settings.allowWalkIns),
    requirePayment: Boolean(settings.requirePayment),
    operatingHours: safeParseJSON(settings.operatingHours, [])
  });
});

// Update settings
router.put('/', async (req, res) => {
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
    const dayStatusMap = new Map<string, boolean>();
    operatingHours.forEach((day: any) => {
      dayStatusMap.set(day.dayOfWeek, day.isOpen);
    });

    const { rows: allSlots } = await query('SELECT * FROM time_slots WHERE tenant_id = $1', [req.tenantId]);

    for (const slot of allSlots) {
      const resCount = await query('SELECT COUNT(*) as count FROM reservations WHERE "timeSlotId" = $1 AND tenant_id = $2', [slot.id, req.tenantId]);
      const hasReservation = parseInt(resCount.rows[0].count) > 0;
      const hasClinic = slot.type === 'clinic' && slot.clinicId;

      const slotDate = new Date(slot.date);
      const dayOfWeek = slotDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const isDayOpen = dayStatusMap.get(dayName) ?? false;

      if (!isDayOpen && !hasReservation && !hasClinic) {
        await query('DELETE FROM time_slots WHERE id = $1 AND tenant_id = $2', [slot.id, req.tenantId]);
        continue;
      }

      if (isDayOpen && slot.blocked && !hasReservation && !hasClinic) {
        await query('UPDATE time_slots SET blocked = FALSE, available = TRUE, "updatedAt" = $1 WHERE id = $2 AND tenant_id = $3', [updatedAt, slot.id, req.tenantId]);
        continue;
      }

      if (!hasReservation && !hasClinic && !slot.blocked) {
        await query('DELETE FROM time_slots WHERE id = $1 AND tenant_id = $2', [slot.id, req.tenantId]);
      }
    }
  }

  const result = await query(
    `UPDATE settings
     SET "courtName" = $1,
         "advanceBookingLimit" = $2,
         "cancellationDeadline" = $3,
         "maxPlayersPerSlot" = $4,
         "minPlayersPerSlot" = $5,
         "allowWalkIns" = $6,
         "requirePayment" = $7,
         "timeSlotVisibilityPeriod" = $8,
         "operatingHours" = $9,
         "updatedAt" = $10
     WHERE tenant_id = $11`,
    [courtName, advanceBookingLimit, cancellationDeadline, maxPlayersPerSlot, minPlayersPerSlot, allowWalkIns, requirePayment, timeSlotVisibilityPeriod, JSON.stringify(operatingHours || []), updatedAt, req.tenantId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Settings not found' });
  }

  const { rows } = await query('SELECT * FROM settings WHERE tenant_id = $1', [req.tenantId]);
  const settings = rows[0];
  res.json({
    ...settings,
    allowWalkIns: Boolean(settings.allowWalkIns),
    requirePayment: Boolean(settings.requirePayment),
    operatingHours: safeParseJSON(settings.operatingHours, [])
  });
});

export default router;
