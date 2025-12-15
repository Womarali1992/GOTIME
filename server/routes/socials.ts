import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get all socials
router.get('/', (req, res) => {
  const { status } = req.query;

  let query = 'SELECT * FROM socials';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  const socials = db.prepare(query).all(...params);
  res.json(socials.map(social => ({
    ...social,
    votes: JSON.parse(social.votes || '[]')
  })));
});

// Get social by ID
router.get('/:id', (req, res) => {
  const social = db.prepare('SELECT * FROM socials WHERE id = ?').get(req.params.id);
  if (!social) {
    return res.status(404).json({ error: 'Social not found' });
  }
  res.json({
    ...social,
    votes: JSON.parse(social.votes || '[]')
  });
});

// Get socials for date
router.get('/date/:date', (req, res) => {
  const socials = db.prepare('SELECT * FROM socials WHERE date = ?').all(req.params.date);
  res.json(socials.map(social => ({
    ...social,
    votes: JSON.parse(social.votes || '[]')
  })));
});

// Create social
router.post('/', (req, res) => {
  const { title, description, date, startTime, endTime, timeSlotId, status, votes, createdById } = req.body;
  const id = `social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO socials (id, title, description, date, startTime, endTime, timeSlotId, status, votes, createdById, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    insert.run(
      id,
      title,
      description,
      date,
      startTime,
      endTime,
      timeSlotId,
      status || 'active',
      JSON.stringify(votes || []),
      createdById,
      createdAt
    );

    // Update time slot if exists
    if (timeSlotId) {
      db.prepare(`
        UPDATE time_slots
        SET type = 'social', socialId = ?, available = 1, updatedAt = ?
        WHERE id = ?
      `).run(id, createdAt, timeSlotId);
    }

    const social = db.prepare('SELECT * FROM socials WHERE id = ?').get(id);
    res.status(201).json({
      ...social,
      votes: JSON.parse(social.votes || '[]')
    });
  } catch (error: any) {
    console.error('[Socials] Failed to create social:', error);
    res.status(500).json({ error: 'Failed to create social', details: error.message });
  }
});

// Update social
router.put('/:id', (req, res) => {
  const { title, description, status, votes } = req.body;
  const updatedAt = new Date().toISOString();

  const update = db.prepare(`
    UPDATE socials
    SET title = ?, description = ?, status = ?, votes = ?, updatedAt = ?
    WHERE id = ?
  `);

  const result = update.run(
    title,
    description,
    status,
    JSON.stringify(votes || []),
    updatedAt,
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Social not found' });
  }

  const social = db.prepare('SELECT * FROM socials WHERE id = ?').get(req.params.id);
  res.json({
    ...social,
    votes: JSON.parse(social.votes || '[]')
  });
});

// Add vote to social
router.post('/:id/vote', (req, res) => {
  const { userId, vote } = req.body;

  const social = db.prepare('SELECT * FROM socials WHERE id = ?').get(req.params.id);
  if (!social) {
    return res.status(404).json({ error: 'Social not found' });
  }

  const votes = JSON.parse(social.votes || '[]');

  // Remove existing vote from user
  const filteredVotes = votes.filter((v: any) => v.userId !== userId);

  // Add new vote
  filteredVotes.push({
    userId,
    vote,
    votedAt: new Date().toISOString()
  });

  const updatedAt = new Date().toISOString();
  db.prepare(`
    UPDATE socials
    SET votes = ?, updatedAt = ?
    WHERE id = ?
  `).run(JSON.stringify(filteredVotes), updatedAt, req.params.id);

  const updated = db.prepare('SELECT * FROM socials WHERE id = ?').get(req.params.id);
  res.json({
    ...updated,
    votes: JSON.parse(updated.votes || '[]')
  });
});

// Delete social
router.delete('/:id', (req, res) => {
  const social = db.prepare('SELECT * FROM socials WHERE id = ?').get(req.params.id);

  if (!social) {
    return res.status(404).json({ error: 'Social not found' });
  }

  // Clear time slot association
  if (social.timeSlotId) {
    db.prepare(`
      UPDATE time_slots
      SET type = NULL, socialId = NULL, updatedAt = ?
      WHERE id = ?
    `).run(new Date().toISOString(), social.timeSlotId);
  }

  db.prepare('DELETE FROM socials WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
