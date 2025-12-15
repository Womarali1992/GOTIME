import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get all coaches
router.get('/', (req, res) => {
  const coaches = db.prepare('SELECT * FROM coaches').all();
  res.json(coaches.map(coach => ({
    ...coach,
    specialties: JSON.parse(coach.specialties || '[]')
  })));
});

// Get coach by ID
router.get('/:id', (req, res) => {
  const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(req.params.id);
  if (!coach) {
    return res.status(404).json({ error: 'Coach not found' });
  }
  res.json({
    ...coach,
    specialties: JSON.parse(coach.specialties || '[]')
  });
});

// Create coach
router.post('/', (req, res) => {
  const { name, email, phone, bio, specialties, hourlyRate } = req.body;
  const id = `coach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO coaches (id, name, email, phone, bio, specialties, hourlyRate, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    insert.run(id, name, email, phone, bio, JSON.stringify(specialties || []), hourlyRate, createdAt);
    const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(id);
    res.status(201).json({
      ...coach,
      specialties: JSON.parse(coach.specialties || '[]')
    });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create coach' });
  }
});

// Update coach
router.put('/:id', (req, res) => {
  const { name, email, phone, bio, specialties, hourlyRate } = req.body;
  const updatedAt = new Date().toISOString();

  const update = db.prepare(`
    UPDATE coaches
    SET name = ?, email = ?, phone = ?, bio = ?, specialties = ?, hourlyRate = ?, updatedAt = ?
    WHERE id = ?
  `);

  try {
    const result = update.run(name, email, phone, bio, JSON.stringify(specialties || []), hourlyRate, updatedAt, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(req.params.id);
    res.json({
      ...coach,
      specialties: JSON.parse(coach.specialties || '[]')
    });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update coach' });
  }
});

// Delete coach
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM coaches WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Coach not found' });
  }

  res.status(204).send();
});

export default router;
