import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get all users
router.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

// Get user by ID
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Create user
router.post('/', (req, res) => {
  const { name, email, phone, duprRating, preferredPosition } = req.body;
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO users (id, name, email, phone, duprRating, preferredPosition, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    insert.run(id, name, email, phone, duprRating, preferredPosition, createdAt);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json(user);
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', (req, res) => {
  const { name, email, phone, duprRating, preferredPosition } = req.body;
  const updatedAt = new Date().toISOString();

  const update = db.prepare(`
    UPDATE users
    SET name = ?, email = ?, phone = ?, duprRating = ?, preferredPosition = ?, updatedAt = ?
    WHERE id = ?
  `);

  try {
    const result = update.run(name, email, phone, duprRating, preferredPosition, updatedAt, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(204).send();
});

export default router;
