import express from 'express';
import { query, getClient, safeParseJSON } from '../db/database.js';
import { ensureTimeSlotExists } from '../utils/time-slot-utils.js';

const router = express.Router();

function parseReservation(row: any) {
  return {
    ...row,
    participants: safeParseJSON(row.participants, []),
    comments: safeParseJSON(row.comments, []),
    isOpenPlay: Boolean(row.isOpenPlay),
    openPlaySlots: row.openPlaySlots ?? undefined,
    maxOpenPlayers: row.maxOpenPlayers ?? undefined,
    openPlayGroupId: row.openPlayGroupId ?? undefined,
  };
}

// Get all reservations
router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM reservations WHERE tenant_id = $1', [req.tenantId]);
  res.json(rows.map(parseReservation));
});

// Get reservation by ID
router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM reservations WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  res.json(parseReservation(rows[0]));
});

// Get reservation by time slot ID
router.get('/timeslot/:timeSlotId', async (req, res) => {
  const { rows } = await query('SELECT * FROM reservations WHERE "timeSlotId" = $1 AND tenant_id = $2', [req.params.timeSlotId, req.tenantId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  res.json(parseReservation(rows[0]));
});

// Create reservation
router.post('/', async (req, res) => {
  console.log('[Reservations] POST /api/reservations - Request body:', req.body);
  const tenantId = req.tenantId!;

  const {
    timeSlotId, courtId, playerName, playerEmail, playerPhone,
    players, participants, isOpenPlay, openPlaySlots, maxOpenPlayers,
    openPlayGroupId, paymentStatus, paymentIntentId, amountPaid,
    comments, createdById
  } = req.body;

  // Server-side validation
  const validationErrors: string[] = [];
  if (!timeSlotId || typeof timeSlotId !== 'string') validationErrors.push('Time slot ID is required');
  if (!courtId || typeof courtId !== 'string') validationErrors.push('Court ID is required');
  if (!playerName || typeof playerName !== 'string' || !playerName.trim()) validationErrors.push('Player name is required');
  if (!playerEmail || typeof playerEmail !== 'string' || !playerEmail.trim()) validationErrors.push('Player email is required');
  if (!playerPhone || typeof playerPhone !== 'string' || !playerPhone.trim()) validationErrors.push('Player phone is required');
  if (players !== undefined && (typeof players !== 'number' || players < 1 || players > 4)) validationErrors.push('Players must be a number between 1 and 4');

  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors.join(', '), validationErrors });
  }

  // Check if court exists for this tenant
  const courtResult = await query('SELECT id FROM courts WHERE id = $1 AND tenant_id = $2', [courtId, tenantId]);
  if (courtResult.rows.length === 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: `Court with ID "${courtId}" does not exist`,
      validationErrors: [`Court with ID "${courtId}" does not exist`]
    });
  }

  const id = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const slotResult = await ensureTimeSlotExists(client, timeSlotId, tenantId);
    if (!slotResult.success) {
      throw new Error(slotResult.error || 'Invalid time slot ID format');
    }

    await client.query(
      `INSERT INTO reservations (
        id, tenant_id, "timeSlotId", "courtId", "playerName", "playerEmail", "playerPhone",
        players, participants, "isOpenPlay", "openPlaySlots", "maxOpenPlayers", "openPlayGroupId",
        "paymentStatus", "paymentIntentId", "amountPaid", comments, "createdById", "createdAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        id, tenantId, timeSlotId, courtId, playerName, playerEmail, playerPhone,
        players || 1, JSON.stringify(participants || []),
        isOpenPlay || false, isOpenPlay ? (openPlaySlots || 1) : null,
        isOpenPlay ? (maxOpenPlayers || 8) : null, isOpenPlay ? (openPlayGroupId || null) : null,
        paymentStatus || null, paymentIntentId || null, amountPaid || null,
        JSON.stringify(comments || []), createdById || null, createdAt
      ]
    );

    await client.query(
      `UPDATE time_slots SET available = FALSE, "updatedAt" = $1 WHERE id = $2 AND tenant_id = $3`,
      [createdAt, timeSlotId, tenantId]
    );

    const reservationResult = await client.query('SELECT * FROM reservations WHERE id = $1', [id]);
    await client.query('COMMIT');

    res.status(201).json(parseReservation(reservationResult.rows[0]));
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Reservations] Failed to create reservation:', error);
    if (error.message?.includes('Invalid time slot')) {
      return res.status(400).json({ error: 'Validation failed', details: error.message, validationErrors: [error.message] });
    }
    res.status(500).json({ error: 'Failed to create reservation', details: error.message });
  } finally {
    client.release();
  }
});

// Update reservation
router.put('/:id', async (req, res) => {
  const {
    playerName, playerEmail, playerPhone, players, participants,
    isOpenPlay, openPlaySlots, maxOpenPlayers, openPlayGroupId,
    paymentStatus, paymentIntentId, amountPaid, comments, createdById
  } = req.body;
  const updatedAt = new Date().toISOString();

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (playerName !== undefined) { fields.push(`"playerName" = $${paramIndex++}`); values.push(playerName); }
  if (playerEmail !== undefined) { fields.push(`"playerEmail" = $${paramIndex++}`); values.push(playerEmail); }
  if (playerPhone !== undefined) { fields.push(`"playerPhone" = $${paramIndex++}`); values.push(playerPhone); }
  if (players !== undefined) { fields.push(`players = $${paramIndex++}`); values.push(players); }
  if (participants !== undefined) { fields.push(`participants = $${paramIndex++}`); values.push(JSON.stringify(participants)); }
  if (paymentStatus !== undefined) { fields.push(`"paymentStatus" = $${paramIndex++}`); values.push(paymentStatus); }
  if (paymentIntentId !== undefined) { fields.push(`"paymentIntentId" = $${paramIndex++}`); values.push(paymentIntentId); }
  if (amountPaid !== undefined) { fields.push(`"amountPaid" = $${paramIndex++}`); values.push(amountPaid); }
  if (isOpenPlay !== undefined) { fields.push(`"isOpenPlay" = $${paramIndex++}`); values.push(isOpenPlay); }
  if (openPlaySlots !== undefined) { fields.push(`"openPlaySlots" = $${paramIndex++}`); values.push(openPlaySlots); }
  if (maxOpenPlayers !== undefined) { fields.push(`"maxOpenPlayers" = $${paramIndex++}`); values.push(maxOpenPlayers); }
  if (openPlayGroupId !== undefined) { fields.push(`"openPlayGroupId" = $${paramIndex++}`); values.push(openPlayGroupId); }
  if (comments !== undefined) { fields.push(`comments = $${paramIndex++}`); values.push(JSON.stringify(comments)); }
  if (createdById !== undefined) { fields.push(`"createdById" = $${paramIndex++}`); values.push(createdById); }

  fields.push(`"updatedAt" = $${paramIndex++}`);
  values.push(updatedAt);
  values.push(req.params.id);
  values.push(req.tenantId);

  const result = await query(
    `UPDATE reservations SET ${fields.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}`,
    values
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const { rows } = await query('SELECT * FROM reservations WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  res.json(parseReservation(rows[0]));
});

// Join an open play reservation
router.post('/:id/join', async (req, res) => {
  const { name, email, phone } = req.body;
  const tenantId = req.tenantId!;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  const { rows: resRows } = await query('SELECT * FROM reservations WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
  const reservation = resRows[0];
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  if (!reservation.isOpenPlay) {
    return res.status(400).json({ error: 'This reservation is not open for joining' });
  }

  const participants = safeParseJSON(reservation.participants, []);
  const maxPlayers = reservation.maxOpenPlayers || 8;
  const groupId = reservation.openPlayGroupId;

  let totalPlayersInGroup = 0;
  let groupReservations: any[] = [];
  if (groupId) {
    const { rows: groupRows } = await query('SELECT * FROM reservations WHERE "openPlayGroupId" = $1 AND tenant_id = $2', [groupId, tenantId]);
    groupReservations = groupRows;
    totalPlayersInGroup = groupReservations.reduce((sum: number, r: any) => sum + (r.players || 1), 0);
  } else {
    totalPlayersInGroup = reservation.players || 1;
    groupReservations = [reservation];
  }

  if (totalPlayersInGroup >= maxPlayers) {
    return res.status(400).json({ error: 'All spots are filled' });
  }

  for (const gr of groupReservations) {
    const grParticipants = safeParseJSON(gr.participants, []);
    if (gr.playerEmail === email || grParticipants.some((p: any) => p.email === email)) {
      return res.status(400).json({ error: 'You have already joined this game' });
    }
  }

  const newParticipant = {
    id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name, email, phone, isOrganizer: false,
  };
  participants.push(newParticipant);

  const newPlayers = (reservation.players || 1) + 1;
  const newGroupTotal = totalPlayersInGroup + 1;
  const isFull = newGroupTotal >= maxPlayers;
  const updatedAt = new Date().toISOString();

  await query(
    `UPDATE reservations SET participants = $1, players = $2, "isOpenPlay" = $3, "updatedAt" = $4 WHERE id = $5 AND tenant_id = $6`,
    [JSON.stringify(participants), newPlayers, !isFull, updatedAt, req.params.id, tenantId]
  );

  if (isFull && groupId) {
    await query(
      `UPDATE reservations SET "isOpenPlay" = FALSE, "updatedAt" = $1 WHERE "openPlayGroupId" = $2 AND id != $3 AND tenant_id = $4`,
      [updatedAt, groupId, req.params.id, tenantId]
    );
  }

  const { rows: updatedRows } = await query('SELECT * FROM reservations WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
  res.json(parseReservation(updatedRows[0]));
});

// Delete reservation
router.delete('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM reservations WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  const reservation = rows[0];

  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  await query('DELETE FROM reservations WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);

  await query(
    `UPDATE time_slots SET available = TRUE, "updatedAt" = $1 WHERE id = $2 AND tenant_id = $3`,
    [new Date().toISOString(), reservation.timeSlotId, req.tenantId]
  );

  res.status(204).send();
});

export default router;
