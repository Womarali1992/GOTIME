import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get all reservations
router.get('/', (req, res) => {
  const reservations = db.prepare('SELECT * FROM reservations').all();
  res.json(reservations.map(res => ({
    ...res,
    participants: JSON.parse(res.participants || '[]'),
    comments: JSON.parse(res.comments || '[]')
  })));
});

// Get reservation by ID
router.get('/:id', (req, res) => {
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  res.json({
    ...reservation,
    participants: JSON.parse(reservation.participants || '[]'),
    comments: JSON.parse(reservation.comments || '[]')
  });
});

// Get reservation by time slot ID
router.get('/timeslot/:timeSlotId', (req, res) => {
  const reservation = db.prepare('SELECT * FROM reservations WHERE timeSlotId = ?').get(req.params.timeSlotId);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  res.json({
    ...reservation,
    participants: JSON.parse(reservation.participants || '[]'),
    comments: JSON.parse(reservation.comments || '[]')
  });
});

// Create reservation
router.post('/', (req, res) => {
  const {
    timeSlotId,
    courtId,
    playerName,
    playerEmail,
    playerPhone,
    players,
    participants,
    socialId,
    paymentStatus,
    paymentIntentId,
    amountPaid,
    comments
  } = req.body;
  const id = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO reservations (
      id, timeSlotId, courtId, playerName, playerEmail, playerPhone,
      players, participants, socialId, paymentStatus, paymentIntentId,
      amountPaid, comments, createdAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    insert.run(
      id,
      timeSlotId,
      courtId,
      playerName,
      playerEmail,
      playerPhone,
      players || 1,
      JSON.stringify(participants || []),
      socialId || null,
      paymentStatus || null,
      paymentIntentId || null,
      amountPaid || null,
      JSON.stringify(comments || []),
      createdAt
    );

    // Update time slot to mark as not available
    db.prepare(`
      UPDATE time_slots
      SET available = 0, updatedAt = ?
      WHERE id = ?
    `).run(createdAt, timeSlotId);

    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    res.status(201).json({
      ...reservation,
      participants: JSON.parse(reservation.participants || '[]'),
      comments: JSON.parse(reservation.comments || '[]')
    });
  } catch (error: any) {
    console.error('[Reservations] Failed to create reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation', details: error.message });
  }
});

// Update reservation
router.put('/:id', (req, res) => {
  const {
    playerName,
    playerEmail,
    playerPhone,
    players,
    participants,
    socialId,
    paymentStatus,
    paymentIntentId,
    amountPaid,
    comments
  } = req.body;
  const updatedAt = new Date().toISOString();

  // Build dynamic update query based on provided fields
  const fieldsToUpdate: string[] = [];
  const values: any[] = [];

  if (playerName !== undefined) { fieldsToUpdate.push('playerName = ?'); values.push(playerName); }
  if (playerEmail !== undefined) { fieldsToUpdate.push('playerEmail = ?'); values.push(playerEmail); }
  if (playerPhone !== undefined) { fieldsToUpdate.push('playerPhone = ?'); values.push(playerPhone); }
  if (players !== undefined) { fieldsToUpdate.push('players = ?'); values.push(players); }
  if (participants !== undefined) { fieldsToUpdate.push('participants = ?'); values.push(JSON.stringify(participants)); }
  if (socialId !== undefined) { fieldsToUpdate.push('socialId = ?'); values.push(socialId); }
  if (paymentStatus !== undefined) { fieldsToUpdate.push('paymentStatus = ?'); values.push(paymentStatus); }
  if (paymentIntentId !== undefined) { fieldsToUpdate.push('paymentIntentId = ?'); values.push(paymentIntentId); }
  if (amountPaid !== undefined) { fieldsToUpdate.push('amountPaid = ?'); values.push(amountPaid); }
  if (comments !== undefined) { fieldsToUpdate.push('comments = ?'); values.push(JSON.stringify(comments)); }

  fieldsToUpdate.push('updatedAt = ?');
  values.push(updatedAt);
  values.push(req.params.id);

  const update = db.prepare(`
    UPDATE reservations
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = ?
  `);

  const result = update.run(...values);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  res.json({
    ...reservation,
    participants: JSON.parse(reservation.participants || '[]'),
    comments: JSON.parse(reservation.comments || '[]')
  });
});

// Delete reservation
router.delete('/:id', (req, res) => {
  // Get reservation before deleting to update time slot
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);

  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  // Delete the reservation
  const result = db.prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  // Update time slot to mark as available again
  db.prepare(`
    UPDATE time_slots
    SET available = 1, updatedAt = ?
    WHERE id = ?
  `).run(new Date().toISOString(), reservation.timeSlotId);

  res.status(204).send();
});

export default router;
