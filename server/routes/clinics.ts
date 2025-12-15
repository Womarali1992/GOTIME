import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get all clinics
router.get('/', (req, res) => {
  const clinics = db.prepare('SELECT * FROM clinics').all();
  res.json(clinics.map(clinic => ({
    ...clinic,
    participants: JSON.parse(clinic.participants || '[]')
  })));
});

// Get clinic by ID
router.get('/:id', (req, res) => {
  const clinic = db.prepare('SELECT * FROM clinics WHERE id = ?').get(req.params.id);
  if (!clinic) {
    return res.status(404).json({ error: 'Clinic not found' });
  }
  res.json({
    ...clinic,
    participants: JSON.parse(clinic.participants || '[]')
  });
});

// Create clinic
router.post('/', (req, res) => {
  const { coachId, title, description, date, startTime, endTime, timeSlotId, maxParticipants, participants, price, level } = req.body;
  const id = `clinic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO clinics (id, coachId, title, description, date, startTime, endTime, timeSlotId, maxParticipants, participants, price, level, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    insert.run(
      id,
      coachId,
      title,
      description,
      date,
      startTime,
      endTime,
      timeSlotId,
      maxParticipants || 8,
      JSON.stringify(participants || []),
      price || 0,
      level,
      createdAt
    );

    const clinic = db.prepare('SELECT * FROM clinics WHERE id = ?').get(id);
    res.status(201).json({
      ...clinic,
      participants: JSON.parse(clinic.participants || '[]')
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create clinic' });
  }
});

// Update clinic
router.put('/:id', (req, res) => {
  const { title, description, maxParticipants, participants, price, level } = req.body;
  const updatedAt = new Date().toISOString();

  const update = db.prepare(`
    UPDATE clinics
    SET title = ?, description = ?, maxParticipants = ?, participants = ?, price = ?, level = ?, updatedAt = ?
    WHERE id = ?
  `);

  const result = update.run(
    title,
    description,
    maxParticipants,
    JSON.stringify(participants || []),
    price,
    level,
    updatedAt,
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Clinic not found' });
  }

  const clinic = db.prepare('SELECT * FROM clinics WHERE id = ?').get(req.params.id);
  res.json({
    ...clinic,
    participants: JSON.parse(clinic.participants || '[]')
  });
});

// Delete clinic
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM clinics WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Clinic not found' });
  }

  res.status(204).send();
});

export default router;
