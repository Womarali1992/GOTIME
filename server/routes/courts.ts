import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get all courts
router.get('/', (req, res) => {
  const courts = db.prepare('SELECT * FROM courts').all();
  res.json(courts.map(court => ({
    ...court,
    amenities: JSON.parse(court.amenities || '[]')
  })));
});

// Get court by ID
router.get('/:id', (req, res) => {
  const court = db.prepare('SELECT * FROM courts WHERE id = ?').get(req.params.id);
  if (!court) {
    return res.status(404).json({ error: 'Court not found' });
  }
  res.json({
    ...court,
    amenities: JSON.parse(court.amenities || '[]')
  });
});

// Create court
router.post('/', (req, res) => {
  const { name, location, description, amenities } = req.body;
  const id = `court-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO courts (id, name, location, description, amenities, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(id, name, location, description, JSON.stringify(amenities || []), createdAt);

  const court = db.prepare('SELECT * FROM courts WHERE id = ?').get(id);
  res.status(201).json({
    ...court,
    amenities: JSON.parse(court.amenities || '[]')
  });
});

// Update court
router.put('/:id', (req, res) => {
  const { name, location, description, amenities } = req.body;
  const updatedAt = new Date().toISOString();

  const update = db.prepare(`
    UPDATE courts
    SET name = ?, location = ?, description = ?, amenities = ?, updatedAt = ?
    WHERE id = ?
  `);

  const result = update.run(name, location, description, JSON.stringify(amenities || []), updatedAt, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Court not found' });
  }

  const court = db.prepare('SELECT * FROM courts WHERE id = ?').get(req.params.id);
  res.json({
    ...court,
    amenities: JSON.parse(court.amenities || '[]')
  });
});

// Delete court
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM courts WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Court not found' });
  }

  res.status(204).send();
});

export default router;
